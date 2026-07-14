<?php

namespace App\Services\PerformanceAnalytics;

use Carbon\Carbon;

/**
 * Temporal trend from stored facts (SSOT History).
 * Direction/delta derived from Comparison of fact averages — not from re-running Metrics.
 * Empty history → PerformanceFallback::heuristicTrendDirection (TEMPORARY only).
 */
class PerformanceTrendService
{
    /** @var PerformanceComparisonService */
    private $comparison;

    public function __construct(PerformanceComparisonService $comparison)
    {
        $this->comparison = $comparison;
    }

    /**
     * @return array{direction: string, delta_percent: float, current_avg: float, previous_avg: float, has_history: bool}
     */
    public function forClass(
        int $classId,
        Carbon $currentFrom,
        Carbon $currentTo,
        Carbon $previousFrom,
        Carbon $previousTo
    ): array {
        $result = $this->comparison->compareClassPeriods(
            $classId,
            $currentFrom,
            $currentTo,
            $previousFrom,
            $previousTo
        );

        return $this->toTrend($result);
    }

    /**
     * Single comparison pass with canonical heuristic fallback when no facts exist.
     *
     * @return array{direction: string, delta_percent: float, current_avg: float, previous_avg: float, has_history: bool}
     */
    public function forClassOrFallback(
        int $classId,
        Carbon $currentFrom,
        Carbon $currentTo,
        Carbon $previousFrom,
        Carbon $previousTo,
        float $fallbackPerformancePercent
    ): array {
        try {
            $trend = $this->forClass(
                $classId,
                $currentFrom,
                $currentTo,
                $previousFrom,
                $previousTo
            );

            if (! $trend['has_history']) {
                return [
                    'direction'     => PerformanceFallback::heuristicTrendDirection($fallbackPerformancePercent),
                    'delta_percent' => 0.0,
                    'current_avg'   => $fallbackPerformancePercent,
                    'previous_avg'  => 0.0,
                    'has_history'   => false,
                ];
            }

            return $trend;
        } catch (\Throwable $e) {
            return [
                'direction'     => PerformanceFallback::heuristicTrendDirection($fallbackPerformancePercent),
                'delta_percent' => 0.0,
                'current_avg'   => $fallbackPerformancePercent,
                'previous_avg'  => 0.0,
                'has_history'   => false,
            ];
        }
    }

    /**
     * @return array{direction: string, delta_percent: float, current_avg: float, previous_avg: float, has_history: bool}
     */
    public function forStudent(
        int $studentId,
        Carbon $currentFrom,
        Carbon $currentTo,
        Carbon $previousFrom,
        Carbon $previousTo,
        ?int $classId = null
    ): array {
        $result = $this->comparison->compareStudentPeriods(
            $studentId,
            $currentFrom,
            $currentTo,
            $previousFrom,
            $previousTo,
            $classId
        );

        return $this->toTrend($result);
    }

    /**
     * Week-over-week trend for a class.
     *
     * @return array{direction: string, delta_percent: float, current_avg: float, previous_avg: float, has_history: bool}
     */
    public function weekOverWeekForClass(int $classId, ?Carbon $anchor = null): array
    {
        $result = $this->comparison->weekOverWeekForClass($classId, $anchor);

        return $this->toTrend($result);
    }

    /**
     * @param  array{current_avg: float, previous_avg: float, delta_percent: float, current_count?: int, previous_count?: int}  $comparison
     * @return array{direction: string, delta_percent: float, current_avg: float, previous_avg: float, has_history: bool}
     */
    private function toTrend(array $comparison): array
    {
        $delta = (float) $comparison['delta_percent'];
        $currentCount = (int) ($comparison['current_count'] ?? 0);
        $previousCount = (int) ($comparison['previous_count'] ?? 0);
        $hasHistory = $currentCount > 0 || $previousCount > 0;

        if (! $hasHistory) {
            $direction = 'stable';
        } elseif (abs($delta) < 0.5) {
            $direction = 'stable';
        } elseif ($delta > 0) {
            $direction = 'up';
        } else {
            $direction = 'down';
        }

        return [
            'direction'     => $direction,
            'delta_percent' => $delta,
            'current_avg'   => (float) $comparison['current_avg'],
            'previous_avg'  => (float) $comparison['previous_avg'],
            'has_history'   => $hasHistory,
        ];
    }
}
