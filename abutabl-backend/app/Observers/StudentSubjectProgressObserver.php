<?php

namespace App\Observers;

use App\Models\StudentSubjectProgress;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;

/**
 * Write-integration: progress table writes → performance_facts via Recorder.
 * No app writer exists today; observer covers future/Eloquent updates.
 */
class StudentSubjectProgressObserver
{
    /** @var PerformanceSnapshotTrigger */
    private $trigger;

    public function __construct(PerformanceSnapshotTrigger $trigger)
    {
        $this->trigger = $trigger;
    }

    public function saved(StudentSubjectProgress $progress): void
    {
        if (! $progress->wasRecentlyCreated && ! $progress->wasChanged('value')) {
            return;
        }

        $this->trigger->captureStudent(
            (int) $progress->student_id,
            PerformanceSnapshotSource::PROGRESS_UPDATED,
            null,
            null,
            null,
            StudentSubjectProgress::class,
            (int) $progress->id,
            [
                'subject_id' => (int) ($progress->subject_id ?? 0),
                'value'      => (float) ($progress->value ?? 0),
            ]
        );
    }
}
