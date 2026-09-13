<?php

namespace App\Support\Assignment;

use Carbon\CarbonInterface;

/**
 * Student Assignment tab classification (product SSOT).
 *
 * Priority:
 * 1) completed — parent Assignment graded only (teacher finished + grade entered)
 * 2) past_due  — not graded, not submitted, AND due_at exists AND due_at < now
 * 3) todo      — active before deadline, OR submitted / waiting on teacher (until graded)
 *
 * Does NOT use: opened_at, fully_complete, activity counts, is_late, lifecycle.mode.
 * Submitted waiting stays in TO DO even after the deadline (not PAST DUE, not COMPLETE).
 */
class StudentAssignmentTabClassifier
{
    public const TAB_TODO = 'todo';

    public const TAB_PAST_DUE = 'past_due';

    public const TAB_COMPLETED = 'completed';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_GRADED = 'graded';

    /**
     * @param  self::STATUS_ACTIVE|self::STATUS_SUBMITTED|self::STATUS_GRADED|string  $parentStatus
     * @return self::TAB_TODO|self::TAB_PAST_DUE|self::TAB_COMPLETED
     */
    public static function classify(
        string $parentStatus,
        ?CarbonInterface $dueAt,
        ?CarbonInterface $now = null
    ): string {
        $status = strtolower(trim($parentStatus));
        if ($status === self::STATUS_GRADED) {
            return self::TAB_COMPLETED;
        }

        // Waiting on teacher stays in TO DO until graded (deadline does not move it).
        if ($status === self::STATUS_SUBMITTED) {
            return self::TAB_TODO;
        }

        $now = $now ?? now();

        if ($dueAt !== null && $dueAt->lt($now)) {
            return self::TAB_PAST_DUE;
        }

        return self::TAB_TODO;
    }

    /**
     * Backward-compatible wrapper used by older call sites/tests.
     *
     * @deprecated Prefer classify($parentStatus, $dueAt, $now)
     * @return self::TAB_TODO|self::TAB_PAST_DUE|self::TAB_COMPLETED
     */
    public static function classifyFromFlags(
        bool $isGraded,
        bool $isSubmitted,
        ?CarbonInterface $dueAt,
        ?CarbonInterface $now = null
    ): string {
        if ($isGraded) {
            return self::classify(self::STATUS_GRADED, $dueAt, $now);
        }
        if ($isSubmitted) {
            return self::classify(self::STATUS_SUBMITTED, $dueAt, $now);
        }

        return self::classify(self::STATUS_ACTIVE, $dueAt, $now);
    }
}
