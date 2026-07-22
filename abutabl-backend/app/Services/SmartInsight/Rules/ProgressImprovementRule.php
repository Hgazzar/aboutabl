<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\ProgressRuleSupport;

/**
 * F-037A — Progress Improvement: progress_change meets improve threshold.
 */
class ProgressImprovementRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'progress_improvement';
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
        $improve = (float) ($context['config']['progress']['improve_delta_percent'] ?? 5);

        if ($change < $improve) {
            return null;
        }

        $confidence = ProgressRuleSupport::confidence($context, 0.65);

        return InsightDto::make(
            $this->id(),
            'progress',
            'success',
            'Progress Improvement',
            'Recent snapshots show a clear upward trend in curriculum progress.',
            'Reinforce successful study habits and continue the current lesson plan.',
            48,
            ProgressRuleSupport::progressMetrics($context, [
                'improve_delta_percent' => $improve,
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
