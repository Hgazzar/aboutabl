<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\RiskRuleSupport;

class InterventionRequiredRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'intervention_required';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_risk_data'])) {
            return null;
        }

        if (empty($context['intervention_signal'])) {
            return null;
        }

        $confidence = RiskRuleSupport::confidence($context, 0.7);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Teacher Intervention Required';
        $description = 'Assign a targeted recovery path covering weak lessons, quizzes, and engagement.';

        return InsightDto::make(
            $this->id(),
            'risk',
            'critical',
            'Intervention Required',
            'Risk signals are strong enough to require an active teacher intervention.',
            $description,
            7,
            RiskRuleSupport::riskMetrics($context, ['confidence' => $confidence]),
            $context['generated_at'] ?? null,
            $confidence,
            'declining',
            [],
            ['Intervention threshold reached.'],
            ['Teacher intervention required.'],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    7,
                    'risk',
                    'require_intervention',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'within_48_hours'
                ),
            ]
        );
    }
}
