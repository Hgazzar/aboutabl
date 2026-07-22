<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightMetricsReader;
use App\Services\SmartInsight\SmartInsightEngine;
use App\Services\SmartInsight\SmartInsightProvider;
use App\Services\SmartInsight\InsightQualityCalibrator;
use Mockery;
use Tests\TestCase;

/**
 * F-040A — Performance hardening checks for Smart Insight hot path.
 */
class ProductionHardeningTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_metrics_reader_skips_dashboard_hydrate_when_subject_ids_provided(): void
    {
        $metrics = Mockery::mock(\App\Services\StudentMetricsService::class);
        $history = Mockery::mock(\App\Services\PerformanceAnalytics\PerformanceHistoryService::class);
        $dashboard = Mockery::mock(\App\Services\TeacherDashboardService::class);
        $standards = Mockery::mock(\App\Services\StudentProfile\StudentStandardsProvider::class);

        $dashboard->shouldReceive('resolveClassAccess')->never();
        $standards->shouldReceive('build')->never();
        $history->shouldReceive('factsForStudent')->once()->andReturn(collect());

        $metrics->shouldReceive('loadProgressByStudent')
            ->once()
            ->andReturn([501 => [10 => 40.0]]);
        $metrics->shouldReceive('computeProgress')
            ->once()
            ->andReturn(['percent' => 40.0, 'has_data' => true]);

        $reader = new InsightMetricsReader($metrics, $history, $dashboard, $standards);
        $ctx = $reader->build([
            'teacher_id' => 179,
            'school_ids' => [13],
            'class_id' => 21,
            'student_id' => 501,
            'subject_ids' => [10],
            'student' => ['performance_percent' => 55.0],
            'standards' => ['available' => false, 'items' => []],
            'assessment' => ['has_assessment_data' => false],
            'learning_behaviour' => ['has_learning_behaviour_data' => false],
            'risk' => ['has_risk_data' => false],
            'achievement' => ['has_achievement_data' => false],
        ]);

        $this->assertSame(501, $ctx['student_id']);
        $this->assertSame([10], $ctx['subject_ids']);
        $this->assertSame(40.0, $ctx['progress_percent']);
        $this->assertSame(1, $ctx['ssp_row_count']);
    }

    public function test_provider_executes_reader_and_engine_once(): void
    {
        $reader = Mockery::mock(InsightMetricsReader::class);
        $engine = Mockery::mock(SmartInsightEngine::class);

        $reader->shouldReceive('build')->once()->andReturn([
            'student_id' => 9,
            'generated_at' => '2026-07-18T00:00:00+00:00',
        ]);
        $engine->shouldReceive('generate')->once()->andReturn([
            [
                'id' => 'low_progress',
                'category' => 'progress',
                'severity' => 'warning',
                'title' => 'Low Progress',
                'description' => 'Low',
                'recommendation' => 'Act',
                'priority' => 10,
                'confidence' => 0.7,
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ],
        ]);

        $provider = new SmartInsightProvider($reader, $engine, new InsightQualityCalibrator());
        $payload = $provider->build(['student_id' => 9]);

        $this->assertTrue($payload['available']);
        $this->assertSame('low_progress', $payload['insights'][0]['id']);
    }

    public function test_smart_insight_services_remain_read_only(): void
    {
        $paths = [
            app_path('Services/SmartInsight/InsightMetricsReader.php'),
            app_path('Services/SmartInsight/SmartInsightProvider.php'),
            app_path('Services/SmartInsight/InsightQualityCalibrator.php'),
        ];
        foreach ($paths as $path) {
            $src = file_get_contents($path);
            foreach (['->save(', '->update(', '->delete(', '::insert(', 'ProgressWriterService'] as $needle) {
                $this->assertStringNotContainsString($needle, $src, basename($path));
            }
        }
    }
}
