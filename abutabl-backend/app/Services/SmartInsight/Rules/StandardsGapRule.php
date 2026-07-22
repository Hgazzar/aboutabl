<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\StandardsRuleSupport;

class StandardsGapRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'standards_gap';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_standards_data'])) {
            return null;
        }

        $gap = $context['standards_gap'] ?? null;
        if ($gap === null) {
            return null;
        }

        $gap = (float) $gap;
        $threshold = (float) ($context['config']['standards']['gap_ratio_threshold'] ?? 0.4);

        if ($gap < $threshold) {
            return null;
        }

        $confidence = StandardsRuleSupport::confidence($context, 0.65);
        $trend = is_string($context['standards_trend'] ?? null)
            ? $context['standards_trend']
            : 'declining';

        return InsightDto::make(
            $this->id(),
            'standards',
            'warning',
            'Standards Gap',
            'A significant share of standards remain below mastery.',
            'Prioritize the weakest standards list and close gaps with targeted assignments.',
            22,
            StandardsRuleSupport::standardsMetrics($context, [
                'gap_ratio_threshold' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            [],
            ['High proportion of non-mastered standards.'],
            ['Standards gap ratio exceeds threshold.']
        );
    }
}
