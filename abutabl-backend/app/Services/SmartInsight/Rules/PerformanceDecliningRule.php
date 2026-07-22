<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;

class PerformanceDecliningRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'performance_declining';
    }

    public function evaluate(array $context): ?array
    {
        $snapshots = array_values($context['snapshots'] ?? []);
        $min = (int) ($context['config']['performance']['decline_min_snapshots'] ?? 2);
        $deltaThreshold = (float) ($context['config']['performance']['declining_delta_percent'] ?? 5);

        if (count($snapshots) < $min) {
            return null;
        }

        $window = array_slice($snapshots, -$min);
        $first = $this->performanceValue($window[0]);
        $last = $this->performanceValue($window[count($window) - 1]);

        if ($first === null || $last === null) {
            return null;
        }

        $delta = round($first - $last, 1);
        if ($delta < $deltaThreshold) {
            return null;
        }

        return InsightDto::make(
            $this->id(),
            'performance',
            'warning',
            'Performance Declining',
            'Recent performance snapshots show a sustained downward trend.',
            'Check recent assignments and schedule a short check-in with the student.',
            20,
            [
                'delta_percent' => $delta,
                'threshold' => $deltaThreshold,
                'from_percent' => $first,
                'to_percent' => $last,
                'snapshot_count' => count($window),
            ],
            $context['generated_at'] ?? null
        );
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function performanceValue(array $row): ?float
    {
        if (! array_key_exists('performance_percent', $row) || $row['performance_percent'] === null) {
            return null;
        }

        return round((float) $row['performance_percent'], 1);
    }
}
