<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\LearningBehaviourRuleSupport;

class ConsistentLearningPatternRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'consistent_learning_pattern';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_learning_behaviour_data'])) {
            return null;
        }

        $consistency = $context['learning_consistency'] ?? null;
        if ($consistency === null) {
            return null;
        }

        $minActive = (int) ($context['config']['learning_behaviour']['min_active_days_for_pattern'] ?? 3);
        if ((int) ($context['active_days'] ?? 0) < $minActive) {
            return null;
        }

        $consistency = (float) $consistency;
        $min = (float) ($context['config']['learning_behaviour']['consistent_min_score'] ?? 0.65);

        if ($consistency < $min) {
            return null;
        }

        $confidence = LearningBehaviourRuleSupport::confidence($context, 0.7);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Maintain Consistent Habits';
        $description = 'Reinforce the current study rhythm with light weekly goals.';

        return InsightDto::make(
            $this->id(),
            'learning_behaviour',
            'success',
            'Consistent Learning Pattern',
            'Learning activity shows a steady, consistent pattern over recent days.',
            $description,
            51,
            LearningBehaviourRuleSupport::behaviourMetrics($context, [
                'consistent_min_score' => $min,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'stable',
            ['Learning consistency is at or above the consistent-pattern threshold.'],
            [],
            [],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    51,
                    'learning_behaviour',
                    'maintain_habit',
                    'student',
                    $studentId > 0 ? $studentId : null
                ),
            ]
        );
    }
}
