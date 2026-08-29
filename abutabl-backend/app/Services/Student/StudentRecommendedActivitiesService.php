<?php

namespace App\Services\Student;

/**
 * Widget 6 — Recommended Activities (Figma gridFrame 1767:1881).
 */
class StudentRecommendedActivitiesService
{
    /** @var StudentContinueLearningService */
    private $continueLearning;

    /** @var StudentXpService */
    private $xp;

    public function __construct(
        StudentContinueLearningService $continueLearning,
        StudentXpService $xp
    ) {
        $this->continueLearning = $continueLearning;
        $this->xp = $xp;
    }

    /**
     * @param  int[]  $subjectIds
     * @param  array<int, array<string, mixed>>  $todoItems
     * @return array{items: array<int, array<string, mixed>>}
     */
    public function buildDashboardPayload(int $studentId, array $subjectIds, array $todoItems): array
    {
        $items = [];

        $pendingCount = count($todoItems);
        $items[] = [
            'kind'      => 'pending_assignments',
            'available' => true,
            'count'     => $pendingCount,
            'cta_path'  => '/todo',
            'visual'    => 'bird_assignments',
            'theme'     => 'mint',
        ];

        $lessonXp = $this->xp->pointsForEventType('lesson_content');

        foreach ($this->continueLearning->buildForSubjects($studentId, $subjectIds, 2) as $continue) {
            $items[] = [
                'kind'              => 'continue_learning',
                'available'         => true,
                'subject_id'        => (int) ($continue['subject_id'] ?? 0),
                'subject_name'      => (string) ($continue['subject_name'] ?? ''),
                'content_label'     => (string) ($continue['title'] ?? ''),
                'reward_xp'         => $lessonXp,
                'reward_xp_kind'    => $lessonXp !== null ? 'potential' : null,
                'reward_xp_source'  => $lessonXp !== null ? 'lesson_content' : null,
                'cta_path'          => $continue['path'] ?? null,
                'visual'            => 'bird_books',
                'theme'             => 'cream',
            ];
        }

        $items[] = [
            'kind'      => 'game',
            'available' => true,
            'cta_path'  => '/games',
            'visual'    => 'bird_gaming',
            'theme'     => 'lavender',
        ];

        return ['items' => $items];
    }

    /**
     * @param  int[]  $subjectIds
     * @param  array<int, array<string, mixed>>  $todoItems
     * @return array<int, array<string, mixed>>
     *
     * @deprecated Use buildDashboardPayload() for Widget 6.
     */
    public function build(int $studentId, array $subjectIds, array $todoItems, int $limit = 5): array
    {
        unset($studentId, $subjectIds, $todoItems, $limit);

        return [];
    }
}
