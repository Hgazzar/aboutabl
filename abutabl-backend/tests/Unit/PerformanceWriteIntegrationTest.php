<?php

namespace Tests\Unit;

use App\Models\AssignsStudents;
use App\Models\PerformanceFact;
use App\Observers\AssignsStudentsObserver;
use App\Services\PerformanceAnalytics\PerformanceSnapshotRecorder;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

/**
 * Phase 2 write-integration: snapshots go through Trigger → Recorder only.
 */
class PerformanceWriteIntegrationTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_assigns_students_observer_triggers_snapshot_on_opened_at(): void
    {
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')
            ->once()
            ->with(
                55,
                PerformanceSnapshotSource::ASSIGN_OPENED,
                179,
                1,
                null,
                AssignsStudents::class,
                11,
                Mockery::type('array')
            );

        $row = Mockery::mock(AssignsStudents::class)->makePartial();
        $row->shouldReceive('wasChanged')->with('opened_at')->andReturn(true);
        $row->opened_at = now();
        $row->student_id = 55;
        $row->school_id = 1;
        $row->created_by = 179;
        $row->assign_id = 9;
        $row->id = 11;

        (new AssignsStudentsObserver($trigger))->updated($row);
        $this->addToAssertionCount(1);
    }

    public function test_assigns_students_observer_ignores_unrelated_updates(): void
    {
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldNotReceive('captureStudent');

        $row = Mockery::mock(AssignsStudents::class)->makePartial();
        $row->shouldReceive('wasChanged')->with('opened_at')->andReturn(false);
        $row->opened_at = now();

        (new AssignsStudentsObserver($trigger))->updated($row);
        $this->assertTrue(true);
    }

    public function test_empty_class_capture_does_not_call_recorder(): void
    {
        $recorder = Mockery::mock(PerformanceSnapshotRecorder::class);
        $recorder->shouldNotReceive('snapshotClassStudents');
        $this->app->instance(PerformanceSnapshotRecorder::class, $recorder);

        app(PerformanceSnapshotTrigger::class)->captureClassStudents(
            collect(),
            [],
            179,
            1,
            21,
            PerformanceSnapshotSource::SCHEDULED_DAILY
        );

        $this->assertTrue(true);
    }

    public function test_only_recorder_can_write_performance_facts(): void
    {
        if (! Schema::hasTable('performance_facts')) {
            $this->markTestSkipped('performance_facts missing');
        }

        $this->expectException(\RuntimeException::class);

        PerformanceFact::query()->create([
            'fact_key'            => 'write-integration-block',
            'school_id'           => 1,
            'class_id'            => 21,
            'student_id'          => 1,
            'metric_date'         => '2026-07-14',
            'captured_at'         => now(),
            'performance_percent' => 1,
            'score_percent'       => 1,
            'completion_percent'  => 1,
            'source'              => PerformanceSnapshotSource::MANUAL_BACKFILL,
        ]);
    }

    public function test_snapshot_sources_include_assign_lifecycle(): void
    {
        $all = PerformanceSnapshotSource::all();

        $this->assertContains(PerformanceSnapshotSource::ASSIGN_CREATED, $all);
        $this->assertContains(PerformanceSnapshotSource::ASSIGN_DELETED, $all);
        $this->assertContains(PerformanceSnapshotSource::ASSIGN_OPENED, $all);
        $this->assertContains(PerformanceSnapshotSource::SCHEDULED_DAILY, $all);
        $this->assertContains(PerformanceSnapshotSource::PROGRESS_UPDATED, $all);
    }

    public function test_performance_capture_daily_command_is_registered(): void
    {
        $this->assertTrue(
            collect(\Artisan::all())->has('performance:capture-daily')
        );
    }
}
