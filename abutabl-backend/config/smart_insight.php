<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Smart Insight Engine (F-032 / F-037A / F-037B) — rule thresholds
    |--------------------------------------------------------------------------
    | All thresholds are configuration-driven. Do not hardcode in rules.
    */

    'progress' => [
        'low_threshold' => (float) env('SMART_INSIGHT_PROGRESS_LOW', 40),
        'high_threshold' => (float) env('SMART_INSIGHT_PROGRESS_HIGH', 70),
        /** No Progress: at or below this percent when SSP data exists. */
        'no_progress_max' => (float) env('SMART_INSIGHT_PROGRESS_NO_MAX', 0),
        /** Fast Progress: progress_change (pp) at or above this. */
        'fast_delta_percent' => (float) env('SMART_INSIGHT_PROGRESS_FAST_DELTA', 15),
        /** Slow Progress: positive progress_change at or below this. */
        'slow_delta_percent' => (float) env('SMART_INSIGHT_PROGRESS_SLOW_DELTA', 3),
        /** Progress Improvement: progress_change at or above this. */
        'improve_delta_percent' => (float) env('SMART_INSIGHT_PROGRESS_IMPROVE_DELTA', 5),
        /** Progress Regression: progress_change at or below -this. */
        'regress_delta_percent' => (float) env('SMART_INSIGHT_PROGRESS_REGRESS_DELTA', 5),
        /** Minimum snapshots with progress_average for pace/trend rules. */
        'trend_min_snapshots' => (int) env('SMART_INSIGHT_PROGRESS_TREND_MIN_SNAPSHOTS', 2),
    ],

    'performance' => [
        'improving_delta_percent' => (float) env('SMART_INSIGHT_PERF_IMPROVING_DELTA', 5),
        'declining_delta_percent' => (float) env('SMART_INSIGHT_PERF_DECLINING_DELTA', 5),
        'decline_min_snapshots' => (int) env('SMART_INSIGHT_PERF_DECLINE_MIN_SNAPSHOTS', 2),
        'improve_min_snapshots' => (int) env('SMART_INSIGHT_PERF_IMPROVE_MIN_SNAPSHOTS', 2),
        /** F-037B level bands */
        'excellent_threshold' => (float) env('SMART_INSIGHT_PERF_EXCELLENT', 85),
        'average_low_threshold' => (float) env('SMART_INSIGHT_PERF_AVERAGE_LOW', 50),
        'weak_threshold' => (float) env('SMART_INSIGHT_PERF_WEAK', 50),
        /** Rapid improvement / stronger decline */
        'rapid_improve_delta_percent' => (float) env('SMART_INSIGHT_PERF_RAPID_IMPROVE_DELTA', 15),
        'strong_decline_delta_percent' => (float) env('SMART_INSIGHT_PERF_STRONG_DECLINE_DELTA', 10),
        'strong_decline_min_snapshots' => (int) env('SMART_INSIGHT_PERF_STRONG_DECLINE_MIN_SNAPSHOTS', 3),
        /** Inconsistent: sample stddev of performance history */
        'inconsistent_stddev_threshold' => (float) env('SMART_INSIGHT_PERF_INCONSISTENT_STDDEV', 12),
        'inconsistent_min_snapshots' => (int) env('SMART_INSIGHT_PERF_INCONSISTENT_MIN_SNAPSHOTS', 3),
    ],

    'outstanding' => [
        'min_progress_percent' => (float) env('SMART_INSIGHT_OUTSTANDING_PROGRESS', 85),
        'min_performance_percent' => (float) env('SMART_INSIGHT_OUTSTANDING_PERFORMANCE', 85),
    ],

    'inactive' => [
        'days' => (int) env('SMART_INSIGHT_INACTIVE_DAYS', 14),
    ],

    'standards' => [
        /** Strong Standards: average percent at/above this. */
        'strong_average_threshold' => (float) env('SMART_INSIGHT_STD_STRONG_AVG', 80),
        /** Weak Standards: average percent below this. */
        'weak_average_threshold' => (float) env('SMART_INSIGHT_STD_WEAK_AVG', 50),
        /** A standard is mastered at/above this percent (matches ClassStandards good band). */
        'mastery_percent' => (float) env('SMART_INSIGHT_STD_MASTERY', 80),
        /** Standards Gap: weak/total ratio at/above this. */
        'gap_ratio_threshold' => (float) env('SMART_INSIGHT_STD_GAP_RATIO', 0.4),
        /** Standards Improvement: average at/above and mastered ratio at/above. */
        'improve_average_threshold' => (float) env('SMART_INSIGHT_STD_IMPROVE_AVG', 70),
        'improve_min_mastered_ratio' => (float) env('SMART_INSIGHT_STD_IMPROVE_MASTERED_RATIO', 0.5),
    ],

    'assessment' => [
        'high_accuracy_threshold' => (float) env('SMART_INSIGHT_ASSESS_HIGH_ACCURACY', 85),
        'low_accuracy_threshold' => (float) env('SMART_INSIGHT_ASSESS_LOW_ACCURACY', 50),
        'improve_delta_percent' => (float) env('SMART_INSIGHT_ASSESS_IMPROVE_DELTA', 10),
        'improve_min_attempts' => (int) env('SMART_INSIGHT_ASSESS_IMPROVE_MIN_ATTEMPTS', 2),
        'min_attempts' => (int) env('SMART_INSIGHT_ASSESS_MIN_ATTEMPTS', 2),
        'repeated_failures_count' => (int) env('SMART_INSIGHT_ASSESS_REPEATED_FAILURES', 3),
        'repeated_success_count' => (int) env('SMART_INSIGHT_ASSESS_REPEATED_SUCCESS', 3),
        'pass_percent_fallback' => (float) env('SMART_INSIGHT_ASSESS_PASS_PERCENT', 60),
    ],

    'learning_behaviour' => [
        'window_days' => (int) env('SMART_INSIGHT_BEHAVIOUR_WINDOW_DAYS', 30),
        'low_engagement_threshold' => (float) env('SMART_INSIGHT_BEHAVIOUR_LOW_ENGAGEMENT', 25),
        'excellent_engagement_threshold' => (float) env('SMART_INSIGHT_BEHAVIOUR_EXCELLENT_ENGAGEMENT', 70),
        'consistent_min_score' => (float) env('SMART_INSIGHT_BEHAVIOUR_CONSISTENT_MIN', 0.65),
        'irregular_max_score' => (float) env('SMART_INSIGHT_BEHAVIOUR_IRREGULAR_MAX', 0.35),
        'min_active_days_for_pattern' => (int) env('SMART_INSIGHT_BEHAVIOUR_MIN_ACTIVE_DAYS', 3),
        'return_gap_days' => (int) env('SMART_INSIGHT_BEHAVIOUR_RETURN_GAP_DAYS', 14),
        'return_recent_days' => (int) env('SMART_INSIGHT_BEHAVIOUR_RETURN_RECENT_DAYS', 7),
    ],

    'risk' => [
        'at_risk_min' => (float) env('SMART_INSIGHT_RISK_AT_RISK_MIN', 0.35),
        'high_risk_min' => (float) env('SMART_INSIGHT_RISK_HIGH_MIN', 0.55),
        'critical_risk_min' => (float) env('SMART_INSIGHT_RISK_CRITICAL_MIN', 0.75),
        'dropout_min_factors' => (int) env('SMART_INSIGHT_RISK_DROPOUT_MIN_FACTORS', 3),
        'intervention_min' => (float) env('SMART_INSIGHT_RISK_INTERVENTION_MIN', 0.7),
        'inactive_days_risk' => (int) env('SMART_INSIGHT_RISK_INACTIVE_DAYS', 14),
    ],

    'achievement' => [
        'high_min' => (float) env('SMART_INSIGHT_ACHIEVEMENT_HIGH_MIN', 0.45),
        'excellence_min' => (float) env('SMART_INSIGHT_ACHIEVEMENT_EXCELLENCE_MIN', 0.7),
        'mastery_ratio_min' => (float) env('SMART_INSIGHT_ACHIEVEMENT_MASTERY_RATIO_MIN', 0.7),
        'fast_velocity_min' => (float) env('SMART_INSIGHT_ACHIEVEMENT_FAST_VELOCITY_MIN', 0.7),
        'improvement_min' => (float) env('SMART_INSIGHT_ACHIEVEMENT_IMPROVEMENT_MIN', 0.55),
        'excellence_composite_min' => (float) env('SMART_INSIGHT_ACHIEVEMENT_EXCELLENCE_COMPOSITE_MIN', 0.65),
        'consistency_min' => (float) env('SMART_INSIGHT_ACHIEVEMENT_CONSISTENCY_MIN', 0.65),
        'lesson_completion_min' => (float) env('SMART_INSIGHT_ACHIEVEMENT_LESSON_COMPLETION_MIN', 70),
        'milestone_progress_marks' => [50, 75, 100],
    ],

    'engine' => [
        /** 0 = unlimited; category presentation limits are applied by InsightQualityCalibrator. */
        'max_insights' => (int) env('SMART_INSIGHT_MAX_INSIGHTS', 0),
        'max_visible_per_category' => (int) env('SMART_INSIGHT_MAX_VISIBLE_PER_CATEGORY', 5),
    ],

];
