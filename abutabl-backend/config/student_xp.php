<?php

/**
 * Student XP gamification — SSOT for navbar + My Progress (Figma kFrame-MyDashboard 1583:1262).
 *
 * Figma reference (myProgressFrame 1960:1471):
 * - Level 10 badge with 2450 / 3000 XP (3000 = 10 × xp_per_level).
 * - Track markers for Levels 9–12; Achiever at level 12.
 * - Weekly XP from earned events in the current calendar week.
 *
 * Level formula (Figma-aligned):
 *   level 1 when total_xp = 0
 *   level = min(max_level, floor(total_xp / xp_per_level) + 2) when total_xp > 0
 *
 * Progress within level:
 *   level_floor_xp = (level <= 1) ? 0 : (level - 2) * xp_per_level
 *   xp_in_level    = total_xp - level_floor_xp
 *   next_threshold = (level >= max_level) ? null : level * xp_per_level
 *   xp_to_next     = next_threshold - total_xp
 */
return [
    'max_level' => 12,

    'xp_per_level' => 300,

    /** Figma My Progress — Achiever badge at level 12 (1583:1262). */
    'achiever_level' => 12,

    /** Level markers shown on the progress track (Levels 9–12). */
    'progress_track_start_level' => 9,

    'event_points' => [
        'lesson_content' => 30,
    ],

    /**
     * Quiz XP = round(best authoritative result percent per quiz), min 1.
     * One ledger row per quiz (source_type quiz, source_id quiz_id).
     */
    'quiz_xp_from_percent' => true,

    /**
     * Badge label beside the level pill (Figma: "builder Badge" at level 10).
     */
    'level_badge_labels' => [
        9  => 'builder',
        10 => 'builder',
        11 => 'builder',
        12 => 'Achiever',
    ],
];
