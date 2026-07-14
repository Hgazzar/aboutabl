<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\TeachersGrades;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Daily write-integration: capture current metrics into performance_facts for all active teacher classes.
 *
 * Also covers "passive" StudentMetrics changes with no DB write event, e.g. overdue_count
 * increasing when due_at becomes past due overnight (time elapses without student action).
 */
class CaptureDailyPerformanceSnapshots extends Command
{
    protected $signature = 'performance:capture-daily {--teacher= : Limit to one teacher user_id}';

    protected $description = 'Snapshot student performance facts for analytics history (scheduled_daily)';

    public function handle(PerformanceSnapshotTrigger $trigger): int
    {
        $teacherFilter = $this->option('teacher');

        $assignments = TeachersGrades::query()
            ->where('status', 1)
            ->when($teacherFilter !== null && $teacherFilter !== '', function ($query) use ($teacherFilter) {
                $query->where('user_id', (int) $teacherFilter);
            })
            ->get(['user_id', 'class_id', 'subject_id', 'school_id']);

        if ($assignments->isEmpty()) {
            $this->info('No teacher class assignments found.');

            return 0;
        }

        $groups = $assignments->groupBy(function ($row) {
            return (int) $row->user_id.'|'.(int) $row->class_id.'|'.(int) $row->school_id;
        });

        $capturedGroups = 0;

        foreach ($groups as $key => $rows) {
            [$teacherId, $classId, $schoolId] = array_map('intval', explode('|', (string) $key));

            if ($teacherId < 1 || $classId < 1 || $schoolId < 1) {
                continue;
            }

            $subjectIds = $rows->pluck('subject_id')->unique()->filter()->map(fn ($id) => (int) $id)->values()->all();

            $students = Student::query()
                ->where('class_id', $classId)
                ->where('status', 1)
                ->get(['id', 'class_id', 'school_id', 'grade_id', 'name', 'name_ar', 'photo', 'status']);

            if ($students->isEmpty()) {
                continue;
            }

            $trigger->captureClassStudents(
                $students,
                $subjectIds,
                $teacherId,
                $schoolId,
                $classId,
                PerformanceSnapshotSource::SCHEDULED_DAILY
            );

            $capturedGroups++;
        }

        Log::info('performance_capture_daily_completed', [
            'groups' => $capturedGroups,
        ]);

        $this->info("Captured performance snapshots for {$capturedGroups} teacher/class groups.");

        return 0;
    }
}
