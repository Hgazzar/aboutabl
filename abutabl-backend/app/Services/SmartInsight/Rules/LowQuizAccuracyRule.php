<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AssessmentRuleSupport;
use App\Services\SmartInsight\InsightDto;

class LowQuizAccuracyRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'low_quiz_accuracy';
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
        $threshold = (float) ($context['config']['assessment']['low_accuracy_threshold'] ?? 50);

        if ($accuracy >= $threshold) {
            return null;
        }

        $confidence = AssessmentRuleSupport::confidence($context, 0.65);
        $trend = is_string($context['quiz_trend'] ?? null) ? $context['quiz_trend'] : null;
        $risk = $context['assessment_risk'] ?? null;

        return InsightDto::make(
            $this->id(),
            'assessment',
            'warning',
            'Low Quiz Accuracy',
            'Quiz accuracy is below the expected threshold for this student.',
            'Review missed questions and assign short remediation quizzes on weak skills.',
            17,
            AssessmentRuleSupport::assessmentMetrics($context, [
                'low_accuracy_threshold' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            [],
            ['Quiz accuracy is below the low-accuracy band.'],
            array_values(array_filter([
                'Low quiz accuracy detected.',
                $risk !== null ? 'Elevated assessment_risk: '.$risk : null,
            ]))
        );
    }
}
