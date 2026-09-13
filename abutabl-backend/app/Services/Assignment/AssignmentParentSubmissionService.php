<?php

namespace App\Services\Assignment;

use App\Models\AssignActivitySubmission;
use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Support\Assignment\LearningActivityMap;
use App\Support\Assignment\MultiActivityMetrics;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

/**
 * Parent Assignment submission lifecycle (Phase 2).
 *
 * SSOT: assigns_students.submission_status + submitted_at (+ graded_at when set).
 * Distinct from assign_activity_submissions (per-activity).
 */
class AssignmentParentSubmissionService
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_GRADED = 'graded';

    /**
     * Student final SUBMIT for one assignment.
     */
    public function submitForStudent(int $assignId, int $studentId): AssignsStudents
    {
        return DB::transaction(function () use ($assignId, $studentId) {
            // Lock assign row so concurrent rubric edits observe the same SSOT boundary.
            $assign = Assigns::with('activities')->where('id', $assignId)->lockForUpdate()->first();
            if (! $assign) {
                throw new InvalidArgumentException('assignment_not_found');
            }

            /** @var AssignsStudents|null $assignStudent */
            $assignStudent = AssignsStudents::query()
                ->where('assign_id', $assignId)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();

            if (! $assignStudent) {
                throw new InvalidArgumentException('assign_student_not_found');
            }

            $status = $this->resolveParentStatus($assignStudent);

            if ($status === self::STATUS_GRADED) {
                throw new InvalidArgumentException('assignment_graded_locked');
            }

            if ($status === self::STATUS_SUBMITTED) {
                throw new InvalidArgumentException('assignment_already_submitted');
            }

            if (! $this->canSubmitAssignment($assign, $studentId)) {
                throw new InvalidArgumentException('activities_incomplete');
            }

            $now = now();
            $assignStudent->submission_status = self::STATUS_SUBMITTED;
            $assignStudent->submitted_at = $now;
            if (! $assignStudent->opened_at) {
                $assignStudent->opened_at = $now;
            }
            $assignStudent->save();

            return $assignStudent->fresh();
        });
    }

    /**
     * Teacher Return Assignment: finalize grade draft + parent graded + XP.
     * Delegates evaluation SSOT to AssignmentGradeService (Phase 3C).
     *
     * @return array{assign_student: AssignsStudents, grade: array<string, mixed>}
     */
    public function finalizeParentAssignment(int $assignId, int $studentId, int $teacherId = 0, ?string $teacherFeedback = null): array
    {
        /** @var AssignmentGradeService $grades */
        $grades = app(AssignmentGradeService::class);

        return $grades->finalizeReturn($assignId, $studentId, $teacherId, $teacherFeedback);
    }

    /**
     * Student Assignment-level REDO: submitted → active (before deadline only).
     * Distinct from Activity-level REDO.
     */
    public function redoForStudent(int $assignId, int $studentId): AssignsStudents
    {
        return DB::transaction(function () use ($assignId, $studentId) {
            $assign = Assigns::query()->where('id', $assignId)->lockForUpdate()->first();
            if (! $assign) {
                throw new InvalidArgumentException('assignment_not_found');
            }

            /** @var AssignsStudents|null $assignStudent */
            $assignStudent = AssignsStudents::query()
                ->where('assign_id', $assignId)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();

            if (! $assignStudent) {
                throw new InvalidArgumentException('assign_student_not_found');
            }

            if (! $this->canRedoAssignment($assign, $assignStudent)) {
                $status = $this->resolveParentStatus($assignStudent);
                if ($status === self::STATUS_GRADED) {
                    throw new InvalidArgumentException('assignment_graded_locked');
                }
                if ($status !== self::STATUS_SUBMITTED) {
                    throw new InvalidArgumentException('assignment_redo_not_allowed');
                }
                if ($this->isPastDeadline($assign)) {
                    throw new InvalidArgumentException('assignment_deadline_passed');
                }
                throw new InvalidArgumentException('assignment_redo_not_allowed');
            }

            $assignStudent->submission_status = self::STATUS_ACTIVE;
            if ($this->hasSubmittedAtColumn()) {
                $assignStudent->submitted_at = null;
            }
            $assignStudent->save();

            // Discard unfinalized teacher draft so re-submit is reviewed fresh.
            // Never touch finalized grades (already blocked above).
            $this->discardUnfinalizedGradeDraft((int) $assign->id, (int) $assignStudent->id);

            return $assignStudent->fresh();
        });
    }

    /**
     * Assignment REDO availability (authoritative).
     * submitted + not past due_at + not graded.
     */
    public function canRedoAssignment(Assigns $assign, ?AssignsStudents $assignStudent): bool
    {
        if (! $assignStudent) {
            return false;
        }

        if ($this->resolveParentStatus($assignStudent) !== self::STATUS_SUBMITTED) {
            return false;
        }

        if ($this->isPastDeadline($assign)) {
            return false;
        }

        return true;
    }

    /**
     * Parent gates shared by Activity REDO (assignment still editable).
     */
    public function canActivityRedoParentGates(Assigns $assign, ?AssignsStudents $assignStudent): bool
    {
        if (! $assignStudent) {
            return false;
        }

        if ($this->resolveParentStatus($assignStudent) !== self::STATUS_ACTIVE) {
            return false;
        }

        if ($this->isPastDeadline($assign)) {
            return false;
        }

        return true;
    }

    /**
     * True when due_at exists and is strictly in the past.
     * No due_at ⇒ not past deadline (REDO still allowed by deadline rule).
     */
    public function isPastDeadline(Assigns $assign): bool
    {
        if (! $assign->due_at) {
            return false;
        }

        return $assign->due_at->getTimestamp() < time();
    }

    private function discardUnfinalizedGradeDraft(int $assignId, int $assignStudentId): void
    {
        if (! Schema::hasTable('assignment_grades')) {
            return;
        }

        $grades = \App\Models\AssignmentGrade::query()
            ->where('assign_id', $assignId)
            ->where('assign_student_id', $assignStudentId)
            ->where('status', \App\Models\AssignmentGrade::STATUS_DRAFT)
            ->get();

        foreach ($grades as $grade) {
            if (Schema::hasTable('assignment_grade_criteria')) {
                \App\Models\AssignmentGradeCriterion::query()
                    ->where('assignment_grade_id', $grade->id)
                    ->delete();
            }
            $grade->delete();
        }
    }

    /**
     * Truthful readiness: all assign_activities counted complete by MultiActivityMetrics.
     */
    public function canSubmitAssignment(Assigns $assign, int $studentId): bool
    {
        if ((string) $assign->type !== LearningActivityMap::ASSIGN_TYPE) {
            return false;
        }

        $activities = $assign->relationLoaded('activities')
            ? $assign->activities
            : $assign->activities()->orderBy('sort_order')->orderBy('id')->get();

        if ($activities->isEmpty()) {
            return false;
        }

        $submissions = AssignActivitySubmission::query()
            ->where('assign_id', $assign->id)
            ->where('student_id', $studentId)
            ->get();

        $progress = MultiActivityMetrics::forStudent($activities, $submissions);

        return (bool) ($progress['fully_complete'] ?? false);
    }

    public function normalizeStatus(?string $status): string
    {
        $status = strtolower(trim((string) $status));
        if ($status === self::STATUS_SUBMITTED || $status === self::STATUS_GRADED) {
            return $status;
        }

        return self::STATUS_ACTIVE;
    }

    public function resolveParentStatus(?AssignsStudents $assignStudent): string
    {
        if ($assignStudent === null) {
            return self::STATUS_ACTIVE;
        }

        $status = self::STATUS_ACTIVE;
        if ($this->hasSubmissionStatusColumn()) {
            $status = $this->normalizeStatus((string) ($assignStudent->submission_status ?? self::STATUS_ACTIVE));
        }

        if ($status === self::STATUS_ACTIVE && ! empty($assignStudent->graded_at)) {
            return self::STATUS_GRADED;
        }

        if (
            $status === self::STATUS_ACTIVE
            && $this->hasSubmittedAtColumn()
            && ! empty($assignStudent->submitted_at)
        ) {
            return self::STATUS_SUBMITTED;
        }

        return $status;
    }

    /**
     * @return array{mode: string, status: string}
     */
    public function lifecycleFromAssignStudent(?AssignsStudents $assignStudent): array
    {
        $status = $this->resolveParentStatus($assignStudent);

        if ($status === self::STATUS_GRADED) {
            return ['mode' => 'assignment_graded', 'status' => self::STATUS_GRADED];
        }

        if ($status === self::STATUS_SUBMITTED) {
            return ['mode' => 'waiting_on_teacher', 'status' => self::STATUS_SUBMITTED];
        }

        return ['mode' => 'homework_hero', 'status' => self::STATUS_ACTIVE];
    }

    private function hasSubmissionStatusColumn(): bool
    {
        return Schema::hasColumn('assigns_students', 'submission_status');
    }

    private function hasSubmittedAtColumn(): bool
    {
        return Schema::hasColumn('assigns_students', 'submitted_at');
    }
}
