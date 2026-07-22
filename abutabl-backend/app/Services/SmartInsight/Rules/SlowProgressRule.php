<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\ProgressRuleSupport;

/**
 * F-037A — Slow Progress: small positive progress_change across snapshots.
 */
class SlowProgressRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'slow_progress';
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
        $slow = (float) ($context['config']['progress']['slow_delta_percent'] ?? 3);

        // Positive but slow — exclude flat/negative (regression owns those).
        if ($change <= 0 || $change > $slow) {
            return null;
        }

        $confidence = ProgressRuleSupport::confidence($context, 0.6);

        return InsightDto::make(
            $this->id(),
            'progress',
            'warning',
            'Slow Progress',
            'Curriculum progress is increasing, but the pace is below the expected delta.',
            'Identify blocking lessons and schedule shorter, more frequent study sessions.',
            25,
            ProgressRuleSupport::progressMetrics($context, [
                'slow_delta_percent' => $slow,
                'progress_from' => $context['progress_from'] ?? null,
                'progress_to' => $context['progress_to'] ?? null,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'stable'
        );
    }
}
