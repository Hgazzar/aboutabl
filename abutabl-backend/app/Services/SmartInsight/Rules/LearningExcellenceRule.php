<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AchievementRuleSupport;
use App\Services\SmartInsight\InsightDto;

class LearningExcellenceRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'learning_excellence';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_achievement_data'])) {
            return null;
        }

        $level = (string) ($context['achievement_level'] ?? '');
        if ($level !== 'excellence') {
            return null;
        }

        $confidence = AchievementRuleSupport::confidence($context, 0.75);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Showcase Learning Excellence';
        $description = 'Highlight excellence with enrichment pathways and leadership opportunities.';

        return InsightDto::make(
            $this->id(),
            'achievement',
            'success',
            'Learning Excellence',
            'Overall achievement signals place the student in the excellence band.',
            $description,
            4,
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
                    4,
                    'achievement',
                    'showcase_excellence',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_week'
                ),
            ]
        );
    }
}
