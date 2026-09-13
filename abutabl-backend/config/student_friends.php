<?php

/**
 * Student Friends — Learning Streak Friends tab (opt-in classmate friendships).
 *
 * Friend streak is computed at read time via InsightMetricsReader — not stored.
 */
return [
    /** Maximum accepted friendships per student (MVP). */
    'max_accepted' => (int) env('STUDENT_FRIENDS_MAX_ACCEPTED', 50),
];
