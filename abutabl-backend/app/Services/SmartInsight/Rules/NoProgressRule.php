<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\ProgressRuleSupport;

/**
 * F-037A — No Progress: SSP exists but progress is at/below configured floor.
 */
class NoProgressRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'no_progress';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_progress_data'])) {
            return null;
        }

        $progress = (float) ($context['progress'] ?? $context['progress_percent'] ?? 0);
        $max = (float) ($context['config']['progress']['no_progress_max'] ?? 0);

        if ($progress > $max) {
            return null;
        }

        $confidence = ProgressRuleSupport::confidence($context, 0.6);
        $trend = $context['progress_trend'] ?? null;

        return InsightDto::make(
            $this->id(),
            'progress',
            'critical',
            'No Progress',
            'The student has progress records but curriculum coverage remains at zero.',
            'Start with the first unfinished trusted lesson and confirm access to content.',
            8,
            ProgressRuleSupport::progressMetrics($context, [
                'no_progress_max' => $max,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            is_string($trend) ? $trend : null
        );
    }
}
