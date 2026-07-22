<?php

namespace App\Services\SmartInsight;

/**
 * Shared read-only helpers for F-037B Performance rules.
 */
class PerformanceRuleSupport
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public static function performanceMetrics(array $context, array $extra = []): array
    {
        $performance = (float) ($context['performance'] ?? $context['performance_percent'] ?? 0);

        $metrics = [
            'performance' => $performance,
            'performance_percent' => $performance,
            'performance_average' => $context['performance_average'] ?? null,
            'performance_trend' => $context['performance_trend'] ?? null,
            'performance_delta' => $context['performance_delta'] ?? null,
            'performance_history' => $context['performance_history'] ?? [],
            'performance_snapshot_count' => (int) ($context['performance_snapshot_count'] ?? 0),
            'performance_stddev' => $context['performance_stddev'] ?? null,
            'risk_score' => $context['risk_score'] ?? null,
            'has_performance_data' => (bool) ($context['has_performance_data'] ?? false),
        ];

        $trend = $context['performance_trend'] ?? null;
        if (is_string($trend) && $trend !== '') {
            $metrics['trend'] = $trend;
        }

        return array_merge($metrics, $extra);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function confidence(array $context, float $base = 0.55): float
    {
        $score = $base;
        if (! empty($context['has_performance_data'])) {
            $score += 0.15;
        }
        $count = (int) ($context['performance_snapshot_count'] ?? 0);
        if ($count >= 3) {
            $score += 0.2;
        } elseif ($count >= 2) {
            $score += 0.12;
        } elseif ($count === 1) {
            $score += 0.05;
        }

        return round(max(0.0, min(1.0, $score)), 2);
    }
}
