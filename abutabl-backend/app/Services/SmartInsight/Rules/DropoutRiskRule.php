<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\RiskRuleSupport;

class DropoutRiskRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'dropout_risk';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_risk_data'])) {
            return null;
        }

        if (empty($context['dropout_signal'])) {
            return null;
        }

        $confidence = RiskRuleSupport::confidence($context, 0.7);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Prevent Dropout Risk';
        $description = 'Re-engage with a short welcome-back plan and remove access blockers.';

        return InsightDto::make(
            $this->id(),
            'risk',
            'critical',
            'Dropout Risk',
            'Combined inactivity, low engagement, and weak learning progress suggest dropout risk.',
            $description,
            9,
            RiskRuleSupport::riskMetrics($context, ['confidence' => $confidence]),
            $context['generated_at'] ?? null,
            $confidence,
            'declining',
            [],
            ['Dropout-related risk patterns are present.'],
            ['Dropout risk pattern detected.'],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    9,
                    'risk',
                    'prevent_dropout',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'within_48_hours'
                ),
            ]
        );
    }
}
