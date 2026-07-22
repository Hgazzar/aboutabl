<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AchievementRuleSupport;
use App\Services\SmartInsight\InsightDto;

class MilestoneAchievedRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'milestone_achieved';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_achievement_data'])) {
            return null;
        }

        $milestones = (int) ($context['milestone_count'] ?? 0);
        if ($milestones <= 0) {
            return null;
        }

        $confidence = AchievementRuleSupport::confidence($context, 0.65);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Celebrate Learning Milestone';
        $description = 'Acknowledge the milestone publicly and set the next clear target.';

        return InsightDto::make(
            $this->id(),
            'achievement',
            'info',
            'Milestone Achieved',
            'The student has reached one or more measurable learning milestones.',
            $description,
            14,
            AchievementRuleSupport::achievementMetrics($context, [
                'confidence' => $confidence,
                'milestone_count' => $milestones,
            ]),
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
                    14,
                    'achievement',
                    'celebrate_milestone',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_week'
                ),
            ]
        );
    }
}
