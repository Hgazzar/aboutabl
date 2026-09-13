<?php

/**
 * Student Achievements & Milestones — V1 Profile UI catalog (Figma SSOT).
 *
 * State is computed read-only at request time by StudentAchievementService.
 * No student_achievements table. No persistence. No XP/quest writes.
 *
 * Rule decisions (documented — do not guess):
 * - 3_stars_badge: Figma copy references first 100 XP; no separate "3 stars" rule
 *   exists in gamification config → total_xp threshold 100 from student_xp_events/balance.
 * - builder_badge: authoritative "Builder" semantic is level 9+ via
 *   config('student_xp.progress_track_start_level') and level_badge_labels → level rule.
 *   Figma V1 description text is retained as product copy for both rows.
 *
 * Icon keys are logical identifiers for the student SPA (not file paths).
 */
return [
    'catalog' => [
        [
            'key'         => '3_stars_badge',
            'title'       => '3 Stars Badge',
            'description' => 'You earned your first 100 XP',
            'icon'        => 'achievement-3-stars',
            'rule_type'   => 'total_xp',
            'threshold'   => 100,
        ],
        [
            'key'            => 'builder_badge',
            'title'          => 'Builder Badge',
            'description'    => 'Reach Builder level.',
            'icon'           => 'achievement-builder',
            'rule_type'      => 'level',
            'threshold_from' => 'student_xp.progress_track_start_level',
        ],
    ],
];
