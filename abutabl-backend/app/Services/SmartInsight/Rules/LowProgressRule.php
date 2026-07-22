<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;

class LowProgressRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'low_progress';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_progress_data'])) {
            return null;
        }

        $progress = (float) ($context['progress_percent'] ?? 0);
        $threshold = (float) ($context['config']['progress']['low_threshold'] ?? 40);

        if ($progress >= $threshold) {
            return null;
        }

        return InsightDto::make(
            $this->id(),
            'progress',
            'warning',
            'Low Progress',
            'Curriculum progress is below the expected threshold for this student.',
            'Review unfinished lessons and encourage completing remaining trusted content.',
            10,
            [
                'progress_percent' => $progress,
                'threshold' => $threshold,
                'has_progress_data' => true,
            ],
            $context['generated_at'] ?? null
        );
    }
}
