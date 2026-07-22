<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AssessmentRuleSupport;
use App\Services\SmartInsight\InsightDto;

class HighQuizAccuracyRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'high_quiz_accuracy';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_assessment_data'])) {
            return null;
        }

        $accuracy = $context['quiz_accuracy'] ?? null;
        if ($accuracy === null) {
            return null;
        }

        $accuracy = (float) $accuracy;
        $threshold = (float) ($context['config']['assessment']['high_accuracy_threshold'] ?? 85);

        if ($accuracy < $threshold) {
            return null;
        }

        $confidence = AssessmentRuleSupport::confidence($context, 0.7);
        $trend = is_string($context['quiz_trend'] ?? null) ? $context['quiz_trend'] : null;

        return InsightDto::make(
            $this->id(),
            'assessment',
            'success',
            'High Quiz Accuracy',
            'The student shows high accuracy across recent quiz attempts.',
            'Keep challenging with slightly harder quizzes while reinforcing strong topics.',
            43,
            AssessmentRuleSupport::assessmentMetrics($context, [
                'high_accuracy_threshold' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            ['Quiz accuracy is at or above the high-accuracy band.'],
            [],
            []
        );
    }
}
