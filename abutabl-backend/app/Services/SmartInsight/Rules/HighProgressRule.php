<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;

class HighProgressRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'high_progress';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_progress_data'])) {
            return null;
        }

        $progress = (float) ($context['progress_percent'] ?? 0);
        $high = (float) ($context['config']['progress']['high_threshold'] ?? 70);
        $outstandingMin = (float) ($context['config']['outstanding']['min_progress_percent'] ?? 85);

        // Outstanding owns the top band; High Progress is below outstanding floor.
        if ($progress < $high || $progress >= $outstandingMin) {
            return null;
        }

        return InsightDto::make(
            $this->id(),
            'progress',
            'success',
            'High Progress',
            'The student is progressing well through the curriculum.',
            'Maintain pace and reinforce completed lessons with light review.',
            50,
            [
                'progress_percent' => $progress,
                'threshold' => $high,
                'has_progress_data' => true,
            ],
            $context['generated_at'] ?? null
        );
    }
}
