<?php

namespace Tests\Unit;

use App\Services\PerformanceAnalytics\PerformanceFallback;
use App\Services\PerformanceAnalytics\PerformanceTimeSeriesService;
use App\Services\PerformanceAnalytics\PerformanceTrendService;
use App\Services\TeacherDashboardService;
use Tests\TestCase;

class PerformanceReadAuditTest extends TestCase
{
    public function test_fallback_is_canonical_for_flat_line_and_heuristic_trend(): void
    {
        $line = PerformanceFallback::flatAverageScoresLine(80.0, 70.0, 'week');
        $this->assertCount(7, $line);
        $this->assertSame(80.0, $line[0]['class_percent']);
        $this->assertSame(70.0, $line[0]['school_percent']);

        $this->assertSame('up', PerformanceFallback::heuristicTrendDirection(85.0));
        $this->assertSame('down', PerformanceFallback::heuristicTrendDirection(40.0));
        $this->assertSame('stable', PerformanceFallback::heuristicTrendDirection(0.0));
    }

    public function test_time_series_or_fallback_returns_contract_shape(): void
    {
        $points = app(PerformanceTimeSeriesService::class)->classVersusAllClassesLineOrFallback(
            21,
            [21, 22],
            'week',
            66.0,
            55.0
        );

        $this->assertNotEmpty($points);
        $this->assertArrayHasKey('label', $points[0]);
        $this->assertArrayHasKey('class_percent', $points[0]);
        $this->assertArrayHasKey('school_percent', $points[0]);
    }

    public function test_dashboard_no_longer_defines_private_flat_fallback(): void
    {
        $ref = new \ReflectionClass(TeacherDashboardService::class);
        $this->assertFalse($ref->hasMethod('buildFlatPerformanceLineChartFallback'));
        $this->assertFalse($ref->hasMethod('resolvePerformanceTrend'));
        $this->assertFalse($ref->hasMethod('formatPerformanceLineLabel'));
    }

    public function test_trend_or_fallback_exposes_has_history(): void
    {
        $trend = app(PerformanceTrendService::class)->forClassOrFallback(
            21,
            now()->copy()->subDays(7),
            now(),
            now()->copy()->subDays(14),
            now()->copy()->subDays(8),
            72.0
        );

        $this->assertArrayHasKey('direction', $trend);
        $this->assertArrayHasKey('delta_percent', $trend);
        $this->assertArrayHasKey('has_history', $trend);
    }
}
