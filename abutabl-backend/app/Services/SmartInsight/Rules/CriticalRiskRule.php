<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\RiskRuleSupport;

class CriticalRiskRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'critical_risk';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_risk_data'])) {
            return null;
        }

        $level = (string) ($context['risk_level'] ?? '');
        if ($level !== 'critical') {
            return null;
        }

        $confidence = RiskRuleSupport::confidence($context, 0.75);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Immediate Critical-Risk Action';
        $description = 'Contact the student/guardian and open an urgent learning recovery plan.';

        return InsightDto::make(
            $this->id(),
            'risk',
            'critical',
            'Critical Risk',
            'Educational risk is critical based on combined progress, engagement, and assessment signals.',
            $description,
            6,
            RiskRuleSupport::riskMetrics($context, ['confidence' => $confidence]),
            $context['generated_at'] ?? null,
            $confidence,
            'declining',
            [],
            ['Educational risk is in the critical band.'],
            ['Critical educational risk detected.'],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    6,
                    'risk',
                    'urgent_intervention',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'within_24_hours'
                ),
            ]
        );
    }
}
