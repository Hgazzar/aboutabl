<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\LearningBehaviourRuleSupport;

class LowEngagementRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'low_engagement';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_learning_behaviour_data'])) {
            return null;
        }

        $score = $context['engagement_score'] ?? null;
        if ($score === null) {
            return null;
        }

        $score = (float) $score;
        $threshold = (float) ($context['config']['learning_behaviour']['low_engagement_threshold'] ?? 25);

        if ($score >= $threshold) {
            return null;
        }

        $confidence = LearningBehaviourRuleSupport::confidence($context, 0.65);
        $trend = is_string($context['engagement_trend'] ?? null) ? $context['engagement_trend'] : 'declining';
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Boost Learning Engagement';
        $description = 'Schedule short daily learning check-ins to increase active study days.';

        return InsightDto::make(
            $this->id(),
            'learning_behaviour',
            'warning',
            'Low Engagement',
            'Learning activity across recent days is low relative to the observation window.',
            $description,
            24,
            LearningBehaviourRuleSupport::behaviourMetrics($context, [
                'low_engagement_threshold' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            [],
            ['Engagement score is below the low-engagement threshold.'],
            ['Low learning engagement detected.'],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    24,
                    'learning_behaviour',
                    'reengage',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'within_7_days'
                ),
            ]
        );
    }
}
