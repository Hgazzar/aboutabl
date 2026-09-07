<?php

/**
 * Phase 3C — Assignment performance badge bands (not StudentAchievements).
 */
return [
    'badges' => [
        'excellent' => [
            'min' => 90.0,
            'label' => 'Excellent',
        ],
        'good' => [
            'min' => 75.0,
            'label' => 'Good',
        ],
        'fair' => [
            'min' => 50.0,
            'label' => 'Fair',
        ],
        'needs_improvement' => [
            'min' => 0.0,
            'label' => 'Needs Improvement',
        ],
    ],

    /**
     * XP ledger source for Assignment finalize awards.
     * source_id = assigns_students.id
     */
    'xp_source_type' => 'assignment',
];
