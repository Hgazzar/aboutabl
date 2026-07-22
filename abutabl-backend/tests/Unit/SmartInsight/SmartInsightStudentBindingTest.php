<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightMetricsReader;
use App\Services\SmartInsight\SmartInsightProvider;
use App\Services\PerformanceAnalytics\PerformanceHistoryService;
use App\Services\StudentMetricsService;
use App\Services\StudentProfile\StudentStandardsProvider;
use App\Services\TeacherDashboardService;
use Illuminate\Support\Collection;
use Mockery;
use Tests\TestCase;

/**
 * F-036 — Smart Insight must bind to the requested student_id only.
 */
class SmartInsightStudentBindingTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_metrics_reader_queries_use_requested_student_id_only(): void
    {
        $metrics = Mockery::mock(StudentMetricsService::class);
        $history = Mockery::mock(PerformanceHistoryService::class);
        $dashboard = Mockery::mock(TeacherDashboardService::class);
        $standards = Mockery::mock(StudentStandardsProvider::class);

        $dashboard->shouldReceive('resolveClassAccess')
            ->once()
            ->with(179, [13], 21)
            ->andReturn([
                'subjects_by_class' => [21 => [10]],
            ]);

        $metrics->shouldReceive('loadProgressByStudent')
            ->once()
            ->withArgs(function (Collection $studentIds, Collection $subjectIds) {
                return $studentIds->all() === [501]
                    && $subjectIds->all() === [10];
            })
            ->andReturn([]);

        $metrics->shouldReceive('computeProgress')
            ->once()
            ->with(501, [10], Mockery::any())
            ->andReturn(['percent' => 42.5, 'has_data' => true]);

        $history->shouldReceive('factsForStudent')
            ->once()
            ->withArgs(function (int $studentId, $from, $to, $classId, $flag) {
                return $studentId === 501 && (int) $classId === 21;
            })
            ->andReturn(collect());

        $standards->shouldReceive('build')->never();

        $reader = new InsightMetricsReader($metrics, $history, $dashboard, $standards);
        $ctx = $reader->build([
            'teacher_id' => 179,
            'school_ids' => [13],
            'class_id' => 21,
            'student_id' => 501,
            'student' => ['performance_percent' => 55.0],
            'standards' => ['available' => false, 'items' => []],
        ]);

        $this->assertSame(501, $ctx['student_id']);
        $this->assertSame(21, $ctx['class_id']);
        $this->assertSame([10], $ctx['subject_ids']);
        $this->assertSame(42.5, $ctx['progress_percent']);
        $this->assertTrue($ctx['has_progress_data']);
    }

    public function test_provider_returns_independent_payloads_per_student(): void
    {
        $reader = Mockery::mock(InsightMetricsReader::class);
        $engine = Mockery::mock(\App\Services\SmartInsight\SmartInsightEngine::class);

        $reader->shouldReceive('build')
            ->once()
            ->withArgs(function (array $context) {
                return (int) $context['student_id'] === 101;
            })
            ->andReturn([
                'student_id' => 101,
                'class_id' => 21,
                'generated_at' => '2026-07-18T00:00:00+00:00',
                'config' => ['engine' => ['max_insights' => 5]],
                'progress_percent' => 20.0,
                'has_progress_data' => true,
            ]);

        $reader->shouldReceive('build')
            ->once()
            ->withArgs(function (array $context) {
                return (int) $context['student_id'] === 202;
            })
            ->andReturn([
                'student_id' => 202,
                'class_id' => 21,
                'generated_at' => '2026-07-18T00:00:00+00:00',
                'config' => ['engine' => ['max_insights' => 5]],
                'progress_percent' => 90.0,
                'has_progress_data' => true,
            ]);

        $engine->shouldReceive('generate')
            ->once()
            ->withArgs(function (array $ctx) {
                return (int) $ctx['student_id'] === 101;
            })
            ->andReturn([[
                'id' => 'low_progress',
                'title' => 'Low Progress',
                'description' => 'Student 101 low',
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ]]);

        $engine->shouldReceive('generate')
            ->once()
            ->withArgs(function (array $ctx) {
                return (int) $ctx['student_id'] === 202;
            })
            ->andReturn([[
                'id' => 'high_progress',
                'title' => 'High Progress',
                'description' => 'Student 202 high',
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ]]);

        $provider = new SmartInsightProvider($reader, $engine, new \App\Services\SmartInsight\InsightQualityCalibrator());

        $a = $provider->build(['student_id' => 101, 'class_id' => 21]);
        $b = $provider->build(['student_id' => 202, 'class_id' => 21]);

        $this->assertTrue($a['available']);
        $this->assertTrue($b['available']);
        $this->assertSame('low_progress', $a['insights'][0]['id']);
        $this->assertSame('high_progress', $b['insights'][0]['id']);
        $this->assertStringContainsString('101', $a['insights'][0]['description']);
        $this->assertStringContainsString('202', $b['insights'][0]['description']);
    }

    public function test_provider_rejects_missing_student_id(): void
    {
        $reader = Mockery::mock(InsightMetricsReader::class);
        $engine = Mockery::mock(\App\Services\SmartInsight\SmartInsightEngine::class);
        $reader->shouldNotReceive('build');
        $engine->shouldNotReceive('generate');

        $provider = new SmartInsightProvider($reader, $engine, new \App\Services\SmartInsight\InsightQualityCalibrator());
        $out = $provider->build(['class_id' => 21, 'student_id' => 0]);

        $this->assertFalse($out['available']);
        $this->assertSame([], $out['insights']);
    }
}
