<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\StandardsRuleSupport;

class StrongStandardsRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'strong_standards';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_standards_data'])) {
            return null;
        }

        $average = $context['standards_average'] ?? null;
        if ($average === null) {
            return null;
        }

        $average = (float) $average;
        $threshold = (float) ($context['config']['standards']['strong_average_threshold'] ?? 80);

        if ($average < $threshold) {
            return null;
        }

        $confidence = StandardsRuleSupport::confidence($context, 0.7);
        $trend = is_string($context['standards_trend'] ?? null)
            ? $context['standards_trend']
            : 'improving';

        return InsightDto::make(
            $this->id(),
            'standards',
            'success',
            'Strong Standards',
            'The student shows strong mastery across curriculum standards.',
            'Maintain coverage and extend practice on remaining non-mastered standards.',
            44,
            StandardsRuleSupport::standardsMetrics($context, [
                'strong_average_threshold' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            ['Standards average is at or above the strong band.'],
            [],
            []
        );
    }
}
