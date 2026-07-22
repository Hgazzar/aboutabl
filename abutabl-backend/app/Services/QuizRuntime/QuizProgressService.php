<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Support\Ownership\OwnershipGate;
use App\Repositories\QuizRuntime\AnswerRepository;
use App\Repositories\QuizRuntime\AttemptRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * F-009D Runtime — Save progress (Sprint 2 Step 3).
 * Draft answer upserts + optimistic lock bump only.
 * Does not grade, finalize, emit events, or touch Result/Outbox.
 * F-015 — rejects Saves after ends_at / expired (QuizAttemptExpiryService).
 */
class QuizProgressService
{
    /** @var AttemptRepository */
    private $attempts;

    /** @var AnswerRepository */
    private $answers;

    /** @var QuizAttemptExpiryService */
    private $expiry;

    public function __construct(
        AttemptRepository $attempts,
        AnswerRepository $answers,
        QuizAttemptExpiryService $expiry
    ) {
        $this->attempts = $attempts;
        $this->answers = $answers;
        $this->expiry = $expiry;
    }

    /**
     * Persist draft answers for an in-progress / expired attempt.
     *
     * Input:
     * - attempt_id (required)
     * - student_id (required — ownership)
     * - answers[] (required) — each: snapshot_question_key, question_id?, response_payload?
     * - row_version (required)
     *
     * @param  array<string, mixed>  $input
     */
    public function save(array $input): QuizAttempt
    {
        $attemptId = (int) ($input['attempt_id'] ?? 0);
        $studentId = (int) ($input['student_id'] ?? 0);
        $incomingRowVersion = (int) ($input['row_version'] ?? -1);
        $answers = isset($input['answers']) && is_array($input['answers'])
            ? $input['answers']
            : [];

        return DB::transaction(function () use ($attemptId, $studentId, $incomingRowVersion, $answers) {
            $attempt = $this->attempts->lockForUpdate($attemptId);
            if ($attempt === null) {
                throw new RuntimeException('Attempt not found.');
            }

            OwnershipGate::assertStudentOwnsAttempt($studentId, $attempt);

            if ($attempt->status !== QuizAttempt::STATUS_IN_PROGRESS) {
                throw new RuntimeException('Attempt is not writable.');
            }

            // F-015 — no draft writes after ends_at (marks expired when overdue).
            $this->expiry->assertWritableForSave($attempt);

            if ((int) $attempt->row_version !== $incomingRowVersion) {
                throw new RuntimeException('Optimistic lock conflict.');
            }

            $answeredAt = Carbon::now();

            foreach ($answers as $answerInput) {
                if (! is_array($answerInput)) {
                    continue;
                }

                $this->upsertDraftAnswer($attemptId, $answerInput, $answeredAt);
            }

            return $this->attempts->update($attempt, [
                'last_saved_at' => $answeredAt,
                'row_version' => ((int) $attempt->row_version) + 1,
            ]);
        });
    }

    /**
     * Upsert one draft answer. On update touches only draft fields.
     *
     * @param  array<string, mixed>  $answerInput
     */
    private function upsertDraftAnswer(int $attemptId, array $answerInput, Carbon $answeredAt): void
    {
        $snapshotQuestionKey = (string) ($answerInput['snapshot_question_key'] ?? '');
        if ($snapshotQuestionKey === '') {
            throw new RuntimeException('snapshot_question_key is required for each answer.');
        }

        $existing = $this->answers->findOne($attemptId, $snapshotQuestionKey);

        $responsePayload = array_key_exists('response_payload', $answerInput)
            ? $answerInput['response_payload']
            : null;

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

        // Update ONLY draft payload fields — no score / correctness / grading columns.
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
