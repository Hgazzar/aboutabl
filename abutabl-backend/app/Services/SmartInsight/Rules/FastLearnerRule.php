<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AchievementRuleSupport;
use App\Services\SmartInsight\InsightDto;

class FastLearnerRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'fast_learner';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_achievement_data'])) {
            return null;
        }

        if (empty($context['fast_learner_signal'])) {
            return null;
        }

        $confidence = AchievementRuleSupport::confidence($context, 0.65);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Support Fast Learning Pace';
        $description = 'Provide accelerated pathways and optional challenge modules to sustain momentum.';

        return InsightDto::make(
            $this->id(),
            'achievement',
            'info',
            'Fast Learner',
            'Learning velocity indicates the student is progressing faster than the typical pace.',
            $description,
            13,
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
                    13,
                    'achievement',
                    'accelerate_pathway',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_week'
                ),
            ]
        );
    }
}
