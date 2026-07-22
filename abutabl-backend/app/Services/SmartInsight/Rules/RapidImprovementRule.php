<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\PerformanceRuleSupport;

class RapidImprovementRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'rapid_improvement';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_performance_data'])) {
            return null;
        }

        $delta = $context['performance_delta'] ?? null;
        if ($delta === null) {
            return null;
        }

        $delta = (float) $delta;
        $rapid = (float) ($context['config']['performance']['rapid_improve_delta_percent'] ?? 15);
        $min = (int) ($context['config']['performance']['improve_min_snapshots'] ?? 2);
        $count = (int) ($context['performance_snapshot_count'] ?? 0);

        if ($count < $min || $delta < $rapid) {
            return null;
        }

        $confidence = PerformanceRuleSupport::confidence($context, 0.7);

        return InsightDto::make(
            $this->id(),
            'performance',
            'success',
            'Rapid Improvement',
            'Performance increased rapidly across recent snapshots.',
            'Acknowledge the improvement and lock in habits with consistent practice.',
            35,
            PerformanceRuleSupport::performanceMetrics($context, [
                'rapid_improve_delta_percent' => $rapid,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'improving',
            ['Rapid positive performance delta across snapshot history.'],
            [],
            []
        );
    }
}
