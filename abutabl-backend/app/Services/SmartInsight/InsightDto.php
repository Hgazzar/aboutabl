<?php

namespace App\Services\SmartInsight;

/**
 * Structured Smart Insight payload (no HTML / Markdown).
 */
class InsightDto
{
    /**
     * @param  array<string, mixed>  $supportingMetrics
     * @param  string[]  $positiveFindings
     * @param  string[]  $weaknesses
     * @param  string[]  $riskIndicators
     * @param  array<int, array<string, mixed>>  $recommendations
     * @return array<string, mixed>
     */
    public static function make(
        string $id,
        string $category,
        string $severity,
        string $title,
        string $description,
        string $recommendation,
        int $priority,
        array $supportingMetrics = [],
        ?string $generatedAt = null,
        ?float $confidence = null,
        ?string $trend = null,
        array $positiveFindings = [],
        array $weaknesses = [],
        array $riskIndicators = [],
        array $recommendations = []
    ): array {
        $payload = [
            'id' => $id,
            'category' => $category,
            'severity' => $severity,
            'title' => $title,
            'description' => $description,
            'recommendation' => $recommendation,
            'priority' => $priority,
            'generated_at' => $generatedAt ?? now()->toIso8601String(),
            'supporting_metrics' => $supportingMetrics,
        ];

        if ($confidence !== null) {
            $payload['confidence'] = round(max(0.0, min(1.0, $confidence)), 2);
        }

        if ($trend !== null && $trend !== '') {
            $payload['trend'] = $trend;
        }

        if ($positiveFindings !== []) {
            $payload['positive_findings'] = array_values($positiveFindings);
        }

        if ($weaknesses !== []) {
            $payload['weaknesses'] = array_values($weaknesses);
        }

        if ($riskIndicators !== []) {
            $payload['risk_indicators'] = array_values($riskIndicators);
        }

        if ($recommendations !== []) {
            $payload['recommendations'] = array_values($recommendations);
        }

        return $payload;
    }

    /**
     * Backend-only recommendation object (F-037E).
     *
     * @return array<string, mixed>
     */
    public static function recommendation(
        string $title,
        string $description,
        int $priority,
        string $category,
        string $actionType,
        string $targetType,
        $targetId = null,
        ?string $dueHint = null
    ): array {
        $row = [
            'title' => $title,
            'description' => $description,
            'priority' => $priority,
            'category' => $category,
            'action_type' => $actionType,
            'target_type' => $targetType,
            'target_id' => $targetId,
        ];

        if ($dueHint !== null && $dueHint !== '') {
            $row['due_hint'] = $dueHint;
        }

        return $row;
    }
}
