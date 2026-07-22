<?php

namespace App\Contracts;

/**
 * Isolated Smart Insight rule. Returns at most one insight DTO array, or null.
 */
interface InsightRuleInterface
{
    public function id(): string;

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>|null
     */
    public function evaluate(array $context): ?array;
}
