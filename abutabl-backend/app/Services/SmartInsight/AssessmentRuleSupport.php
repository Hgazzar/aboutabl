<?php

namespace App\Services\SmartInsight;

/**
 * Shared read-only helpers for F-037D Assessment rules.
 */
class AssessmentRuleSupport
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public static function assessmentMetrics(array $context, array $extra = []): array
    {
        $metrics = [
            'quiz_accuracy' => $context['quiz_accuracy'] ?? null,
            'average_quiz_score' => $context['average_quiz_score'] ?? null,
            'successful_attempts' => (int) ($context['successful_attempts'] ?? 0),
            'failed_attempts' => (int) ($context['failed_attempts'] ?? 0),
            'quiz_attempt_count' => (int) ($context['quiz_attempt_count'] ?? 0),
            'quiz_result_count' => (int) ($context['quiz_result_count'] ?? 0),
            'quiz_improvement' => $context['quiz_improvement'] ?? null,
            'quiz_trend' => $context['quiz_trend'] ?? null,
            'quiz_history' => $context['quiz_history'] ?? [],
            'consecutive_failures' => (int) ($context['consecutive_failures'] ?? 0),
            'consecutive_successes' => (int) ($context['consecutive_successes'] ?? 0),
            'assessment_confidence' => $context['assessment_confidence'] ?? null,
            'assessment_risk' => $context['assessment_risk'] ?? null,
            'has_assessment_data' => (bool) ($context['has_assessment_data'] ?? false),
        ];

        $trend = $context['quiz_trend'] ?? null;
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
        if (isset($context['assessment_confidence']) && is_numeric($context['assessment_confidence'])) {
            return round(max(0.0, min(1.0, (float) $context['assessment_confidence'])), 2);
        }

        $score = $base;
        $count = (int) ($context['quiz_result_count'] ?? 0);
        if ($count >= 5) {
            $score += 0.25;
        } elseif ($count >= 3) {
            $score += 0.15;
        } elseif ($count >= 2) {
            $score += 0.05;
        }

        return round(max(0.0, min(1.0, $score)), 2);
    }
}
