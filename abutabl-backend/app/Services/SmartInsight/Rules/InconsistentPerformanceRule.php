<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\PerformanceRuleSupport;

class InconsistentPerformanceRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'inconsistent_performance';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_performance_data'])) {
            return null;
        }

        $stddev = $context['performance_stddev'] ?? null;
        if ($stddev === null) {
            return null;
        }

        $stddev = (float) $stddev;
        $threshold = (float) ($context['config']['performance']['inconsistent_stddev_threshold'] ?? 12);
        $min = (int) ($context['config']['performance']['inconsistent_min_snapshots'] ?? 3);
        $count = (int) ($context['performance_snapshot_count'] ?? 0);

        if ($count < $min || $stddev < $threshold) {
            return null;
        }

        $confidence = PerformanceRuleSupport::confidence($context, 0.65);
        $trend = is_string($context['performance_trend'] ?? null)
            ? $context['performance_trend']
            : 'stable';

        return InsightDto::make(
            $this->id(),
            'performance',
            'warning',
            'Inconsistent Performance',
            'Performance results fluctuate significantly across recent snapshots.',
            'Stabilize study routines and review topics with the largest score swings.',
            28,
            PerformanceRuleSupport::performanceMetrics($context, [
                'inconsistent_stddev_threshold' => $threshold,
                'performance_stddev' => $stddev,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            [],
            ['High variance in performance history.'],
            ['Inconsistent assessment outcomes across snapshots.']
        );
    }
}
