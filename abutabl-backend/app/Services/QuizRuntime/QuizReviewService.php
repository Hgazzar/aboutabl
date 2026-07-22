<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Repositories\QuizRuntime\AttemptRepository;
use RuntimeException;

/**
 * F-009E Step 3 — Post-submission Review (read-only).
 *
 * Reads ONLY:
 * - QuizVersion.settings_frozen
 * - QuizSnapshot.payload
 * - quiz_attempt_answers
 *
 * Never reads live Quiz Definition.
 * Never recomputes grading.
 */
class QuizReviewService
{
    /** @var AttemptRepository */
    private $attempts;

    /** @var array<int, string> */
    private $reviewableStatuses = [
        QuizAttempt::STATUS_SUBMITTED,
        QuizAttempt::STATUS_AUTO_GRADED,
        QuizAttempt::STATUS_PENDING_MANUAL,
        QuizAttempt::STATUS_FINALIZED,
    ];

    public function __construct(AttemptRepository $attempts)
    {
        $this->attempts = $attempts;
    }

    /**
     * Build a review payload for a student-owned attempt.
     *
     * Input:
     * - attempt_id (required)
     * - student_id (required)
     *
     * @param  array<string, mixed>  $input
     * @return array{attempt: QuizAttempt, questions: array<int, array<string, mixed>>}
     */
    public function review(array $input): array
    {
        $attemptId = (int) ($input['attempt_id'] ?? 0);
        $studentId = (int) ($input['student_id'] ?? 0);

        $attempt = $this->attempts->findById($attemptId);
        if ($attempt === null) {
            throw new RuntimeException('Attempt not found.', 404);
        }

        if ($studentId <= 0 || (int) $attempt->student_id !== $studentId) {
            throw new RuntimeException('Forbidden.', 403);
        }

        if (! in_array((string) $attempt->status, $this->reviewableStatuses, true)) {
            throw new RuntimeException('Review is not allowed.', 403);
        }

        $attempt->loadMissing(['version', 'snapshot', 'answers']);

        $settings = [];
        if ($attempt->version !== null && is_array($attempt->version->settings_frozen)) {
            $settings = $attempt->version->settings_frozen;
        }

        $reviewAfterSubmit = $this->frozenBool($settings['review_after_submit'] ?? null);
        if (! $reviewAfterSubmit) {
            throw new RuntimeException('Review is not allowed.', 403);
        }

        $showCorrect = $this->frozenBool($settings['show_correct_answers'] ?? null);
        $showExplanations = $this->frozenBool($settings['show_explanations'] ?? null);

        $questions = $this->buildQuestions($attempt, $showCorrect, $showExplanations);

        return [
            'attempt' => $attempt,
            'questions' => $questions,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildQuestions(
        QuizAttempt $attempt,
        bool $showCorrect,
        bool $showExplanations
    ): array {
        $payload = [];
        if ($attempt->snapshot !== null && is_array($attempt->snapshot->payload)) {
            $payload = $attempt->snapshot->payload;
        }

        $snapshotQuestions = isset($payload['questions']) && is_array($payload['questions'])
            ? $payload['questions']
            : [];

        $byKey = [];
        foreach ($snapshotQuestions as $question) {
            if (! is_array($question)) {
                continue;
            }
            $key = (string) ($question['snapshot_question_key'] ?? '');
            if ($key === '') {
                continue;
            }
            $byKey[$key] = $question;
        }

        $ordered = $this->orderedQuestions($attempt, $byKey, $snapshotQuestions);

        $answersByKey = [];
        foreach ($attempt->answers as $answer) {
            $answersByKey[(string) $answer->snapshot_question_key] = $answer;
        }

        $out = [];
        foreach ($ordered as $question) {
            if (! is_array($question)) {
                continue;
            }

            $key = (string) ($question['snapshot_question_key'] ?? '');
            $answer = $answersByKey[$key] ?? null;

            $item = [
                'question_id' => isset($question['question_id']) ? (int) $question['question_id'] : null,
                'question_type' => $question['type'] ?? null,
                'student_answer' => $answer !== null ? $answer->response_payload : null,
                'is_correct' => $answer !== null ? $answer->is_correct : null,
                'score_awarded' => $this->scoreAwarded($answer),
                'max_score' => isset($question['max_score']) ? (float) $question['max_score'] : 0.0,
            ];

            if ($showCorrect) {
                $correctKey = isset($question['correct_key']) && is_array($question['correct_key'])
                    ? $question['correct_key']
                    : [];
                $item['correct_answer'] = array_key_exists('corAnswer', $correctKey)
                    ? $correctKey['corAnswer']
                    : null;
            }

            if ($showExplanations) {
                $explanation = array_key_exists('explanation', $question)
                    ? $question['explanation']
                    : null;
                if ($explanation !== null) {
                    $item['explanation'] = $explanation;
                }
            }

            $out[] = $item;
        }

        return $out;
    }

    /**
     * Preserve attempt question_order when present (presentation only).
     *
     * @param  array<string, array<string, mixed>>  $byKey
     * @param  array<int, mixed>  $snapshotQuestions
     * @return array<int, array<string, mixed>>
     */
    private function orderedQuestions(QuizAttempt $attempt, array $byKey, array $snapshotQuestions): array
    {
        $order = is_array($attempt->question_order) ? $attempt->question_order : null;
        if ($order === null || $order === []) {
            $fallback = [];
            foreach ($snapshotQuestions as $question) {
                if (is_array($question)) {
                    $fallback[] = $question;
                }
            }

            return $fallback;
        }

        $ordered = [];
        foreach ($order as $key) {
            $key = (string) $key;
            if (! isset($byKey[$key])) {
                continue;
            }
            $ordered[] = $byKey[$key];
            unset($byKey[$key]);
        }

        foreach ($byKey as $question) {
            $ordered[] = $question;
        }

        return $ordered;
    }

    /**
     * @param  \App\Models\QuizRuntime\QuizAttemptAnswer|null  $answer
     */
    private function scoreAwarded($answer): float
    {
        if ($answer === null) {
            return 0.0;
        }

        if ($answer->manual_score !== null) {
            return (float) $answer->manual_score;
        }

        if ($answer->auto_score !== null) {
            return (float) $answer->auto_score;
        }

        return 0.0;
    }

    /**
     * Missing review flags on old Versions → false.
     *
     * @param  mixed  $value
     */
    private function frozenBool($value): bool
    {
        if ($value === null) {
            return false;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
