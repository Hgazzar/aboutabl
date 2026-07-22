<?php

namespace App\Contracts;

interface StudentInsightProviderInterface
{
    /**
     * Sole Smart Insight entry point. Implemented only by SmartInsightProvider.
     *
     * @param  array<string, mixed>  $context
     * @return array{
     *   available: bool,
     *   text: string|null,
     *   generated_at: string|null,
     *   insights: array<int, array<string, mixed>>,
     *   executive_summary?: array<string, mixed>|null,
     *   executive_score?: float|null,
     *   executive_level?: string|null,
     *   executive_confidence?: float|null,
     *   categories?: array<int, array<string, mixed>>,
     *   recommendations?: array<int, array<string, mixed>>,
     *   presentation_sections?: array<int, array<string, mixed>>
     * }
     */
    public function build(array $context): array;
}
