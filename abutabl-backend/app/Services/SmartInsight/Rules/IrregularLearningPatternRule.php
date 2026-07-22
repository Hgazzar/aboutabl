<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\LearningBehaviourRuleSupport;

class IrregularLearningPatternRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'irregular_learning_pattern';
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
        $max = (float) ($context['config']['learning_behaviour']['irregular_max_score'] ?? 0.35);

        if ($consistency > $max) {
            return null;
        }

        $confidence = LearningBehaviourRuleSupport::confidence($context, 0.65);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Stabilize Study Rhythm';
        $description = 'Set a fixed weekly study schedule to reduce irregular learning gaps.';

        return InsightDto::make(
            $this->id(),
            'learning_behaviour',
            'warning',
            'Irregular Learning Pattern',
            'Learning activity appears uneven across recent active days.',
            $description,
            27,
            LearningBehaviourRuleSupport::behaviourMetrics($context, [
                'irregular_max_score' => $max,
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            'stable',
            [],
            ['Learning consistency is below the irregular-pattern threshold.'],
            ['Irregular study cadence detected.'],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    27,
                    'learning_behaviour',
                    'stabilize_schedule',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_week'
                ),
            ]
        );
    }
}
