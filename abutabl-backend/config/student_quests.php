<?php

/**
 * Student Quests — My Quests widget (Figma goalFrame 1767:1925 / 1900:1538).
 *
 * Platform gamification SSOT is XP (config/student_xp.php + StudentXpService).
 * There is no stars/rewards ledger — Figma "3 stars" is decorative copy only.
 */
return [
    /** Primary quest shown on dashboard main column (Figma 1767:1925 = single card). */
    'dashboard_quest_limit' => 2,

    /** Sidebar Your Quests — weekly XP goal (Figma flash row). */
    'weekly_xp_target' => 50,
];
