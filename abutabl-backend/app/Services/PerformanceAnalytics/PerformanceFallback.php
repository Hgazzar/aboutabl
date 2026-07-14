<?php

namespace App\Services\PerformanceAnalytics;

use App\Services\StudentMetricsService;
use Carbon\Carbon;

/**
 * TEMPORARY fallback ONLY — not a permanent Analytics source of truth.
 *
 * ---------------------------------------------------------------------------
 * RULES (enforce in code review):
 * 1. Prefer performance_facts History via TimeSeries / Trend / Comparison
 *    whenever facts exist.
 * 2. Use this class SOLELY when History is empty (new installs / early days).
 * 3. Once History has accumulated enough days, REMOVE consumer dependence on
 *    these helpers (charts must read facts, not invent flat series).
 * 4. FORBIDDEN for any NEW Analytics, Reports, or AI features after History
 *    is available — that would resurrect Phase-1 fake series.
 * ---------------------------------------------------------------------------
 *
 * Ownership: Performance Analytics layer. Consumers must not invent parallel fallbacks.
 *
 * @see \App\Services\PerformanceAnalytics\PerformanceAnalyticsRules
 */
final class PerformanceFallback
{
    /**
     * TEMPORARY: flat Average Scores Over Time until history accumulates.
     * school_percent = All Classes average (API contract name unchanged).
     *
     * @return array<int, array{label: string, class_percent: float, school_percent: float}>
     */
    public static function flatAverageScoresLine(
        float $classPercent,
        float $allClassesPercent,
        string $range
    ): array {
        $range = in_array($range, ['week', 'month', 'term'], true) ? $range : 'week';
        $points = [];

        if ($range === 'month') {
            for ($week = 1; $week <= 4; $week++) {
                $points[] = [
                    'label'          => sprintf('W%d', $week),
                    'class_percent'  => $classPercent,
                    'school_percent' => $allClassesPercent,
                ];
            }

            return $points;
        }

        if ($range === 'term') {
            for ($month = 2; $month >= 0; $month--) {
                $points[] = [
                    'label'          => now()->copy()->subMonths($month)->format('M'),
                    'class_percent'  => $classPercent,
                    'school_percent' => $allClassesPercent,
                ];
            }

            return $points;
        }

        foreach (['Su', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as $label) {
            $points[] = [
                'label'          => $label,
                'class_percent'  => $classPercent,
                'school_percent' => $allClassesPercent,
            ];
        }

        return $points;
    }

    /**
     * TEMPORARY: point-in-time heuristic when no temporal facts exist yet.
     * Not a substitute for PerformanceTrendService once History has data.
     */
    public static function heuristicTrendDirection(float $performancePercent): string
    {
        if ($performancePercent <= 0) {
            return 'stable';
        }

        if ($performancePercent >= StudentMetricsService::NEED_ATTENTION_THRESHOLD) {
            return 'up';
        }

        return 'down';
    }

    /**
     * Format a history date into chart labels matching the flat fallback style.
     */
    public static function formatLineLabel(string $date, string $range): string
    {
        $carbon = Carbon::parse($date);
        $range = in_array($range, ['week', 'month', 'term'], true) ? $range : 'week';

        if ($range === 'month') {
            return sprintf('W%d', max(1, (int) $carbon->weekOfMonth));
        }

        if ($range === 'term') {
            return $carbon->format('M');
        }

        $map = [
            'Sun' => 'Su',
            'Mon' => 'Mon',
            'Tue' => 'Tue',
            'Wed' => 'Wed',
            'Thu' => 'Thu',
            'Fri' => 'Fri',
            'Sat' => 'Sat',
        ];

        $short = $carbon->format('D');

        return $map[$short] ?? $short;
    }
}
