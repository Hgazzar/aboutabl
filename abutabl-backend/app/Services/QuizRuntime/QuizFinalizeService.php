<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizIntegrationOutbox;
use App\Models\QuizRuntime\QuizResult;
use App\Repositories\QuizRuntime\AttemptRepository;
use App\Repositories\QuizRuntime\OutboxRepository;
use App\Repositories\QuizRuntime\ResultRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * F-009D Runtime — Finalize attempt + Outbox writer (Sprint 1 Step 5).
 * Marks Result authoritative, Attempt finalized, writes ONE pending QuizFinalized outbox row.
 * Does not publish, dispatch jobs, emit Laravel events, or call downstream systems.
 */
class QuizFinalizeService
{
    /** @var AttemptRepository */
    private $attempts;

    /** @var ResultRepository */
    private $results;

    /** @var OutboxRepository */
    private $outbox;

    public function __construct(
        AttemptRepository $attempts,
        ResultRepository $results,
        OutboxRepository $outbox
    ) {
        $this->attempts = $attempts;
        $this->results = $results;
        $this->outbox = $outbox;
    }

    /**
     * Finalize an attempt: authoritative Result + status finalized + pending Outbox.
     *
     * Input:
     * - attempt_id (required)
     * - student_id (required for ownership)
     *
     * @param  array<string, mixed>  $input
     * @return array{attempt: QuizAttempt, result: QuizResult}
     */
    public function finalize(array $input): array
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

            if ($attempt->status === QuizAttempt::STATUS_FINALIZED) {
                throw new RuntimeException('Attempt already finalized.', 409);
            }

            if (in_array($attempt->status, [
                QuizAttempt::STATUS_ABANDONED,
                QuizAttempt::STATUS_VOIDED,
            ], true)) {
                throw new RuntimeException('Attempt cannot be finalized.', 409);
            }

            if ($attempt->status === QuizAttempt::STATUS_PENDING_MANUAL) {
                throw new RuntimeException('Attempt still pending manual grading.', 409);
            }

            if ($attempt->status !== QuizAttempt::STATUS_AUTO_GRADED) {
                throw new RuntimeException('Attempt is not ready to finalize.', 409);
            }

            $result = $this->results->findLatest($attemptId);
            if ($result === null) {
                throw new RuntimeException('Quiz result not found for attempt.', 404);
            }

            if ((bool) $result->pending_manual) {
                throw new RuntimeException('Attempt still pending manual grading.', 409);
            }

            if ((bool) $result->is_authoritative) {
                throw new RuntimeException('Attempt already finalized.', 409);
            }

            $finalizedAt = Carbon::now();

            $result->is_authoritative = true;
            $result->authoritative_slot = $attemptId;
            $result->finalized_at = $finalizedAt;
            $this->results->save($result);

            $attempt = $this->attempts->update($attempt, [
                'status' => QuizAttempt::STATUS_FINALIZED,
                'row_version' => ((int) $attempt->row_version) + 1,
            ]);

            $this->writeFinalizedOutbox($attempt, $result, $finalizedAt);

            return [
                'attempt' => $attempt,
                'result' => $result,
            ];
        });
    }

    /**
     * Publish Outbox for an already-finalized attempt with a new authoritative Result
     * (used after regrade). Does not change Attempt status or mutate prior Results.
     *
     * Input:
     * - attempt_id (required)
     * - result_id (required) — must be authoritative for the attempt
     *
     * @param  array<string, mixed>  $input
     * @return array{attempt: QuizAttempt, result: QuizResult}
     */
    public function publishAuthoritativeResult(array $input): array
    {
        $attemptId = (int) ($input['attempt_id'] ?? 0);
        $resultId = (int) ($input['result_id'] ?? 0);

        return DB::transaction(function () use ($attemptId, $resultId) {
            $attempt = $this->attempts->lockForUpdate($attemptId);
            if ($attempt === null) {
                throw new RuntimeException('Attempt not found.', 404);
            }

            if ($attempt->status !== QuizAttempt::STATUS_FINALIZED) {
                throw new RuntimeException('Attempt is not finalized.', 409);
            }

            $result = QuizResult::query()->whereKey($resultId)->lockForUpdate()->first();
            if ($result === null || (int) $result->attempt_id !== $attemptId) {
                throw new RuntimeException('Quiz result not found for attempt.', 404);
            }

            if (! (bool) $result->is_authoritative) {
                throw new RuntimeException('Result is not authoritative.', 409);
            }

            if ((bool) $result->pending_manual) {
                throw new RuntimeException('Attempt still pending manual grading.', 409);
            }

            $finalizedAt = $result->finalized_at instanceof Carbon
                ? $result->finalized_at
                : Carbon::now();

            if ($result->finalized_at === null) {
                $result->finalized_at = $finalizedAt;
                $result->authoritative_slot = $attemptId;
                $this->results->save($result);
            }

            $this->writeFinalizedOutbox($attempt, $result, $finalizedAt);

            return [
                'attempt' => $attempt,
                'result' => $result,
            ];
        });
    }

    /**
     * Write exactly one pending QuizFinalized outbox row (no publish / no dispatch).
     */
    private function writeFinalizedOutbox(
        QuizAttempt $attempt,
        QuizResult $result,
        Carbon $finalizedAt
    ): void {
        $gradeVersion = (int) $result->grade_version;
        $idempotencyKey = (int) $attempt->id
            . ':' . QuizIntegrationOutbox::EVENT_FINALIZED
            . ':' . $gradeVersion;

        if ($this->outbox->findByIdempotencyKey($idempotencyKey) !== null) {
            return;
        }

        $this->outbox->create([
            'attempt_id' => (int) $attempt->id,
            'school_id' => $attempt->school_id !== null ? (int) $attempt->school_id : null,
            'event_type' => QuizIntegrationOutbox::EVENT_FINALIZED,
            'idempotency_key' => $idempotencyKey,
            'payload' => [
                'school_id' => $attempt->school_id !== null ? (int) $attempt->school_id : null,
                'student_id' => (int) $attempt->student_id,
                'attempt_id' => (int) $attempt->id,
                'result_id' => (int) $result->id,
                'quiz_id' => (int) $attempt->quiz_id,
                'version_id' => (int) $attempt->quiz_version_id,
                'timestamp' => $finalizedAt->toIso8601String(),
            ],
            'status' => QuizIntegrationOutbox::STATUS_PENDING,
            'relay_attempts' => 0,
            'last_error' => null,
            'published_at' => null,
        ]);
    }
}
