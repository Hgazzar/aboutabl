<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizResult;
use App\Repositories\QuizRuntime\AttemptRepository;
use App\Repositories\QuizRuntime\ResultRepository;
use RuntimeException;

/**
 * F-009F — Student attempt latest / history (read-only).
 *
 * Uses existing AttemptRepository helpers.
 * Never mutates Runtime Attempt/Result.
 * Never exposes Review secrets (answers, keys, explanations).
 */
class QuizStudentAttemptReadService
{
    /** @var AttemptRepository */
    private $attempts;

    /** @var ResultRepository */
    private $results;

    public function __construct(AttemptRepository $attempts, ResultRepository $results)
    {
        $this->attempts = $attempts;
        $this->results = $results;
    }

    /**
     * Input: quiz_id, student_id
     *
     * @param  array<string, mixed>  $input
     * @return array{attempt: QuizAttempt, result: ?QuizResult}
     */
    public function latest(array $input): array
    {
        $quizId = (int) ($input['quiz_id'] ?? 0);
        $studentId = (int) ($input['student_id'] ?? 0);

        if ($quizId <= 0 || $studentId <= 0) {
            throw new RuntimeException('Attempt not found.', 404);
        }

        $attempt = $this->attempts->findLatestAttempt($studentId, $quizId);
        if ($attempt === null) {
            throw new RuntimeException('Attempt not found.', 404);
        }

        // Ownership is already constrained by repository query; keep explicit guard.
        if ((int) $attempt->student_id !== $studentId) {
            throw new RuntimeException('Forbidden.', 403);
        }

        return [
            'attempt' => $attempt,
            'result' => $this->results->findAuthoritative((int) $attempt->id),
        ];
    }

    /**
     * Input: quiz_id, student_id
     *
     * @param  array<string, mixed>  $input
     * @return array<int, array{attempt: QuizAttempt, result: ?QuizResult}>
     */
    public function history(array $input): array
    {
        $quizId = (int) ($input['quiz_id'] ?? 0);
        $studentId = (int) ($input['student_id'] ?? 0);

        if ($quizId <= 0 || $studentId <= 0) {
            return [];
        }

        $attempts = $this->attempts->findByStudent($studentId, $quizId);

        // Newest first: attempt_no desc, then id desc (stable for same attempt_no).
        $attempts = $attempts->sort(function ($a, $b) {
            $byNo = ((int) $b->attempt_no) <=> ((int) $a->attempt_no);
            if ($byNo !== 0) {
                return $byNo;
            }

            return ((int) $b->id) <=> ((int) $a->id);
        })->values();

        $out = [];
        foreach ($attempts as $attempt) {
            if ((int) $attempt->student_id !== $studentId) {
                continue;
            }

            $out[] = [
                'attempt' => $attempt,
                'result' => $this->results->findAuthoritative((int) $attempt->id),
            ];
        }

        return $out;
    }
}
