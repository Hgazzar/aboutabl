<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\PerformanceRuleSupport;

class AveragePerformanceRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'average_performance';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_performance_data'])) {
            return null;
        }

        $performance = (float) ($context['performance'] ?? $context['performance_percent'] ?? 0);
        $low = (float) ($context['config']['performance']['average_low_threshold'] ?? 50);
        $excellent = (float) ($context['config']['performance']['excellent_threshold'] ?? 85);

        if ($performance < $low || $performance >= $excellent) {
            return null;
        }

        $confidence = PerformanceRuleSupport::confidence($context, 0.6);
        $trend = is_string($context['performance_trend'] ?? null)
            ? $context['performance_trend']
            : null;

        return InsightDto::make(
            $this->id(),
            'performance',
            'info',
            'Average Performance',
            'The student is performing within the average band.',
            'Target weak topics with short practice sets to move toward the excellent band.',
            46,
            PerformanceRuleSupport::performanceMetrics($context, [
                'average_low_threshold' => $low,
                'excellent_threshold' => $excellent,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            [],
            ['Performance has not yet reached the excellent band.'],
            []
        );
    }
}
