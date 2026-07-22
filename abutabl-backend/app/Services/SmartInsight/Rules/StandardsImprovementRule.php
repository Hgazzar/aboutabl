<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\StandardsRuleSupport;

class StandardsImprovementRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'standards_improvement';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_standards_data'])) {
            return null;
        }

        $average = $context['standards_average'] ?? null;
        $masteredRatio = $context['standards_mastered_ratio'] ?? null;
        if ($average === null || $masteredRatio === null) {
            return null;
        }

        $average = (float) $average;
        $masteredRatio = (float) $masteredRatio;
        $avgThreshold = (float) ($context['config']['standards']['improve_average_threshold'] ?? 70);
        $ratioThreshold = (float) ($context['config']['standards']['improve_min_mastered_ratio'] ?? 0.5);
        $gapThreshold = (float) ($context['config']['standards']['gap_ratio_threshold'] ?? 0.4);
        $gap = (float) ($context['standards_gap'] ?? 1);

        // Improving profile: healthy average + mastered majority, without a large gap.
        if ($average < $avgThreshold || $masteredRatio < $ratioThreshold || $gap >= $gapThreshold) {
            return null;
        }

        $confidence = StandardsRuleSupport::confidence($context, 0.7);

        return InsightDto::make(
            $this->id(),
            'standards',
            'success',
            'Standards Improvement',
            'Standards mastery is solid, with a majority of standards at or above mastery.',
            'Keep reinforcing mastered standards and gradually close remaining gaps.',
            47,
            StandardsRuleSupport::standardsMetrics($context, [
                'improve_average_threshold' => $avgThreshold,
                'improve_min_mastered_ratio' => $ratioThreshold,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'improving',
            ['Majority of standards are mastered with a healthy average.'],
            [],
            []
        );
    }
}
