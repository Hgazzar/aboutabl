<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\StandardsRuleSupport;

class WeakStandardsRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'weak_standards';
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
        $threshold = (float) ($context['config']['standards']['weak_average_threshold'] ?? 50);

        if ($average >= $threshold) {
            return null;
        }

        $confidence = StandardsRuleSupport::confidence($context, 0.65);
        $trend = is_string($context['standards_trend'] ?? null)
            ? $context['standards_trend']
            : 'declining';
        $risk = $context['standards_risk_score'] ?? null;

        return InsightDto::make(
            $this->id(),
            'standards',
            'warning',
            'Weak Standards',
            'Overall standards mastery is below the expected threshold.',
            'Focus remediation on the weakest standards and reassess after short practice cycles.',
            16,
            StandardsRuleSupport::standardsMetrics($context, [
                'weak_average_threshold' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            [],
            ['Standards average is below the weak band.'],
            array_values(array_filter([
                'Weak standards mastery detected.',
                $risk !== null ? 'Elevated standards risk_score: '.$risk : null,
            ]))
        );
    }
}
