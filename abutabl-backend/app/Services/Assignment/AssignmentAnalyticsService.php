<?php

namespace App\Services\Assignment;

use App\Contracts\Assignment\AssignmentAnalyticsInterface;

/**
 * F-041C — Analytics stub. No Smart Insight writes; no duplicated metrics.
 */
class AssignmentAnalyticsService implements AssignmentAnalyticsInterface
{
    public function record(string $event, array $context = []): void
    {
        // Intentionally empty in foundation.
    }
}
