<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\RiskRuleSupport;

class HighRiskRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'high_risk';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_risk_data'])) {
            return null;
        }

        $level = (string) ($context['risk_level'] ?? '');
        if ($level !== 'high') {
            return null;
        }

        $confidence = RiskRuleSupport::confidence($context, 0.7);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Escalate High-Risk Support';
        $description = 'Schedule a teacher intervention and prioritize weak lessons and quizzes.';

        return InsightDto::make(
            $this->id(),
            'risk',
            'warning',
            'High Risk',
            'Educational risk signals are elevated and require timely support.',
            $description,
            11,
            RiskRuleSupport::riskMetrics($context, ['confidence' => $confidence]),
            $context['generated_at'] ?? null,
            $confidence,
            'declining',
            [],
            ['Educational risk is in the high band.'],
            ['High educational risk detected.'],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    11,
                    'risk',
                    'escalate_support',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'within_3_days'
                ),
            ]
        );
    }
}
