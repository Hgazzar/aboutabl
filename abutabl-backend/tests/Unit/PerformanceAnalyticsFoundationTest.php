<?php

namespace Tests\Unit;

use App\Models\PerformanceFact;
use App\Services\PerformanceAnalytics\PerformanceComparisonService;
use App\Services\PerformanceAnalytics\PerformanceHistoryService;
use App\Services\PerformanceAnalytics\PerformanceSnapshotRecorder;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceTimeSeriesService;
use App\Services\PerformanceAnalytics\PerformanceTrendService;
use App\Services\StudentMetricsService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Foundation tests for Performance Analytics Phase 1 (no HTTP / no integration).
 */
class PerformanceAnalyticsFoundationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! Schema::hasTable('performance_facts')) {
            $this->markTestSkipped('performance_facts table is not migrated yet.');
        }
    }

    public function test_fact_key_treats_null_subject_as_zero(): void
    {
        $this->assertSame(
            '10:21:0:2026-07-14',
            PerformanceFact::buildFactKey(10, 21, null, '2026-07-14')
        );
        $this->assertSame(
            '10:21:5:2026-07-14',
            PerformanceFact::buildFactKey(10, 21, 5, '2026-07-14')
        );
    }

    public function test_recorder_is_sole_writer_and_upserts_same_day(): void
    {
        Schema::disableForeignKeyConstraints();

        try {
            $recorder = app(PerformanceSnapshotRecorder::class);

            $first = $recorder->record([
                'school_id'           => 1,
                'class_id'            => 21,
                'student_id'          => 900001,
                'metric_date'         => '2026-07-14',
                'performance_percent' => 70.0,
                'score_percent'       => 80.0,
                'overdue_count'       => 1,
                'has_progress_data'   => false,
                'source'              => PerformanceSnapshotSource::MANUAL_BACKFILL,
            ]);

            $second = $recorder->record([
                'school_id'           => 1,
                'class_id'            => 21,
                'student_id'          => 900001,
                'metric_date'         => '2026-07-14',
                'performance_percent' => 75.5,
                'score_percent'       => 85.0,
                'overdue_count'       => 0,
                'has_progress_data'   => false,
                'source'              => PerformanceSnapshotSource::SCHEDULED_DAILY,
            ]);

            $this->assertSame($first->id, $second->id);
            $this->assertSame(75.5, (float) $second->performance_percent);
            $this->assertSame(85.0, (float) $second->completion_percent);
            $this->assertSame(PerformanceSnapshotSource::SCHEDULED_DAILY, $second->source);
        } finally {
            PerformanceFact::query()->where('student_id', 900001)->delete();
            Schema::enableForeignKeyConstraints();
        }
    }

    public function test_reader_services_build_series_comparison_and_trend(): void
    {
        Schema::disableForeignKeyConstraints();

        try {
            $recorder = app(PerformanceSnapshotRecorder::class);

            $recorder->record([
                'school_id'           => 1,
                'class_id'            => 21,
                'student_id'          => 900002,
                'metric_date'         => '2026-07-01',
                'performance_percent' => 60.0,
                'score_percent'       => 60.0,
                'source'              => PerformanceSnapshotSource::MANUAL_BACKFILL,
            ]);
            $recorder->record([
                'school_id'           => 1,
                'class_id'            => 21,
                'student_id'          => 900002,
                'metric_date'         => '2026-07-08',
                'performance_percent' => 80.0,
                'score_percent'       => 80.0,
                'source'              => PerformanceSnapshotSource::MANUAL_BACKFILL,
            ]);
            $recorder->record([
                'school_id'           => 1,
                'class_id'            => 22,
                'student_id'          => 900003,
                'metric_date'         => '2026-07-08',
                'performance_percent' => 90.0,
                'score_percent'       => 90.0,
                'source'              => PerformanceSnapshotSource::MANUAL_BACKFILL,
            ]);

            $timeSeries = app(PerformanceTimeSeriesService::class);
            $classSeries = $timeSeries->classSeries(
                21,
                Carbon::parse('2026-07-01'),
                Carbon::parse('2026-07-08')
            );
            $this->assertCount(2, $classSeries);
            $this->assertSame(80.0, $classSeries[1]['performance_percent']);

            $versus = $timeSeries->classVersusAllClassesSeries(
                21,
                [21, 22],
                Carbon::parse('2026-07-08'),
                Carbon::parse('2026-07-08')
            );
            $this->assertCount(1, $versus);
            $this->assertSame(80.0, $versus[0]['class_percent']);
            $this->assertSame(85.0, $versus[0]['all_classes_percent']);

            $trend = app(PerformanceTrendService::class)->forClass(
                21,
                Carbon::parse('2026-07-08'),
                Carbon::parse('2026-07-08'),
                Carbon::parse('2026-07-01'),
                Carbon::parse('2026-07-01')
            );
            $this->assertSame('up', $trend['direction']);
            $this->assertSame(20.0, $trend['delta_percent']);

            $history = app(PerformanceHistoryService::class);
            $this->assertNotNull($history->latestForStudent(900002, 21));
        } finally {
            PerformanceFact::query()->whereIn('student_id', [900002, 900003])->delete();
            Schema::enableForeignKeyConstraints();
        }
    }

    public function test_recorder_reuses_student_metrics_service(): void
    {
        $recorder = app(PerformanceSnapshotRecorder::class);
        $ref = new \ReflectionClass($recorder);
        $prop = $ref->getProperty('metrics');
        $prop->setAccessible(true);

        $this->assertInstanceOf(StudentMetricsService::class, $prop->getValue($recorder));
    }

    public function test_comparison_week_over_week_shape(): void
    {
        $shape = app(PerformanceComparisonService::class)->weekOverWeekForClass(21, Carbon::parse('2026-07-14'));

        $this->assertArrayHasKey('current_avg', $shape);
        $this->assertArrayHasKey('previous_avg', $shape);
        $this->assertArrayHasKey('delta_percent', $shape);
        $this->assertArrayHasKey('current_from', $shape);
        $this->assertArrayHasKey('previous_to', $shape);
    }

    public function test_direct_model_writes_are_blocked_single_writer_principle(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('PerformanceSnapshotRecorder');

        PerformanceFact::query()->create([
            'fact_key'             => 'blocked:1:0:2026-07-14',
            'school_id'            => 1,
            'class_id'             => 21,
            'student_id'           => 900099,
            'metric_date'          => '2026-07-14',
            'captured_at'          => now(),
            'performance_percent'  => 50,
            'score_percent'        => 50,
            'completion_percent'   => 50,
            'source'               => PerformanceSnapshotSource::MANUAL_BACKFILL,
        ]);
    }

    public function test_record_many_batch_upsert_uses_single_writer(): void
    {
        Schema::disableForeignKeyConstraints();

        try {
            $recorder = app(PerformanceSnapshotRecorder::class);
            $facts = $recorder->recordMany([
                [
                    'school_id'           => 1,
                    'class_id'            => 21,
                    'student_id'          => 900010,
                    'metric_date'         => '2026-07-10',
                    'performance_percent' => 55.0,
                    'score_percent'       => 55.0,
                    'source'              => PerformanceSnapshotSource::MANUAL_BACKFILL,
                ],
                [
                    'school_id'           => 1,
                    'class_id'            => 21,
                    'student_id'          => 900011,
                    'metric_date'         => '2026-07-10',
                    'performance_percent' => 65.0,
                    'score_percent'       => 65.0,
                    'source'              => PerformanceSnapshotSource::MANUAL_BACKFILL,
                ],
            ]);

            $this->assertCount(2, $facts);
            $this->assertSame(1, PerformanceFact::query()->where('student_id', 900010)->count());
        } finally {
            PerformanceFact::query()->whereIn('student_id', [900010, 900011])->delete();
            Schema::enableForeignKeyConstraints();
        }
    }
}
