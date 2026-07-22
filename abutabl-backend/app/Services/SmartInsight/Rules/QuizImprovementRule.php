<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\AssessmentRuleSupport;
use App\Services\SmartInsight\InsightDto;

class QuizImprovementRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'quiz_improvement';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_assessment_data'])) {
            return null;
        }

        $improvement = $context['quiz_improvement'] ?? null;
        if ($improvement === null) {
            return null;
        }

        $improvement = (float) $improvement;
        $delta = (float) ($context['config']['assessment']['improve_delta_percent'] ?? 10);

        if ($improvement < $delta) {
            return null;
        }

        $confidence = AssessmentRuleSupport::confidence($context, 0.7);

        return InsightDto::make(
            $this->id(),
            'assessment',
            'success',
            'Quiz Improvement',
            'Recent quiz scores show a clear improvement over earlier attempts.',
            'Acknowledge the improvement and continue spaced practice on the same skills.',
            41,
            AssessmentRuleSupport::assessmentMetrics($context, [
                'improve_delta_percent' => $delta,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'improving',
            ['Positive quiz score delta across assessment history.'],
            [],
            []
        );
    }
}
