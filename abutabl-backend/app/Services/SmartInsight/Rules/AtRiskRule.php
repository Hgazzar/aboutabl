<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use App\Services\SmartInsight\RiskRuleSupport;

class AtRiskRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'at_risk';
    }

    public function evaluate(array $context): ?array
    {
        if (empty($context['has_risk_data'])) {
            return null;
        }

        $level = (string) ($context['risk_level'] ?? '');
        if ($level !== 'at_risk') {
            return null;
        }

        $confidence = RiskRuleSupport::confidence($context, 0.65);
        $studentId = (int) ($context['student_id'] ?? 0);
        $title = 'Monitor At-Risk Student';
        $description = 'Increase check-ins and review unfinished lessons this week.';

        return InsightDto::make(
            $this->id(),
            'risk',
            'warning',
            'At Risk',
            'Multiple educational signals indicate the student is at risk.',
            $description,
            19,
            RiskRuleSupport::riskMetrics($context, ['confidence' => $confidence]),
            $context['generated_at'] ?? null,
            $confidence,
            'declining',
            [],
            ['Educational risk is in the at-risk band.'],
            ['At-risk educational pattern detected.'],
            [
                InsightDto::recommendation(
                    $title,
                    $description,
                    19,
                    'risk',
                    'monitor',
                    'student',
                    $studentId > 0 ? $studentId : null,
                    'this_week'
                ),
            ]
        );
    }
}
