<?php

namespace App\Services\SmartInsight\Rules;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightDto;
use Carbon\Carbon;

class InactiveStudentRule implements InsightRuleInterface
{
    public function id(): string
    {
        return 'inactive_student';
    }

    public function evaluate(array $context): ?array
    {
        $inactiveDays = (int) ($context['config']['inactive']['days'] ?? 14);
        $now = isset($context['now']) && $context['now'] instanceof Carbon
            ? $context['now']
            : now();

        $lastActivityAt = $context['last_activity_at'] ?? null;
        if ($lastActivityAt !== null && ! $lastActivityAt instanceof Carbon) {
            try {
                $lastActivityAt = Carbon::parse($lastActivityAt);
            } catch (\Throwable $e) {
                $lastActivityAt = null;
            }
        }

        if ($lastActivityAt instanceof Carbon) {
            $daysSince = $lastActivityAt->diffInDays($now);
            if ($daysSince < $inactiveDays) {
                return null;
            }
        } else {
            // No recorded learning activity — treat as inactive.
            $daysSince = null;
        }

        return InsightDto::make(
            $this->id(),
            'learning_behaviour',
            'critical',
            'Inactive Student',
            'No recent learning activity was detected for this student.',
            'Reach out to re-engage the student and confirm access to lessons.',
            30,
            [
                'inactive_days_threshold' => $inactiveDays,
                'days_since_activity' => $daysSince,
                'last_activity_at' => $lastActivityAt instanceof Carbon
                    ? $lastActivityAt->toIso8601String()
                    : null,
            ],
            $context['generated_at'] ?? null
        );
    }
}
