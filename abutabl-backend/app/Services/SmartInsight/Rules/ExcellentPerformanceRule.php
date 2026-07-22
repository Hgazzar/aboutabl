<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\PerformanceRuleSupport;

class ExcellentPerformanceRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'excellent_performance';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_performance_data'])) {
            return null;
        }

        $performance = (float) ($context['performance'] ?? $context['performance_percent'] ?? 0);
        $threshold = (float) ($context['config']['performance']['excellent_threshold'] ?? 85);

        if ($performance < $threshold) {
            return null;
        }

        $confidence = PerformanceRuleSupport::confidence($context, 0.7);
        $trend = is_string($context['performance_trend'] ?? null)
            ? $context['performance_trend']
            : null;

        return InsightDto::make(
            $this->id(),
            'performance',
            'success',
            'Excellent Performance',
            'The student is performing at an excellent level across recent assessments.',
            'Recognize achievement and provide enrichment challenges.',
            42,
            PerformanceRuleSupport::performanceMetrics($context, [
                'excellent_threshold' => $threshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            ['Strong assessment performance at or above the excellent band.'],
            [],
            []
        );
    }
}
