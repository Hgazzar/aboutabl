<?php

namespace App\Contracts\Assignment;

/**
 * F-041C — Stub for future Assignment analytics / Insight hooks.
 * Foundation: no-op (Smart Insight remains read-only).
 */
interface AssignmentAnalyticsInterface
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function record(string $event, array $context = []): void;
}
