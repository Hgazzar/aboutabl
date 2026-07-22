<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\LearningBehaviourRuleSupport;

class ReturningStudentRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'returning_student';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_learning_behaviour_data'])) {
            return null;
        }

        if (empty($context['return_after_inactivity'])) {
            return null;
        }

        $confidence = LearningBehaviourRuleSupport::confidence($context, 0.65);
        $trend = is_string($context['engagement_trend'] ?? null)
            ? $context['engagement_trend']
            : 'improving';
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Welcome Returning Learner';
        $description = 'Welcome the student back and assign one short catch-up lesson.';

        return InsightDto::make(
            $this->id(),
            'learning_behaviour',
            'info',
            'Returning Student',
            'The student resumed learning after a period of inactivity.',
            $description,
            29,
            LearningBehaviourRuleSupport::behaviourMetrics($context, [
                'confidence' => $confidence,
            ]),
            $context['generated_at'] ?? null,
            $confidence,
            $trend,
            ['Activity resumed after an inactivity gap.'],
            [],
            [],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    29,
                    'learning_behaviour',
                    'welcome_back',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'within_3_days'
                ),
            ]
        );
    }
}
