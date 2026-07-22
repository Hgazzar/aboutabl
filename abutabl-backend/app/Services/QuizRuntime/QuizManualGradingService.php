<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizAttemptAnswer;
use App\Models\QuizRuntime\QuizResult;
use App\Models\User;
use App\Repositories\QuizRuntime\AnswerRepository;
use App\Repositories\QuizRuntime\AttemptRepository;
use App\Repositories\QuizRuntime\ResultRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * F-009D Sprint 2 Step 2 — Manual grading engine.
 * Grades needs_manual answers; calls QuizFinalizeService when all residual manual items are done.
 * Does not write Outbox directly (Finalize owns Outbox).
 */
class QuizManualGradingService
{
    /** @var AttemptRepository */
    private $attempts;

    /** @var AnswerRepository */
    private $answers;

    /** @var ResultRepository */
    private $results;

    /** @var QuizTeacherRuntimeReadService */
    private $teacherRead;

    /** @var QuizFinalizeService */
    private $finalize;

    public function __construct(
        AttemptRepository $attempts,
        AnswerRepository $answers,
        ResultRepository $results,
        QuizTeacherRuntimeReadService $teacherRead,
        QuizFinalizeService $finalize
    ) {
        $this->attempts = $attempts;
        $this->answers = $answers;
        $this->results = $results;
        $this->teacherRead = $teacherRead;
        $this->finalize = $finalize;
    }

    /**
     * Apply teacher manual grades for residual items.
     *
     * Input:
     * - attempt_id (required)
     * - teacher (User, required)
     * - row_version (required)
     * - grades[] (required): question_id and/or snapshot_question_key, manual_score, optional is_correct
     *
     * @param  array<string, mixed>  $input
     * @return array{attempt: QuizAttempt, result: QuizResult}
     */
    public function manualGrade(array $input): array
    {
        /** @var User|null $teacher */
        $teacher = $input['teacher'] ?? Auth::guard('admin-api')->user();
        if ($teacher === null) {
            throw new RuntimeException('Unauthenticated.', 401);
        }

        $attemptId = (int) ($input['attempt_id'] ?? 0);
        $incomingRowVersion = (int) ($input['row_version'] ?? -1);
        $grades = isset($input['grades']) && is_array($input['grades']) ? $input['grades'] : [];

        if ($grades === []) {
            throw new RuntimeException('At least one grade is required.', 422);
        }

        $shouldFinalize = false;
        $studentId = 0;

        $outcome = DB::transaction(function () use (
            $teacher,
            $attemptId,
            $incomingRowVersion,
            $grades,
            &$shouldFinalize,
            &$studentId
        ) {
            $attempt = $this->attempts->lockForUpdate($attemptId);
            if ($attempt === null) {
                throw new RuntimeException('Attempt not found.', 404);
            }

            $this->teacherRead->assertCanAccessAttempt($teacher, $attempt);

            if ($attempt->status !== QuizAttempt::STATUS_PENDING_MANUAL) {
                throw new RuntimeException('Attempt is not pending manual grading.', 409);
            }

            if ((int) $attempt->row_version !== $incomingRowVersion) {
                throw new RuntimeException('Optimistic lock conflict.', 409);
            }

            $result = $this->results->findLatest($attemptId);
            if ($result === null) {
                throw new RuntimeException('Quiz result not found for attempt.', 404);
            }

            if (! (bool) $result->pending_manual) {
                throw new RuntimeException('Attempt is not pending manual grading.', 409);
            }

            if ((bool) $result->is_authoritative) {
                throw new RuntimeException('Attempt already finalized.', 409);
            }

            $attempt->load(['snapshot', 'version']);
            $snapshot = $attempt->snapshot;
            if ($snapshot === null) {
                throw new RuntimeException('Quiz snapshot missing for attempt.', 404);
            }

            $payload = is_array($snapshot->payload) ? $snapshot->payload : [];
            $questions = isset($payload['questions']) && is_array($payload['questions'])
                ? $payload['questions']
                : [];

            $questionsByKey = [];
            $questionsById = [];
            foreach ($questions as $question) {
                if (! is_array($question)) {
                    continue;
                }
                $key = (string) ($question['snapshot_question_key'] ?? '');
                if ($key !== '') {
                    $questionsByKey[$key] = $question;
                }
                $qid = (int) ($question['question_id'] ?? 0);
                if ($qid > 0) {
                    $questionsById[$qid] = $question;
                }
            }

            $answerRows = $this->answers->findByAttempt($attemptId);
            $answersByKey = [];
            $answersByQuestionId = [];
            foreach ($answerRows as $answer) {
                $answersByKey[(string) $answer->snapshot_question_key] = $answer;
                $answersByQuestionId[(int) $answer->question_id] = $answer;
            }

            $gradedAt = Carbon::now();
            $graderId = (int) $teacher->id;

            foreach ($grades as $gradeInput) {
                if (! is_array($gradeInput)) {
                    continue;
                }

                $this->applyOneGrade(
                    $gradeInput,
                    $questionsByKey,
                    $questionsById,
                    $answersByKey,
                    $answersByQuestionId,
                    $graderId,
                    $gradedAt
                );
            }

            // Reload answers after saves.
            $answerRows = $this->answers->findByAttempt($attemptId);

            $manualScoreTotal = 0.0;
            $remainingManual = false;
            foreach ($answerRows as $answer) {
                if ($answer->manual_score !== null) {
                    $manualScoreTotal += (float) $answer->manual_score;
                }
                if ((bool) $answer->needs_manual) {
                    $remainingManual = true;
                }
            }

            $autoScoreTotal = (float) $result->auto_score_total;
            $maxScore = (float) $result->max_score;
            $rawScore = $autoScoreTotal + $manualScoreTotal;
            $percent = $maxScore > 0.0 ? round(($rawScore / $maxScore) * 100, 2) : 0.0;
            $passed = $this->resolvePassed($attempt, $rawScore);

            $result->manual_score_total = $manualScoreTotal;
            $result->raw_score = $rawScore;
            $result->percent = $percent;
            $result->passed = $passed;
            $result->pending_manual = $remainingManual;
            $this->results->save($result);

            $attempt = $this->attempts->update($attempt, [
                'row_version' => ((int) $attempt->row_version) + 1,
            ]);

            if (! $remainingManual) {
                $attempt = $this->attempts->update($attempt, [
                    'status' => QuizAttempt::STATUS_AUTO_GRADED,
                    'row_version' => ((int) $attempt->row_version) + 1,
                ]);
                $shouldFinalize = true;
                $studentId = (int) $attempt->student_id;
            }

            return [
                'attempt' => $attempt,
                'result' => $result,
            ];
        });

        if ($shouldFinalize) {
            return $this->finalize->finalize([
                'attempt_id' => (int) $outcome['attempt']->id,
                'student_id' => $studentId,
            ]);
        }

        return $outcome;
    }

    /**
     * @param  array<string, mixed>  $gradeInput
     * @param  array<string, array<string, mixed>>  $questionsByKey
     * @param  array<int, array<string, mixed>>  $questionsById
     * @param  array<string, QuizAttemptAnswer>  $answersByKey
     * @param  array<int, QuizAttemptAnswer>  $answersByQuestionId
     */
    private function applyOneGrade(
        array $gradeInput,
        array $questionsByKey,
        array $questionsById,
        array $answersByKey,
        array $answersByQuestionId,
        int $graderId,
        Carbon $gradedAt
    ): void {
        $key = (string) ($gradeInput['snapshot_question_key'] ?? '');
        $questionId = isset($gradeInput['question_id']) ? (int) $gradeInput['question_id'] : 0;

        /** @var array<string, mixed>|null $question */
        $question = null;
        /** @var QuizAttemptAnswer|null $answer */
        $answer = null;

        if ($key !== '') {
            $question = $questionsByKey[$key] ?? null;
            $answer = $answersByKey[$key] ?? null;
        } elseif ($questionId > 0) {
            $question = $questionsById[$questionId] ?? null;
            $answer = $answersByQuestionId[$questionId] ?? null;
            if ($question !== null) {
                $key = (string) ($question['snapshot_question_key'] ?? '');
            }
        }

        if ($question === null) {
            throw new RuntimeException('Grade target is not part of the Runtime Snapshot.', 422);
        }

        if ($answer === null) {
            throw new RuntimeException('Answer not found for grade target.', 404);
        }

        if (! (bool) $answer->needs_manual) {
            throw new RuntimeException('Answer does not require manual grading.', 409);
        }

        if (! array_key_exists('manual_score', $gradeInput)) {
            throw new RuntimeException('manual_score is required for each grade.', 422);
        }

        $manualScore = (float) $gradeInput['manual_score'];
        if ($manualScore < 0) {
            throw new RuntimeException('manual_score cannot be negative.', 422);
        }

        $maxScore = isset($question['max_score']) ? (float) $question['max_score'] : 0.0;
        if ($manualScore > $maxScore) {
            throw new RuntimeException('manual_score exceeds question max_score.', 422);
        }

        $answer->manual_score = $manualScore;
        $answer->needs_manual = false;
        $answer->graded_at = $gradedAt;
        $answer->graded_by = $graderId;

        if (array_key_exists('is_correct', $gradeInput) && $gradeInput['is_correct'] !== null) {
            $answer->is_correct = (bool) $gradeInput['is_correct'];
        } elseif ($maxScore > 0) {
            $answer->is_correct = $manualScore >= $maxScore;
        }

        if (array_key_exists('comment', $gradeInput)) {
            $comment = $gradeInput['comment'];
            $answer->teacher_comment = is_string($comment) && trim($comment) !== ''
                ? trim($comment)
                : null;
        }

        $this->answers->save($answer);
    }

    private function resolvePassed(QuizAttempt $attempt, float $rawScore): bool
    {
        $settings = [];
        if ($attempt->relationLoaded('version') && $attempt->version !== null) {
            $settings = is_array($attempt->version->settings_frozen)
                ? $attempt->version->settings_frozen
                : [];
        }

        if (! isset($settings['score_to_pass']) || $settings['score_to_pass'] === null) {
            return false;
        }

        return $rawScore >= (float) $settings['score_to_pass'];
    }
}
