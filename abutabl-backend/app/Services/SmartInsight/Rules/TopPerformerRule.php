<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AchievementRuleSupport;
use App\Services\SmartInsight\InsightDto;

class TopPerformerRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'top_performer';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_achievement_data'])) {
            return null;
        }

        if (empty($context['top_performer_signal'])) {
            return null;
        }

        $confidence = AchievementRuleSupport::confidence($context, 0.7);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Celebrate Top Performance';
        $description = 'Recognize top-tier results and offer advanced enrichment challenges.';

        return InsightDto::make(
            $this->id(),
            'achievement',
            'success',
            'Top Performer',
            'The student ranks among top performers based on performance and assessment accuracy.',
            $description,
            9,
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
                    9,
                    'achievement',
                    'recognize_top_performer',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_week'
                ),
            ]
        );
    }
}
