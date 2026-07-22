<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\PerformanceRuleSupport;

/**
 * Stronger decline signal than the existing PerformanceDecliningRule.
 * Uses a larger delta and longer snapshot window from InsightMetricsReader.
 */
class PerformanceDeclineRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'performance_decline';
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
        $strong = (float) ($context['config']['performance']['strong_decline_delta_percent'] ?? 10);
        $min = (int) ($context['config']['performance']['strong_decline_min_snapshots'] ?? 3);
        $count = (int) ($context['performance_snapshot_count'] ?? 0);

        // Strong decline: negative delta magnitude at/above threshold with enough history.
        if ($count < $min || $delta > (-1 * $strong)) {
            return null;
        }

        $confidence = PerformanceRuleSupport::confidence($context, 0.7);

        return InsightDto::make(
            $this->id(),
            'performance',
            'critical',
            'Performance Decline',
            'Performance shows a strong decline across a longer snapshot window.',
            'Schedule a check-in and prioritize remediation on recent weak assessments.',
            18,
            PerformanceRuleSupport::performanceMetrics($context, [
                'strong_decline_delta_percent' => $strong,
                'strong_decline_min_snapshots' => $min,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'declining',
            [],
            ['Strong downward performance delta detected.'],
            ['Strong performance decline over recent snapshots.']
        );
    }
}
