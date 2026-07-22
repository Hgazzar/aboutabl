<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\ProgressRuleSupport;

/**
 * F-037A — Medium Progress band: [low_threshold, high_threshold).
 */
class MediumProgressRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'medium_progress';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_progress_data'])) {
            return null;
        }

        $progress = (float) ($context['progress'] ?? $context['progress_percent'] ?? 0);
        $low = (float) ($context['config']['progress']['low_threshold'] ?? 40);
        $high = (float) ($context['config']['progress']['high_threshold'] ?? 70);

        if ($progress < $low || $progress >= $high) {
            return null;
        }

        $confidence = ProgressRuleSupport::confidence($context);
        $trend = $context['progress_trend'] ?? null;

        return InsightDto::make(
            $this->id(),
            'progress',
            'info',
            'Medium Progress',
            'Curriculum progress is in the middle band for this student.',
            'Keep a steady lesson cadence and close remaining unfinished units.',
            45,
            ProgressRuleSupport::progressMetrics($context, [
                'low_threshold' => $low,
                'high_threshold' => $high,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            is_string($trend) ? $trend : null
        );
    }
}
