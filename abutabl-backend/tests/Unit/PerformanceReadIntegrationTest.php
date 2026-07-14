<?php

namespace Tests\Unit;

use App\Services\PerformanceAnalytics\PerformanceComparisonService;
use App\Services\PerformanceAnalytics\PerformanceTimeSeriesService;
use App\Services\PerformanceAnalytics\PerformanceTrendService;
use App\Services\StudentProfile\StudentAnalyticsProvider;
use App\Services\StudentMetricsService;
use App\Services\TeacherDashboardService;
use Tests\TestCase;

/**
 * Phase 3 read-integration smoke: services resolve and keep contracts.
 */
class PerformanceReadIntegrationTest extends TestCase
{
    public function test_teacher_dashboard_and_analytics_services_resolve(): void
    {
        $this->assertInstanceOf(TeacherDashboardService::class, app(TeacherDashboardService::class));
        $this->assertInstanceOf(StudentAnalyticsProvider::class, app(StudentAnalyticsProvider::class));
        $this->assertInstanceOf(PerformanceTimeSeriesService::class, app(PerformanceTimeSeriesService::class));
        $this->assertInstanceOf(PerformanceTrendService::class, app(PerformanceTrendService::class));
        $this->assertInstanceOf(PerformanceComparisonService::class, app(PerformanceComparisonService::class));
    }

    public function test_class_details_overview_keeps_performance_contract_keys(): void
    {
        $payload = app(TeacherDashboardService::class)->buildClassDetailsOverview(179, [], 21, 'week');

        $this->assertArrayHasKey('stats', $payload);
        $this->assertArrayHasKey('performance_percent', $payload['stats']);
        $this->assertArrayHasKey('performance_trend', $payload['stats']);
        $this->assertArrayHasKey('direction', $payload['stats']['performance_trend']);
        $this->assertArrayHasKey('delta_percent', $payload['stats']['performance_trend']);
        $this->assertArrayHasKey('charts', $payload);
        $this->assertArrayHasKey('performance_line', $payload['charts']);
        $this->assertIsArray($payload['charts']['performance_line']);

        if ($payload['charts']['performance_line'] !== []) {
            $point = $payload['charts']['performance_line'][0];
            $this->assertArrayHasKey('label', $point);
            $this->assertArrayHasKey('class_percent', $point);
            $this->assertArrayHasKey('school_percent', $point);
        }
    }

    public function test_student_analytics_provider_keeps_series_shape_with_fallback(): void
    {
        $provider = app(StudentAnalyticsProvider::class);
        $payload = $provider->build(
            179,
            1,
            collect([1]),
            'week',
            [
                'performance_percent' => 70.0,
                'score_percent'       => 80.0,
            ],
            21
        );

        $this->assertArrayHasKey('available', $payload);
        $this->assertArrayHasKey('series', $payload);
        $this->assertArrayHasKey('summary', $payload);
        $this->assertArrayHasKey('performance_percent', $payload['summary']);
        $this->assertArrayHasKey('delta_percent', $payload['summary']);
        $this->assertArrayHasKey('completion_percent', $payload['summary']);
    }
}
