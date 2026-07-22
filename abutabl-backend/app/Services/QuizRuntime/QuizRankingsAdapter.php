<?php

namespace App\Services\QuizRuntime;

use App\Models\AssignsStudents;
use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizResult;
use App\Models\Student;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;
use RuntimeException;

/**
 * F-009D Sprint 3 Step 2 — Rankings Adapter.
 * After Learning Progress succeeds, refreshes ranking/leaderboard aggregates
 * via the existing Performance Snapshot write path (no Metrics redesign).
 *
 * Rankings today are derived from assignment completion + progress metrics;
 * this adapter triggers a QUIZ_COMPLETED snapshot so student/class ranking
 * aggregates refresh after an authoritative finalized Result.
 *
 * Does not mutate Runtime Attempt/Result, Definition, Authoring,
 * Learning Progress, Reports, or Notifications.
 */
class QuizRankingsAdapter
{
    /** @var PerformanceSnapshotTrigger */
    private $snapshotTrigger;

    public function __construct(PerformanceSnapshotTrigger $snapshotTrigger)
    {
        $this->snapshotTrigger = $snapshotTrigger;
    }

    /**
     * Refresh ranking aggregates for a finalized authoritative Result.
     *
     * @param  array<string, mixed>  $context  Optional outbox payload identifiers
     */
    public function apply(QuizAttempt $attempt, QuizResult $result, array $context = []): void
    {
        if (! (bool) $result->is_authoritative) {
            throw new RuntimeException('Rankings require an authoritative Result.');
        }

        if ((int) $result->attempt_id !== (int) $attempt->id) {
            throw new RuntimeException('Result does not belong to Attempt.');
        }

        if ($attempt->status !== QuizAttempt::STATUS_FINALIZED) {
            throw new RuntimeException('Rankings require a finalized Attempt.');
        }

        $studentId = (int) $attempt->student_id;
        if ($studentId <= 0) {
            throw new RuntimeException('Rankings require student_id.');
        }

        $teacherId = $this->resolveTeacherId($attempt);
        $schoolId = $attempt->school_id !== null
            ? (int) $attempt->school_id
            : (isset($context['school_id']) ? (int) $context['school_id'] : null);

        $classId = null;
        $student = Student::query()->whereKey($studentId)->first(['id', 'class_id', 'school_id']);
        if ($student !== null) {
            $classId = $student->class_id !== null ? (int) $student->class_id : null;
            if ($schoolId === null && $student->school_id !== null) {
                $schoolId = (int) $student->school_id;
            }
        }

        $meta = [
            'quiz_id' => (int) $attempt->quiz_id,
            'attempt_id' => (int) $attempt->id,
            'result_id' => (int) $result->id,
            'assign_id' => $attempt->assign_id !== null ? (int) $attempt->assign_id : null,
            'assign_student_id' => $attempt->assign_student_id !== null
                ? (int) $attempt->assign_student_id
                : null,
            'grade_version' => (int) $result->grade_version,
            'percent' => (float) $result->percent,
            'passed' => (bool) $result->passed,
            'raw_score' => (float) $result->raw_score,
            'max_score' => (float) $result->max_score,
        ];

        // Existing rankings write path: Trigger → Recorder → performance_facts.
        // Live student/class ranks recompute from Metrics on next read.
        $this->snapshotTrigger->captureStudent(
            $studentId,
            PerformanceSnapshotSource::QUIZ_COMPLETED,
            $teacherId,
            $schoolId,
            $classId,
            QuizResult::class,
            (int) $result->id,
            $meta
        );
    }

    private function resolveTeacherId(QuizAttempt $attempt): ?int
    {
        $row = null;

        if ($attempt->assign_student_id !== null) {
            $row = AssignsStudents::query()
                ->whereKey((int) $attempt->assign_student_id)
                ->first();
        } elseif ($attempt->assign_id !== null) {
            $row = AssignsStudents::query()
                ->where('assign_id', (int) $attempt->assign_id)
                ->where('student_id', (int) $attempt->student_id)
                ->first();
        }

        if ($row === null) {
            return null;
        }

        $row->loadMissing('assign:id,created_by');

        $teacherId = (int) ($row->created_by ?? 0);
        if ($teacherId < 1) {
            $teacherId = (int) ($row->assign->created_by ?? 0);
        }

        return $teacherId > 0 ? $teacherId : null;
    }
}
