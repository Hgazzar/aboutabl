<?php

namespace App\Services\SmartInsight;

/**
 * Shared read-only helpers for F-037F Risk rules.
 */
class RiskRuleSupport
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public static function riskMetrics(array $context, array $extra = []): array
    {
        $educational = $context['educational_risk_score'] ?? null;

        return array_merge([
            'risk_score' => $educational,
            'educational_risk_score' => $educational,
            'risk_level' => $context['risk_level'] ?? null,
            'confidence' => $context['risk_confidence'] ?? $context['confidence'] ?? null,
            'inactive_days' => $context['inactive_days'] ?? null,
            'days_since_activity' => $context['days_since_activity'] ?? null,
            'progress' => $context['progress'] ?? $context['progress_percent'] ?? null,
            'progress_trend' => $context['progress_trend'] ?? null,
            'performance' => $context['performance'] ?? $context['performance_percent'] ?? null,
            'performance_trend' => $context['performance_trend'] ?? null,
            'lesson_completion' => $context['lesson_completion'] ?? null,
            'completion_percentage' => $context['completion_percentage'] ?? null,
            'quiz_accuracy' => $context['quiz_accuracy'] ?? null,
            'engagement_score' => $context['engagement_score'] ?? null,
            'behaviour_score' => $context['behaviour_score'] ?? $context['engagement_score'] ?? null,
            'standards_gap' => $context['standards_gap'] ?? null,
            'standards_mastered_ratio' => $context['standards_mastered_ratio'] ?? null,
            'learning_consistency' => $context['learning_consistency'] ?? null,
            'contributing_factors' => $context['contributing_factors'] ?? [],
            'detected_patterns' => $context['detected_patterns'] ?? [],
            'has_risk_data' => (bool) ($context['has_risk_data'] ?? false),
        ], $extra);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function confidence(array $context, float $base = 0.55): float
    {
        if (isset($context['risk_confidence']) && is_numeric($context['risk_confidence'])) {
            return round(max(0.0, min(1.0, (float) $context['risk_confidence'])), 2);
        }

        return round(max(0.0, min(1.0, $base)), 2);
    }
}
