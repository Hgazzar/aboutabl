<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\ProgressRuleSupport;

/**
 * F-037A — Progress Regression: progress_change meets regress threshold (negative).
 */
class ProgressRegressionRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'progress_regression';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_progress_data'])) {
            return null;
        }

        $change = $context['progress_change'] ?? null;
        if ($change === null) {
            return null;
        }

        $change = (float) $change;
        $regress = (float) ($context['config']['progress']['regress_delta_percent'] ?? 5);

        if ($change > (-1 * $regress)) {
            return null;
        }

        $confidence = ProgressRuleSupport::confidence($context, 0.65);

        return InsightDto::make(
            $this->id(),
            'progress',
            'warning',
            'Progress Regression',
            'Recent snapshots show a decline in curriculum progress coverage.',
            'Review recently incomplete lessons and re-engage the student on unfinished units.',
            12,
            ProgressRuleSupport::progressMetrics($context, [
                'regress_delta_percent' => $regress,
                'progress_from' => $context['progress_from'] ?? null,
                'progress_to' => $context['progress_to'] ?? null,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'declining'
        );
    }
}
