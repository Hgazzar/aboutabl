<?php

namespace App\Services\QuizRuntime;

use App\Models\AssignsStudents;
use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizResult;
use Illuminate\Support\Carbon;
use RuntimeException;

/**
 * F-009D Sprint 3 Step 1 — Learning Progress Adapter (name historical).
 * Maps authoritative finalized Runtime Result → Assignment Completion inputs.
 *
 * F-044C: Learning Progress SSOT is student_subject_progress (not this adapter).
 * Completing a linked quiz assign updates assigns_students.opened_at only
 * (Assignment Completion / Completion widgets).
 *
 * Does not mutate Runtime Attempt/Result, Definition, Authoring,
 * Rankings, Reports, or Notifications services.
 */
class QuizLearningProgressAdapter
{
    /**
     * Apply Assignment Completion side effects for a finalized authoritative Result.
     *
     * @param  array<string, mixed>  $context  Optional outbox payload identifiers
     */
    public function apply(QuizAttempt $attempt, QuizResult $result, array $context = []): void
    {
        if (! (bool) $result->is_authoritative) {
            throw new RuntimeException('Assignment completion requires an authoritative Result.');
        }

        if ((int) $result->attempt_id !== (int) $attempt->id) {
            throw new RuntimeException('Result does not belong to Attempt.');
        }

        if ($attempt->status !== QuizAttempt::STATUS_FINALIZED) {
            throw new RuntimeException('Assignment completion requires a finalized Attempt.');
        }

        $this->markQuizAssignmentCompleted($attempt);

        if ($attempt->assign_activity_id) {
            try {
                app(\App\Services\Assignment\AssignActivitySubmissionService::class)
                    ->syncFromQuizResult(
                        (int) $attempt->assign_activity_id,
                        (int) $attempt->student_id,
                        (float) ($result->percent ?? 0),
                        $result->raw_score !== null ? (float) $result->raw_score : null,
                        $result->max_score !== null ? (float) $result->max_score : null,
                        (int) $attempt->id
                    );
            } catch (\Throwable $e) {
                // Do not fail Runtime finalize if activity sync fails.
            }
        }
    }

    /**
     * Idempotent quiz-assignment completion → assigns_students.opened_at.
     */
    private function markQuizAssignmentCompleted(QuizAttempt $attempt): void
    {
        $row = $this->resolveAssignStudentRow($attempt);
        if ($row === null) {
            // Practice / unassigned attempts do not affect assignment completion.
            return;
        }

        $row->loadMissing('assign:id,type,type_id,created_by,school_id,subject_id');

        $assign = $row->assign;
        if ($assign === null) {
            return;
        }

        // Quiz module assigns OR multi-activity learning assigns with a quiz activity.
        $isQuizAssign = (string) $assign->type === 'quizes';
        $isLearningAssign = (string) $assign->type === \App\Support\Assignment\LearningActivityMap::ASSIGN_TYPE
            && $attempt->assign_activity_id;

        if (! $isQuizAssign && ! $isLearningAssign) {
            return;
        }

        if ($row->opened_at !== null) {
            return;
        }

        $row->opened_at = Carbon::now();
        $row->save();
    }

    private function resolveAssignStudentRow(QuizAttempt $attempt): ?AssignsStudents
    {
        if ($attempt->assign_student_id !== null) {
            return AssignsStudents::query()
                ->whereKey((int) $attempt->assign_student_id)
                ->where('student_id', (int) $attempt->student_id)
                ->where('status', 1)
                ->first();
        }

        if ($attempt->assign_id === null) {
            return null;
        }

        return AssignsStudents::query()
            ->where('assign_id', (int) $attempt->assign_id)
            ->where('student_id', (int) $attempt->student_id)
            ->where('status', 1)
            ->first();
    }
}
