<?php

namespace App\Services\PerformanceAnalytics;

use App\Models\Student;
use App\Models\TeachersGrades;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Write-integration orchestrator (not a writer).
 * Resolves teacher/class/subject context and delegates persistence to
 * PerformanceSnapshotRecorder only. Never writes performance_facts itself.
 * Failures are logged and never bubble — callers keep existing behavior.
 *
 * @see \App\Services\PerformanceAnalytics\PerformanceAnalyticsRules
 */
class PerformanceSnapshotTrigger
{
    /** @var PerformanceSnapshotRecorder */
    private $recorder;

    public function __construct(PerformanceSnapshotRecorder $recorder)
    {
        $this->recorder = $recorder;
    }

    /**
     * Snapshot one student after a performance-affecting write.
     */
    public function captureStudent(
        int $studentId,
        string $source,
        ?int $teacherId = null,
        ?int $schoolId = null,
        ?int $classId = null,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?array $meta = null
    ): void {
        try {
            $student = Student::query()
                ->where('id', $studentId)
                ->first(['id', 'class_id', 'school_id', 'grade_id', 'name', 'name_ar', 'photo', 'status']);

            if ($student === null) {
                return;
            }

            $resolvedClassId = $classId ?? (int) ($student->class_id ?? 0);
            $resolvedSchoolId = $schoolId ?? (int) ($student->school_id ?? 0);
            $resolvedTeacherId = $teacherId ?? $this->resolveTeacherIdForClass($resolvedClassId, $resolvedSchoolId);

            if ($resolvedClassId < 1 || $resolvedSchoolId < 1 || $resolvedTeacherId < 1) {
                Log::warning('performance_snapshot_skipped_missing_scope', [
                    'student_id' => $studentId,
                    'source'     => $source,
                    'class_id'   => $resolvedClassId,
                    'school_id'  => $resolvedSchoolId,
                    'teacher_id' => $resolvedTeacherId,
                ]);

                return;
            }

            $subjectIds = $this->resolveSubjectIds($resolvedTeacherId, $resolvedClassId);

            $this->recorder->snapshotStudent(
                $student,
                $subjectIds,
                $resolvedTeacherId,
                $resolvedSchoolId,
                $resolvedClassId,
                $source,
                'week',
                null,
                $sourceType,
                $sourceId,
                $meta
            );
        } catch (Throwable $e) {
            Log::error('performance_snapshot_failed', [
                'student_id' => $studentId,
                'source'     => $source,
                'message'    => $e->getMessage(),
            ]);
        }
    }

    /**
     * Batch snapshot students grouped by class (uses recordMany via recorder).
     *
     * @param  int[]  $studentIds
     */
    public function captureStudents(
        array $studentIds,
        string $source,
        ?int $teacherId = null,
        ?int $schoolId = null,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?array $meta = null
    ): void {
        try {
            $ids = array_values(array_unique(array_filter(array_map('intval', $studentIds))));

            if ($ids === []) {
                return;
            }

            $students = Student::query()
                ->whereIn('id', $ids)
                ->get(['id', 'class_id', 'school_id', 'grade_id', 'name', 'name_ar', 'photo', 'status']);

            if ($students->isEmpty()) {
                return;
            }

            $byClass = $students->groupBy(fn (Student $student) => (int) ($student->class_id ?? 0));

            foreach ($byClass as $classId => $classStudents) {
                $classId = (int) $classId;

                if ($classId < 1) {
                    continue;
                }

                /** @var Collection<int, Student> $classStudents */
                $first = $classStudents->first();
                $resolvedSchoolId = $schoolId ?? (int) ($first->school_id ?? 0);
                $resolvedTeacherId = $teacherId ?? $this->resolveTeacherIdForClass($classId, $resolvedSchoolId);

                if ($resolvedSchoolId < 1 || $resolvedTeacherId < 1) {
                    Log::warning('performance_snapshot_batch_skipped_missing_scope', [
                        'class_id'   => $classId,
                        'source'     => $source,
                        'school_id'  => $resolvedSchoolId,
                        'teacher_id' => $resolvedTeacherId,
                    ]);

                    continue;
                }

                $subjectIds = $this->resolveSubjectIds($resolvedTeacherId, $classId);

                $this->recorder->snapshotClassStudents(
                    $classStudents->values(),
                    $subjectIds,
                    $resolvedTeacherId,
                    $resolvedSchoolId,
                    $classId,
                    $source,
                    'week',
                    null,
                    $sourceType,
                    $sourceId,
                    $meta
                );
            }
        } catch (Throwable $e) {
            Log::error('performance_snapshot_batch_failed', [
                'source'  => $source,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Daily / backfill capture for one teacher class.
     *
     * @param  Collection<int, Student>  $students
     * @param  int[]  $subjectIds
     */
    public function captureClassStudents(
        Collection $students,
        array $subjectIds,
        int $teacherId,
        int $schoolId,
        int $classId,
        string $source = PerformanceSnapshotSource::SCHEDULED_DAILY
    ): void {
        try {
            if ($students->isEmpty()) {
                return;
            }

            $this->recorder->snapshotClassStudents(
                $students,
                $subjectIds,
                $teacherId,
                $schoolId,
                $classId,
                $source
            );
        } catch (Throwable $e) {
            Log::error('performance_snapshot_class_failed', [
                'class_id'   => $classId,
                'teacher_id' => $teacherId,
                'source'     => $source,
                'message'    => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return int[]
     */
    private function resolveSubjectIds(int $teacherId, int $classId): array
    {
        return TeachersGrades::query()
            ->assignedToTeacher($teacherId)
            ->where('class_id', $classId)
            ->pluck('subject_id')
            ->unique()
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    private function resolveTeacherIdForClass(int $classId, int $schoolId): int
    {
        if ($classId < 1) {
            return 0;
        }

        $query = TeachersGrades::query()
            ->where('class_id', $classId)
            ->where('status', 1)
            ->orderBy('id');

        if ($schoolId > 0) {
            $query->where('school_id', $schoolId);
        }

        return (int) ($query->value('user_id') ?? 0);
    }
}
