<?php

namespace App\Services\SmartInsight;

/**
 * Shared read-only helpers for F-037A Progress rules.
 */
class ProgressRuleSupport
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public static function progressMetrics(array $context, array $extra = []): array
    {
        $progress = (float) ($context['progress'] ?? $context['progress_percent'] ?? 0);
        $change = $context['progress_change'] ?? null;
        $trend = $context['progress_trend'] ?? null;

        $metrics = [
            'progress' => $progress,
            'progress_percent' => $progress,
            'progress_change' => $change,
            'completed_lessons' => (int) ($context['completed_lessons'] ?? 0),
            'total_lessons' => (int) ($context['total_lessons'] ?? 0),
            'completion_percentage' => (float) ($context['completion_percentage'] ?? 0),
            'lesson_completion' => $context['lesson_completion'] ?? [
                'completed_lessons' => (int) ($context['completed_lessons'] ?? 0),
                'total_lessons' => (int) ($context['total_lessons'] ?? 0),
                'completion_percentage' => (float) ($context['completion_percentage'] ?? 0),
            ],
            'has_progress_data' => (bool) ($context['has_progress_data'] ?? false),
        ];

        if ($trend !== null && $trend !== '') {
            $metrics['trend'] = $trend;
        }

        return array_merge($metrics, $extra);
    }

    /**
     * Confidence from evidence strength (snapshots + SSP + lesson totals). 0..1
     *
     * @param  array<string, mixed>  $context
     */
    public static function confidence(array $context, float $base = 0.55): float
    {
        $score = $base;
        if (! empty($context['has_progress_data'])) {
            $score += 0.15;
        }
        $snapCount = (int) ($context['progress_snapshot_count'] ?? 0);
        if ($snapCount >= 2) {
            $score += 0.15;
        } elseif ($snapCount === 1) {
            $score += 0.05;
        }
        if ((int) ($context['total_lessons'] ?? 0) > 0) {
            $score += 0.1;
        }
        if ((int) ($context['ssp_row_count'] ?? 0) > 0) {
            $score += 0.05;
        }

        return round(max(0.0, min(1.0, $score)), 2);
    }
}
