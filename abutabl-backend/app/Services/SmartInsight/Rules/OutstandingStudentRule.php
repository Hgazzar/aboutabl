<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;

class OutstandingStudentRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'outstanding_student';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_progress_data'])) {
            return null;
        }

        $progress = (float) ($context['progress_percent'] ?? 0);
        $performance = (float) ($context['performance_percent'] ?? 0);
        $minProgress = (float) ($context['config']['outstanding']['min_progress_percent'] ?? 85);
        $minPerformance = (float) ($context['config']['outstanding']['min_performance_percent'] ?? 85);

        if ($progress < $minProgress || $performance < $minPerformance) {
            return null;
        }

        return InsightDto::make(
            $this->id(),
            'achievement',
            'success',
            'Outstanding Student',
            'The student shows excellent progress and performance.',
            'Recognize achievement and offer enrichment challenges.',
            5,
            [
                'progress_percent' => $progress,
                'performance_percent' => $performance,
                'min_progress_percent' => $minProgress,
                'min_performance_percent' => $minPerformance,
            ],
            $context['generated_at'] ?? null
        );
    }
}
