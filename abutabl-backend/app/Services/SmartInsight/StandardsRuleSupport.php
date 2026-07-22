<?php

namespace App\Services\SmartInsight;

/**
 * Shared read-only helpers for F-037C Standards rules.
 */
class StandardsRuleSupport
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public static function standardsMetrics(array $context, array $extra = []): array
    {
        $metrics = [
            'standards' => $context['standards'] ?? [],
            'standards_average' => $context['standards_average'] ?? null,
            'standards_gap' => $context['standards_gap'] ?? null,
            'standards_gap_percent' => $context['standards_gap_percent'] ?? null,
            'standards_trend' => $context['standards_trend'] ?? null,
            'mastered_standards' => $context['mastered_standards'] ?? [],
            'weak_standards' => $context['weak_standards'] ?? [],
            'mastered_standards_count' => (int) ($context['mastered_standards_count'] ?? 0),
            'weak_standards_count' => (int) ($context['weak_standards_count'] ?? 0),
            'standards_total_count' => (int) ($context['standards_total_count'] ?? 0),
            'standards_history' => $context['standards_history'] ?? [],
            'standards_mastered_ratio' => $context['standards_mastered_ratio'] ?? null,
            'risk_score' => $context['standards_risk_score'] ?? $context['risk_score'] ?? null,
            'has_standards_data' => (bool) ($context['has_standards_data'] ?? false),
        ];

        $trend = $context['standards_trend'] ?? null;
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
        if (! empty($context['has_standards_data'])) {
            $score += 0.15;
        }
        $total = (int) ($context['standards_total_count'] ?? 0);
        if ($total >= 5) {
            $score += 0.2;
        } elseif ($total >= 2) {
            $score += 0.12;
        } elseif ($total === 1) {
            $score += 0.05;
        }

        return round(max(0.0, min(1.0, $score)), 2);
    }
}
