<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\PerformanceRuleSupport;

class WeakPerformanceRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'weak_performance';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_performance_data'])) {
            return null;
        }

        $performance = (float) ($context['performance'] ?? $context['performance_percent'] ?? 0);
        $threshold = (float) ($context['config']['performance']['weak_threshold'] ?? 50);

        if ($performance >= $threshold) {
            return null;
        }

        $confidence = PerformanceRuleSupport::confidence($context, 0.65);
        $trend = is_string($context['performance_trend'] ?? null)
            ? $context['performance_trend']
            : null;
        $riskScore = $context['risk_score'] ?? null;

        return InsightDto::make(
            $this->id(),
            'performance',
            'warning',
            'Weak Performance',
            'Assessment performance is below the expected threshold for this student.',
            'Review recent low scores and assign focused remediation on missed skills.',
            15,
            PerformanceRuleSupport::performanceMetrics($context, [
                'weak_threshold' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            [],
            ['Performance is below the weak-performance threshold.'],
            array_values(array_filter([
                'Weak assessment performance detected.',
                $riskScore !== null ? 'Elevated performance risk_score: '.$riskScore : null,
            ]))
        );
    }
}
