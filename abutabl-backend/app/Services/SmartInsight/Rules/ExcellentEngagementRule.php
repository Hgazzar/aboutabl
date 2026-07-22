<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\LearningBehaviourRuleSupport;

class ExcellentEngagementRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'excellent_engagement';
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
        $threshold = (float) ($context['config']['learning_behaviour']['excellent_engagement_threshold'] ?? 70);

        if ($score < $threshold) {
            return null;
        }

        $confidence = LearningBehaviourRuleSupport::confidence($context, 0.7);
        $trend = is_string($context['engagement_trend'] ?? null) ? $context['engagement_trend'] : 'improving';
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Recognize Strong Engagement';
        $description = 'Acknowledge consistent study habits and offer enrichment challenges.';

        return InsightDto::make(
            $this->id(),
            'learning_behaviour',
            'success',
            'Excellent Engagement',
            'The student shows strong learning activity across the observation window.',
            $description,
            52,
            LearningBehaviourRuleSupport::behaviourMetrics($context, [
                'excellent_engagement_threshold' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            ['Engagement score is at or above the excellent band.'],
            [],
            [],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    52,
                    'learning_behaviour',
                    'encourage',
                    'student',
                    $studentId > 0 ? $studentId : null
                ),
            ]
        );
    }
}
