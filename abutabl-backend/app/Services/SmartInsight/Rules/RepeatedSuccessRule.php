<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AssessmentRuleSupport;
use App\Services\SmartInsight\InsightDto;

class RepeatedSuccessRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'repeated_success';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_assessment_data'])) {
            return null;
        }

        $consecutive = (int) ($context['consecutive_successes'] ?? 0);
        $threshold = (int) ($context['config']['assessment']['repeated_success_count'] ?? 3);

        if ($consecutive < $threshold) {
            return null;
        }

        $confidence = AssessmentRuleSupport::confidence($context, 0.7);
        $trend = is_string($context['quiz_trend'] ?? null) ? $context['quiz_trend'] : 'improving';

        return InsightDto::make(
            $this->id(),
            'assessment',
            'success',
            'Repeated Success',
            'The student has a streak of successful quiz attempts.',
            'Celebrate consistency and introduce enrichment or mixed-review quizzes.',
            49,
            AssessmentRuleSupport::assessmentMetrics($context, [
                'repeated_success_count' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            ['Consecutive successful quiz attempts detected.'],
            [],
            []
        );
    }
}
