<?php

namespace App\Services\PerformanceAnalytics;

/**
 * Binding contracts for the Performance Analytics Platform.
 *
 * ---------------------------------------------------------------------------
 * 1) SINGLE FORMULA (StudentMetricsService)
 * ---------------------------------------------------------------------------
 * StudentMetricsService is the ONLY place allowed to compute:
 *   - score (completion %)
 *   - performance (progress avg OR score − overdue penalty)
 *   - rank
 *
 * Services in this package MUST NOT re-implement those formulas.
 * They may:
 *   - call StudentMetricsService when capturing a snapshot (Recorder), or
 *   - aggregate / compare / trend values already stored on performance_facts.
 *
 * ---------------------------------------------------------------------------
 * 2) SINGLE WRITER (PerformanceSnapshotRecorder)
 * ---------------------------------------------------------------------------
 * PerformanceSnapshotRecorder is the ONLY writer to performance_facts.
 * Never call PerformanceFact::create / update / upsert from feature code.
 *
 * Future sources that affect student performance (Quiz Attempts, Exams, SCORM
 * completion mapped into metrics, AI Assessment scores, etc.) MUST:
 *   Step A — update the live metric inputs / ensure StudentMetricsService
 *            reflects the new state (extend Metrics loaders/formulas if needed);
 *   Step B — immediately call PerformanceSnapshotRecorder (via
 *            PerformanceSnapshotTrigger or snapshotClassStudents / snapshotStudent)
 *            so History stays complete.
 *
 * Do NOT invent a second path that writes performance_facts directly.
 *
 * ---------------------------------------------------------------------------
 * 3) TEMPORARY FALLBACK (PerformanceFallback)
 * ---------------------------------------------------------------------------
 * PerformanceFallback is TEMPORARY for empty History only.
 * It is NOT a permanent Analytics SSOT.
 * Once performance_facts have accumulated enough days, stop relying on it.
 * New charts, Reports, or AI MUST NOT use PerformanceFallback when History exists.
 *
 * @see \App\Services\StudentMetricsService
 * @see \App\Services\PerformanceAnalytics\PerformanceSnapshotRecorder
 * @see \App\Services\PerformanceAnalytics\PerformanceFallback
 */
final class PerformanceAnalyticsRules
{
    private function __construct()
    {
    }
}
