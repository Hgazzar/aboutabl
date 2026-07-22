<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AchievementRuleSupport;
use App\Services\SmartInsight\InsightDto;

class SubjectMasteryRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'subject_mastery';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_achievement_data'])) {
            return null;
        }

        if (empty($context['subject_mastery_signal'])) {
            return null;
        }

        $confidence = AchievementRuleSupport::confidence($context, 0.7);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Acknowledge Subject Mastery';
        $description = 'Confirm mastery and assign extension work on related advanced standards.';

        return InsightDto::make(
            $this->id(),
            'achievement',
            'success',
            'Subject Mastery',
            'The student has mastered a high ratio of standards for the assigned subjects.',
            $description,
            11,
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
                    11,
                    'achievement',
                    'acknowledge_mastery',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_week'
                ),
            ]
        );
    }
}
