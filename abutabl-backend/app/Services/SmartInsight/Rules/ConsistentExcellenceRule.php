<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AchievementRuleSupport;
use App\Services\SmartInsight\InsightDto;

class ConsistentExcellenceRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'consistent_excellence';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_achievement_data'])) {
            return null;
        }

        if (empty($context['consistent_excellence_signal'])) {
            return null;
        }

        $confidence = AchievementRuleSupport::confidence($context, 0.7);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Sustain Consistent Excellence';
        $description = 'Maintain routines that support steady excellence and invite peer mentoring roles.';

        return InsightDto::make(
            $this->id(),
            'achievement',
            'success',
            'Consistent Excellence',
            'Strong learning consistency combined with high excellence signals across metrics.',
            $description,
            12,
            AchievementRuleSupport::achievementMetrics($context, ['confidence' => $confidence]),
            $context['generated_at'] ?? null,
            $confidence,
            'stable',
            $context['achievement_positive_findings'] ?? [],
            [],
            [],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    12,
                    'achievement',
                    'sustain_excellence',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_month'
                ),
            ]
        );
    }
}
