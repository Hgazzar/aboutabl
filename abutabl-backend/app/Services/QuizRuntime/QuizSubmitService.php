<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizResult;
use App\Repositories\QuizRuntime\AnswerRepository;
use App\Repositories\QuizRuntime\AttemptRepository;
use App\Repositories\QuizRuntime\ResultRepository;
use App\Support\Ownership\OwnershipGate;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * F-009D Runtime — Submit → Auto Grade → Finalize when no manual residual.
 * Does not write Outbox or emit events.
 * F-015 — late-submit gate via QuizAttemptExpiryService (block vs grace/auto).
 */
class QuizSubmitService
{
    /** @var AttemptRepository */
    private $attempts;

    /** @var AnswerRepository */
    private $answers;

    /** @var QuizAutoGradingService */
    private $autoGrading;

    /** @var QuizFinalizeService */
    private $finalize;

    /** @var ResultRepository */
    private $results;

    /** @var QuizAttemptExpiryService */
    private $expiry;

    public function __construct(
        AttemptRepository $attempts,
        AnswerRepository $answers,
        QuizAutoGradingService $autoGrading,
        QuizFinalizeService $finalize,
        ResultRepository $results,
        QuizAttemptExpiryService $expiry
    ) {
        $this->attempts = $attempts;
        $this->answers = $answers;
        $this->autoGrading = $autoGrading;
        $this->finalize = $finalize;
        $this->results = $results;
        $this->expiry = $expiry;
    }

    /**
     * Submit an attempt, auto-grade, then finalize when pending_manual is false.
     *
     * Input:
     * - attempt_id (required)
     * - student_id (required for ownership)
     * - row_version (required)
     * - answers[] (optional)
     * - submit_idempotency_key (optional)
     * - client_submitted_at (optional)
     *
     * @param  array<string, mixed>  $input
     * @return array{attempt: QuizAttempt, result: QuizResult}
     */
    public function submit(array $input): array
    {
        $attemptId = (int) ($input['attempt_id'] ?? 0);
        $studentId = (int) ($input['student_id'] ?? 0);
        $incomingRowVersion = (int) ($input['row_version'] ?? -1);
        $submitIdempotencyKey = $input['submit_idempotency_key'] ?? null;
        $answers = isset($input['answers']) && is_array($input['answers'])
            ? $input['answers']
            : [];

        $attempt = DB::transaction(function () use (
            $attemptId,
            $studentId,
            $incomingRowVersion,
            $submitIdempotencyKey,
            $answers
        ) {
            $attempt = $this->attempts->lockForUpdate($attemptId);
            if ($attempt === null) {
                throw new RuntimeException('Attempt not found.', 404);
            }

            OwnershipGate::assertStudentOwnsAttempt($studentId, $attempt);

            // Already graded / finalized — idempotent; skip freeze.
            if (in_array($attempt->status, [
                QuizAttempt::STATUS_AUTO_GRADED,
                QuizAttempt::STATUS_PENDING_MANUAL,
                QuizAttempt::STATUS_FINALIZED,
            ], true)) {
                if ($submitIdempotencyKey !== null && $submitIdempotencyKey !== ''
                    && $attempt->submit_idempotency_key !== null
                    && $attempt->submit_idempotency_key !== $submitIdempotencyKey) {
                    throw new RuntimeException('Attempt already submitted.', 409);
                }

                return $attempt;
            }

            // Submitted but not yet graded — allow auto-grade to continue.
            if ($attempt->status === QuizAttempt::STATUS_SUBMITTED) {
                if ($submitIdempotencyKey !== null && $submitIdempotencyKey !== ''
                    && $attempt->submit_idempotency_key !== null
                    && $attempt->submit_idempotency_key !== $submitIdempotencyKey) {
                    throw new RuntimeException('Attempt already submitted.', 409);
                }

                return $attempt;
            }

            if (! in_array($attempt->status, [
                QuizAttempt::STATUS_IN_PROGRESS,
                QuizAttempt::STATUS_EXPIRED,
            ], true)) {
                throw new RuntimeException('Attempt is not submittable.', 409);
            }

            // F-015 — block late submit when policy requires; allow grace / auto-submit.
            $this->expiry->assertSubmittable($attempt);

            if ((int) $attempt->row_version !== $incomingRowVersion) {
                throw new RuntimeException('Optimistic lock conflict.', 409);
            }

            $answeredAt = Carbon::now();

            foreach ($answers as $answerInput) {
                if (! is_array($answerInput)) {
                    continue;
                }

                $this->upsertFinalAnswer($attemptId, $answerInput, $answeredAt);
            }

            $answerRows = $this->answers->findByAttempt($attemptId);

            foreach ($answerRows as $answer) {
                $answer->is_draft = false;
                $this->answers->save($answer);
            }

            return $this->attempts->update($attempt, [
                'status' => QuizAttempt::STATUS_SUBMITTED,
                'submitted_at' => $answeredAt,
                'submit_idempotency_key' => $submitIdempotencyKey,
                'active_slot_key' => null,
                'row_version' => ((int) $attempt->row_version) + 1,
            ]);
        });

        if ($attempt->status === QuizAttempt::STATUS_FINALIZED) {
            return $this->loadOutcome((int) $attempt->id, $attempt);
        }

        if ($attempt->status === QuizAttempt::STATUS_PENDING_MANUAL) {
            return $this->loadOutcome((int) $attempt->id, $attempt);
        }

        if ($attempt->status === QuizAttempt::STATUS_AUTO_GRADED) {
            return $this->finalizeIfReady((int) $attempt->id, $studentId, $attempt);
        }

        $graded = $this->autoGrading->grade([
            'attempt_id' => (int) $attempt->id,
            'student_id' => $studentId,
        ]);

        $result = $graded['result'];
        if ((bool) $result->pending_manual) {
            return $graded;
        }

        return $this->finalize->finalize([
            'attempt_id' => (int) $attempt->id,
            'student_id' => $studentId,
        ]);
    }

    /**
     * @return array{attempt: QuizAttempt, result: QuizResult}
     */
    private function finalizeIfReady(int $attemptId, int $studentId, QuizAttempt $attempt): array
    {
        $result = $this->results->findLatest($attemptId);
        if ($result === null) {
            throw new RuntimeException('Quiz result missing for graded attempt.', 404);
        }

        if ((bool) $result->pending_manual) {
            return [
                'attempt' => $attempt,
                'result' => $result,
            ];
        }

        if ((bool) $result->is_authoritative
            && $attempt->status === QuizAttempt::STATUS_FINALIZED) {
            return [
                'attempt' => $attempt,
                'result' => $result,
            ];
        }

        return $this->finalize->finalize([
            'attempt_id' => $attemptId,
            'student_id' => $studentId,
        ]);
    }

    /**
     * @return array{attempt: QuizAttempt, result: QuizResult}
     */
    private function loadOutcome(int $attemptId, QuizAttempt $attempt): array
    {
        $result = $this->results->findLatest($attemptId);
        if ($result === null) {
            throw new RuntimeException('Quiz result missing for graded attempt.', 404);
        }

        return [
            'attempt' => $attempt,
            'result' => $result,
        ];
    }

    /**
     * @param  array<string, mixed>  $answerInput
     */
    private function upsertFinalAnswer(int $attemptId, array $answerInput, Carbon $answeredAt): void
    {
        $snapshotQuestionKey = (string) ($answerInput['snapshot_question_key'] ?? '');
        if ($snapshotQuestionKey === '') {
            throw new RuntimeException('snapshot_question_key is required for each answer.');
        }

        $existing = $this->answers->findOne($attemptId, $snapshotQuestionKey);

        $responsePayload = array_key_exists('response_payload', $answerInput)
            ? $answerInput['response_payload']
            : null;

        if ($responsePayload === null) {
            if ($existing === null) {
                return;
            }

            if ($existing->response_payload !== null) {
                return;
            }
        }

        if ($existing === null) {
            $questionId = (int) ($answerInput['question_id'] ?? 0);
            if ($questionId <= 0) {
                throw new RuntimeException('question_id is required when creating an answer.');
            }

            $this->answers->upsert([
                'attempt_id' => $attemptId,
                'question_id' => $questionId,
                'snapshot_question_key' => $snapshotQuestionKey,
                'response_payload' => $responsePayload,
                'answered_at' => $answeredAt,
                'is_draft' => true,
                'answer_version' => 1,
            ]);

            return;
        }

        $this->answers->upsert([
            'attempt_id' => $attemptId,
            'snapshot_question_key' => $snapshotQuestionKey,
            'response_payload' => $responsePayload,
            'answered_at' => $answeredAt,
            'is_draft' => true,
            'answer_version' => ((int) $existing->answer_version) + 1,
        ]);
    }
}
