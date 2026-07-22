<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AchievementRuleSupport;
use App\Services\SmartInsight\InsightDto;

class OutstandingImprovementRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'outstanding_improvement';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_achievement_data'])) {
            return null;
        }

        if (empty($context['outstanding_improvement_signal'])) {
            return null;
        }

        $confidence = AchievementRuleSupport::confidence($context, 0.7);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Recognize Outstanding Improvement';
        $description = 'Praise the improvement trajectory and lock in habits that produced the gains.';

        return InsightDto::make(
            $this->id(),
            'achievement',
            'success',
            'Outstanding Improvement',
            'Improvement signals across progress and related metrics show outstanding upward movement.',
            $description,
            8,
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
                    8,
                    'achievement',
                    'recognize_improvement',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_week'
                ),
            ]
        );
    }
}
