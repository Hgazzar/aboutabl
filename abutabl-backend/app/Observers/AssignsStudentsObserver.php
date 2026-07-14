<?php

namespace App\Observers;

use App\Models\AssignsStudents;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;

/**
 * Write-integration: assignment completion (opened_at) → performance_facts via Recorder.
 */
class AssignsStudentsObserver
{
    /** @var PerformanceSnapshotTrigger */
    private $trigger;

    public function __construct(PerformanceSnapshotTrigger $trigger)
    {
        $this->trigger = $trigger;
    }

    public function updated(AssignsStudents $row): void
    {
        if (! $row->wasChanged('opened_at') || $row->opened_at === null) {
            return;
        }

        $teacherId = (int) ($row->created_by ?? 0);

        if ($teacherId < 1 && $row->relationLoaded('assign') === false) {
            $row->loadMissing('assign:id,created_by,school_id');
        }

        if ($teacherId < 1) {
            $teacherId = (int) ($row->assign->created_by ?? 0);
        }

        $this->trigger->captureStudent(
            (int) $row->student_id,
            PerformanceSnapshotSource::ASSIGN_OPENED,
            $teacherId > 0 ? $teacherId : null,
            (int) ($row->school_id ?? 0) ?: null,
            null,
            AssignsStudents::class,
            (int) $row->id,
            ['assign_id' => (int) ($row->assign_id ?? 0)]
        );
    }
}
