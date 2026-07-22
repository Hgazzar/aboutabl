<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\ProgressRuleSupport;

/**
 * F-037A — Fast Progress: large positive progress_change across snapshots.
 */
class FastProgressRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'fast_progress';
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
        $fast = (float) ($context['config']['progress']['fast_delta_percent'] ?? 15);

        if ($change < $fast) {
            return null;
        }

        $confidence = ProgressRuleSupport::confidence($context, 0.65);

        return InsightDto::make(
            $this->id(),
            'progress',
            'success',
            'Fast Progress',
            'Curriculum progress increased rapidly across recent snapshots.',
            'Acknowledge the pace and offer enrichment after current units.',
            55,
            ProgressRuleSupport::progressMetrics($context, [
                'fast_delta_percent' => $fast,
                'progress_from' => $context['progress_from'] ?? null,
                'progress_to' => $context['progress_to'] ?? null,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'improving'
        );
    }
}
