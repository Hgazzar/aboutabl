<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizAttemptAnswer;
use App\Models\QuizRuntime\QuizResult;
use App\Repositories\QuizRuntime\AnswerRepository;
use App\Repositories\QuizRuntime\AttemptRepository;
use App\Repositories\QuizRuntime\ResultRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * F-009D Runtime — Auto grading (Sprint 2 Step 5).
 * Grades machine-scorable answers from frozen Snapshot correct_key.
 * Does not finalize, write Outbox, emit events, or call QuizFinalizeService.
 */
class QuizAutoGradingService
{
    /** Authoring types that are auto-gradable (F-009A). */
    private const AUTO_TYPES = ['MCQ', 'TF', 'Matching'];

    /** Authoring types that require teacher scoring. */
    private const MANUAL_TYPES = ['SHN', 'Essay', 'Upload'];

    /** @var AttemptRepository */
    private $attempts;

    /** @var AnswerRepository */
    private $answers;

    /** @var ResultRepository */
    private $results;

    public function __construct(
        AttemptRepository $attempts,
        AnswerRepository $answers,
        ResultRepository $results
    ) {
        $this->attempts = $attempts;
        $this->answers = $answers;
        $this->results = $results;
    }

    /**
     * Auto-grade machine-scorable answers for a submitted attempt.
     *
     * Input:
     * - attempt_id (required)
     * - student_id (optional ownership check)
     *
     * @param  array<string, mixed>  $input
     * @return array{attempt: QuizAttempt, result: QuizResult}
     */
    public function grade(array $input): array
    {
        $attemptId = (int) ($input['attempt_id'] ?? 0);
        $studentId = (int) ($input['student_id'] ?? 0);

        return DB::transaction(function () use ($attemptId, $studentId) {
            $attempt = $this->attempts->lockForUpdate($attemptId);
            if ($attempt === null) {
                throw new RuntimeException('Attempt not found.', 404);
            }

            if ($studentId > 0 && (int) $attempt->student_id !== $studentId) {
                throw new RuntimeException('Forbidden.', 403);
            }

            // Idempotent: already auto-graded / pending manual.
            if (in_array($attempt->status, [
                QuizAttempt::STATUS_AUTO_GRADED,
                QuizAttempt::STATUS_PENDING_MANUAL,
            ], true)) {
                $existing = $this->results->findLatest($attemptId);
                if ($existing === null) {
                    throw new RuntimeException('Quiz result missing for graded attempt.', 404);
                }

                return [
                    'attempt' => $attempt,
                    'result' => $existing,
                ];
            }

            if ($attempt->status !== QuizAttempt::STATUS_SUBMITTED) {
                throw new RuntimeException('Attempt must be submitted before auto grading.', 409);
            }

            $attempt->load(['snapshot', 'version']);

            $snapshot = $attempt->snapshot;
            if ($snapshot === null) {
                throw new RuntimeException('Quiz snapshot missing for attempt.');
            }

            $payload = is_array($snapshot->payload) ? $snapshot->payload : [];
            $questions = isset($payload['questions']) && is_array($payload['questions'])
                ? $payload['questions']
                : [];

            $answerRows = $this->answers->findByAttempt($attemptId);
            $answersByKey = [];
            foreach ($answerRows as $answer) {
                $answersByKey[(string) $answer->snapshot_question_key] = $answer;
            }

            $autoScoreTotal = 0.0;
            $maxScore = 0.0;
            $pendingManual = false;
            $gradedAt = Carbon::now();

            foreach ($questions as $question) {
                if (! is_array($question)) {
                    continue;
                }

                $questionMax = isset($question['max_score']) ? (float) $question['max_score'] : 0.0;
                $maxScore += $questionMax;

                $type = $this->normalizeType((string) ($question['type'] ?? ''));
                $key = (string) ($question['snapshot_question_key'] ?? '');
                /** @var QuizAttemptAnswer|null $answer */
                $answer = $key !== '' && isset($answersByKey[$key]) ? $answersByKey[$key] : null;

                if ($this->requiresManual($type)) {
                    $pendingManual = true;
                    if ($answer !== null) {
                        $answer->needs_manual = true;
                        $this->answers->save($answer);
                    }
                    continue;
                }

                if (! $this->isAutoGradable($type)) {
                    $pendingManual = true;
                    if ($answer !== null) {
                        $answer->needs_manual = true;
                        $this->answers->save($answer);
                    }
                    continue;
                }

                if ($answer === null) {
                    continue;
                }

                $isCorrect = $this->isResponseCorrect(
                    $type,
                    is_array($answer->response_payload) ? $answer->response_payload : [],
                    $question
                );

                $autoScore = $isCorrect ? $questionMax : 0.0;
                $autoScoreTotal += $autoScore;

                $answer->needs_manual = false;
                $answer->auto_score = $autoScore;
                $answer->is_correct = $isCorrect;
                $answer->graded_at = $gradedAt;
                $this->answers->save($answer);
            }

            $status = $pendingManual
                ? QuizAttempt::STATUS_PENDING_MANUAL
                : QuizAttempt::STATUS_AUTO_GRADED;

            $attempt = $this->attempts->update($attempt, [
                'status' => $status,
            ]);

            $rawScore = $autoScoreTotal;
            $percent = $maxScore > 0.0
                ? round(($rawScore / $maxScore) * 100, 2)
                : 0.0;

            $passed = $this->resolvePassed($attempt, $rawScore);

            $resultAttributes = [
                'attempt_id' => (int) $attempt->id,
                'student_id' => (int) $attempt->student_id,
                'quiz_id' => (int) $attempt->quiz_id,
                'school_id' => $attempt->school_id,
                'raw_score' => $rawScore,
                'max_score' => $maxScore,
                'percent' => $percent,
                'auto_score_total' => $autoScoreTotal,
                'manual_score_total' => 0,
                'pending_manual' => $pendingManual,
                'passed' => $passed,
                'grade_version' => 1,
                'is_authoritative' => false,
                'finalized_at' => $gradedAt,
            ];

            $existingResult = $this->results->findLatest($attemptId);
            if ($existingResult !== null && ! (bool) $existingResult->is_authoritative) {
                $existingResult->fill($resultAttributes);
                $result = $this->results->save($existingResult);
            } else {
                $result = $this->results->create($resultAttributes);
            }

            return [
                'attempt' => $attempt,
                'result' => $result,
            ];
        });
    }

    private function normalizeType(string $type): string
    {
        $key = strtolower(trim($type));

        $map = [
            'mcq' => 'MCQ',
            'multiple choice' => 'MCQ',
            'multiple_choice' => 'MCQ',
            'tf' => 'TF',
            'true/false' => 'TF',
            'true_false' => 'TF',
            'matching' => 'Matching',
            'shn' => 'SHN',
            'short answer' => 'SHN',
            'short_answer' => 'SHN',
            'essay' => 'Essay',
            'upload' => 'Upload',
        ];

        return $map[$key] ?? $type;
    }

    private function isAutoGradable(string $type): bool
    {
        return in_array($type, self::AUTO_TYPES, true);
    }

    private function requiresManual(string $type): bool
    {
        return in_array($type, self::MANUAL_TYPES, true);
    }

    /**
     * Compare response_payload to Snapshot correct_key using Authoring rules.
     *
     * @param  array<string, mixed>  $response
     * @param  array<string, mixed>  $question
     */
    private function isResponseCorrect(string $type, array $response, array $question): bool
    {
        $type = $this->normalizeType($type);

        $correctKey = isset($question['correct_key']) && is_array($question['correct_key'])
            ? $question['correct_key']
            : [];
        $corAnswer = $correctKey['corAnswer'] ?? null;

        if ($corAnswer === null || $corAnswer === '') {
            return false;
        }

        switch ($type) {
            case 'MCQ':
                return $this->gradeMcq($response, $corAnswer, $question);
            case 'TF':
                return $this->gradeTf($response, $corAnswer);
            case 'Matching':
                return $this->gradeMatching($response, $corAnswer);
            default:
                return false;
        }
    }

    /**
     * @param  array<string, mixed>  $response
     * @param  mixed  $corAnswer
     * @param  array<string, mixed>  $question
     */
    private function gradeMcq(array $response, $corAnswer, array $question): bool
    {
        $selected = $this->normalizeMcqSelection($response);
        $expected = $this->normalizeMcqCorrect($corAnswer, $question);

        if ($selected === [] || $expected === []) {
            return false;
        }

        sort($selected);
        sort($expected);

        return $selected === $expected;
    }

    /**
     * @param  array<string, mixed>  $response
     * @param  mixed  $corAnswer
     */
    private function gradeTf(array $response, $corAnswer): bool
    {
        $actual = $this->normalizeTfValue(
            $response['value']
                ?? $response['selected']
                ?? $response['answer']
                ?? null
        );
        $expected = $this->normalizeTfValue($corAnswer);

        if ($actual === null || $expected === null) {
            return false;
        }

        return $actual === $expected;
    }

    /**
     * @param  array<string, mixed>  $response
     * @param  mixed  $corAnswer
     */
    private function gradeMatching(array $response, $corAnswer): bool
    {
        $actual = $this->normalizeMatchingPairs(
            $response['pairs']
                ?? $response['matching']
                ?? $response['value']
                ?? $response['selected']
                ?? null
        );
        $expected = $this->normalizeMatchingPairs($corAnswer);

        if ($actual === [] || $expected === []) {
            return false;
        }

        sort($actual);
        sort($expected);

        return $actual === $expected;
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array<int, int>
     */
    private function normalizeMcqSelection(array $response): array
    {
        $raw = $response['selected']
            ?? $response['value']
            ?? $response['answers']
            ?? $response['answer']
            ?? null;

        if ($raw === null) {
            return [];
        }

        if (! is_array($raw)) {
            $raw = [$raw];
        }

        $out = [];
        foreach ($raw as $item) {
            $n = $this->optionToIndex($item);
            if ($n !== null) {
                $out[] = $n;
            }
        }

        return array_values(array_unique($out));
    }

    /**
     * @param  mixed  $corAnswer
     * @param  array<string, mixed>  $question
     * @return array<int, int>
     */
    private function normalizeMcqCorrect($corAnswer, array $question): array
    {
        $parts = is_array($corAnswer)
            ? $corAnswer
            : preg_split('/\s*,\s*/', (string) $corAnswer, -1, PREG_SPLIT_NO_EMPTY);

        if (! is_array($parts)) {
            return [];
        }

        $options = isset($question['options']) && is_array($question['options'])
            ? $question['options']
            : [];

        $out = [];
        foreach ($parts as $part) {
            $n = $this->optionToIndex($part);
            if ($n !== null) {
                $out[] = $n;
                continue;
            }

            // corAnswer may be the option text itself (authoring / student resource).
            $text = trim((string) $part);
            if ($text === '') {
                continue;
            }
            for ($i = 1; $i <= 8; $i++) {
                $opt = isset($options['answer'.$i]) ? trim((string) $options['answer'.$i]) : '';
                if ($opt !== '' && $opt === $text) {
                    $out[] = $i;
                    break;
                }
            }
        }

        return array_values(array_unique($out));
    }

    /**
     * @param  mixed  $value
     */
    private function optionToIndex($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            $n = (int) $value;
            return $n >= 1 && $n <= 8 ? $n : null;
        }

        $s = trim((string) $value);
        if (preg_match('/^answer(\d+)$/i', $s, $m)) {
            $n = (int) $m[1];

            return $n >= 1 && $n <= 8 ? $n : null;
        }

        return null;
    }

    /**
     * Normalize TF to '0' or '1'.
     *
     * @param  mixed  $value
     */
    private function normalizeTfValue($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        $s = strtolower(trim((string) $value));

        if (in_array($s, ['1', 'true', 't', 'yes'], true)) {
            return '1';
        }

        if (in_array($s, ['0', 'false', 'f', 'no'], true)) {
            return '0';
        }

        return null;
    }

    /**
     * Normalize matching pairs to sorted "left:right" strings.
     *
     * @param  mixed  $raw
     * @return array<int, string>
     */
    private function normalizeMatchingPairs($raw): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }

        if (is_string($raw)) {
            $raw = preg_split('/\s*,\s*/', $raw, -1, PREG_SPLIT_NO_EMPTY);
        }

        if (! is_array($raw)) {
            return [];
        }

        $pairs = [];
        foreach ($raw as $item) {
            if (is_array($item)) {
                $left = $item['left'] ?? $item[0] ?? null;
                $right = $item['right'] ?? $item[1] ?? null;
                if ($left === null || $right === null) {
                    continue;
                }
                $pairs[] = trim((string) $left).':'.trim((string) $right);
                continue;
            }

            $s = str_replace('|', ':', trim((string) $item));
            if ($s === '' || strpos($s, ':') === false) {
                continue;
            }
            [$left, $right] = array_pad(explode(':', $s, 2), 2, '');
            $pairs[] = trim($left).':'.trim($right);
        }

        return array_values(array_unique($pairs));
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

        // Authoring UI labels score_to_pass as points (not percent).
        return $rawScore >= (float) $settings['score_to_pass'];
    }
}
