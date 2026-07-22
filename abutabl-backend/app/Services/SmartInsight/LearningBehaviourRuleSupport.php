<?php

namespace App\Services\SmartInsight;

/**
 * Shared read-only helpers for F-037E Learning Behaviour rules.
 */
class LearningBehaviourRuleSupport
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public static function behaviourMetrics(array $context, array $extra = []): array
    {
        $metrics = [
            'engagement_score' => $context['engagement_score'] ?? null,
            'engagement_trend' => $context['engagement_trend'] ?? null,
            'study_days' => $context['study_days'] ?? null,
            'active_days' => $context['active_days'] ?? null,
            'inactive_days' => $context['inactive_days'] ?? null,
            'weekly_activity' => $context['weekly_activity'] ?? null,
            'monthly_activity' => $context['monthly_activity'] ?? null,
            'session_count' => $context['session_count'] ?? null,
            'average_session_time' => $context['average_session_time'] ?? null,
            'learning_consistency' => $context['learning_consistency'] ?? null,
            'return_after_inactivity' => $context['return_after_inactivity'] ?? null,
            'activity_distribution' => $context['activity_distribution'] ?? null,
            'confidence' => $context['behaviour_confidence'] ?? $context['confidence'] ?? null,
            'has_learning_behaviour_data' => (bool) ($context['has_learning_behaviour_data'] ?? false),
        ];

        $trend = $context['engagement_trend'] ?? null;
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
        if (isset($context['behaviour_confidence']) && is_numeric($context['behaviour_confidence'])) {
            return round(max(0.0, min(1.0, (float) $context['behaviour_confidence'])), 2);
        }

        $score = $base;
        $active = (int) ($context['active_days'] ?? 0);
        if ($active >= 5) {
            $score += 0.25;
        } elseif ($active >= 3) {
            $score += 0.15;
        } elseif ($active >= 1) {
            $score += 0.05;
        }

        return round(max(0.0, min(1.0, $score)), 2);
    }
}
