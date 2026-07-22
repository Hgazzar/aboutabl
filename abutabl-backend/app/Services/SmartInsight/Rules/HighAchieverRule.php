<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AchievementRuleSupport;
use App\Services\SmartInsight\InsightDto;

class HighAchieverRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'high_achiever';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_achievement_data'])) {
            return null;
        }

        $level = (string) ($context['achievement_level'] ?? '');
        if ($level !== 'high') {
            return null;
        }

        $confidence = AchievementRuleSupport::confidence($context, 0.7);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Reinforce High Achievement';
        $description = 'Share positive feedback and keep stretch goals visible in upcoming lessons.';

        return InsightDto::make(
            $this->id(),
            'achievement',
            'success',
            'High Achiever',
            'Combined educational signals place the student in the high-achievement band.',
            $description,
            10,
            AchievementRuleSupport::achievementMetrics($context, ['confidence' => $confidence]),
            $context['generated_at'] ?? null,
            $confidence,
            'improving',
            $context['achievement_positive_findings'] ?? [],
            [],
            [],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    10,
                    'achievement',
                    'reinforce_achievement',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_week'
                ),
            ]
        );
    }
}
