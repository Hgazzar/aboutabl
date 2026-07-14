<?php

namespace App\Services\PerformanceAnalytics;

/**
 * Stable source labels for performance_facts.source.
 * New snapshot triggers add a constant + caller that goes through
 * PerformanceSnapshotTrigger / PerformanceSnapshotRecorder only.
 *
 * Never write performance_facts from the feature module itself.
 * After Metrics reflect the change → Recorder::snapshot* (see PerformanceAnalyticsRules).
 */
final class PerformanceSnapshotSource
{
    public const SCHEDULED_DAILY = 'scheduled_daily';

    public const ASSIGN_OPENED = 'assign_opened';

    public const ASSIGN_CREATED = 'assign_created';

    public const ASSIGN_DELETED = 'assign_deleted';

    public const PROGRESS_UPDATED = 'progress_updated';

    public const QUIZ_COMPLETED = 'quiz_completed';

    public const INTERACTIVE_ANSWER = 'interactive_answer';

    public const STANDARD_MASTERY = 'standard_mastery';

    public const MANUAL_BACKFILL = 'manual_backfill';

    /**
     * @return string[]
     */
    public static function all(): array
    {
        return [
            self::SCHEDULED_DAILY,
            self::ASSIGN_OPENED,
            self::ASSIGN_CREATED,
            self::ASSIGN_DELETED,
            self::PROGRESS_UPDATED,
            self::QUIZ_COMPLETED,
            self::INTERACTIVE_ANSWER,
            self::STANDARD_MASTERY,
            self::MANUAL_BACKFILL,
        ];
    }
}
