<?php

namespace App\Services\SmartInsight;

/**
 * Shared read-only helpers for F-037G Achievement rules.
 */
class AchievementRuleSupport
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public static function achievementMetrics(array $context, array $extra = []): array
    {
        return array_merge([
            'achievement_score' => $context['achievement_score'] ?? null,
            'achievement_level' => $context['achievement_level'] ?? null,
            'achievement_confidence' => $context['achievement_confidence'] ?? null,
            'confidence' => $context['achievement_confidence'] ?? $context['confidence'] ?? null,
            'mastery_ratio' => $context['mastery_ratio'] ?? $context['standards_mastered_ratio'] ?? null,
            'mastered_subjects' => $context['mastered_subjects'] ?? 0,
            'mastered_standards' => $context['mastered_standards'] ?? null,
            'mastered_standards_count' => $context['mastered_standards_count'] ?? null,
            'improvement_score' => $context['improvement_score'] ?? null,
            'consistency_score' => $context['consistency_score'] ?? $context['learning_consistency'] ?? null,
            'learning_velocity' => $context['learning_velocity'] ?? null,
            'excellence_score' => $context['excellence_score'] ?? null,
            'milestone_count' => $context['milestone_count'] ?? 0,
            'positive_findings' => $context['achievement_positive_findings'] ?? $context['positive_findings'] ?? [],
            'contributing_factors' => $context['achievement_contributing_factors'] ?? $context['contributing_factors'] ?? [],
            'progress' => $context['progress'] ?? $context['progress_percent'] ?? null,
            'progress_trend' => $context['progress_trend'] ?? null,
            'performance' => $context['performance'] ?? $context['performance_percent'] ?? null,
            'performance_trend' => $context['performance_trend'] ?? null,
            'lesson_completion' => $context['lesson_completion'] ?? null,
            'completion_percentage' => $context['completion_percentage'] ?? null,
            'quiz_accuracy' => $context['quiz_accuracy'] ?? null,
            'engagement_score' => $context['engagement_score'] ?? null,
            'behaviour_score' => $context['behaviour_score'] ?? $context['engagement_score'] ?? null,
            'standards_mastered_ratio' => $context['standards_mastered_ratio'] ?? null,
            'standards_gap' => $context['standards_gap'] ?? null,
            'learning_consistency' => $context['learning_consistency'] ?? null,
            'has_achievement_data' => (bool) ($context['has_achievement_data'] ?? false),
        ], $extra);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function confidence(array $context, float $base = 0.55): float
    {
        if (isset($context['achievement_confidence']) && is_numeric($context['achievement_confidence'])) {
            return round(max(0.0, min(1.0, (float) $context['achievement_confidence'])), 2);
        }

        return round(max(0.0, min(1.0, $base)), 2);
    }
}
