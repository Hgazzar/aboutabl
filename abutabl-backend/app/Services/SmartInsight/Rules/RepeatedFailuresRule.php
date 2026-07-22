<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AssessmentRuleSupport;
use App\Services\SmartInsight\InsightDto;

class RepeatedFailuresRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'repeated_failures';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_assessment_data'])) {
            return null;
        }

        $consecutive = (int) ($context['consecutive_failures'] ?? 0);
        $threshold = (int) ($context['config']['assessment']['repeated_failures_count'] ?? 3);

        if ($consecutive < $threshold) {
            return null;
        }

        $confidence = AssessmentRuleSupport::confidence($context, 0.7);
        $risk = $context['assessment_risk'] ?? null;

        return InsightDto::make(
            $this->id(),
            'assessment',
            'critical',
            'Repeated Failures',
            'The student has a streak of failed quiz attempts.',
            'Pause new quizzes, reteach core skills, then reassess with a shorter quiz.',
            14,
            AssessmentRuleSupport::assessmentMetrics($context, [
                'repeated_failures_count' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'declining',
            [],
            ['Consecutive failed quiz attempts detected.'],
            array_values(array_filter([
                'Repeated quiz failures.',
                $risk !== null ? 'Elevated assessment_risk: '.$risk : null,
            ]))
        );
    }
}
