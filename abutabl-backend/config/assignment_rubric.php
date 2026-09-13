<?php

/**
 * Phase 4D — Generic rubric performance levels (criterion display scale).
 *
 * Distinct from config/assignment_grade.php overall assignment badges.
 * Labels/descriptors resolve via lang files (assignment_rubric.*), not here.
 */
return [
    'performance_levels' => [
        [
            'points' => 4,
            'key' => 'excellent',
        ],
        [
            'points' => 3,
            'key' => 'good',
        ],
        [
            'points' => 2,
            'key' => 'fair',
        ],
        [
            'points' => 1,
            'key' => 'poor',
        ],
    ],
];
