<?php

namespace App\Services;

use App\Models\Classes;
use App\Models\Student;

class ClassStudentsOverviewService
{
    private const SORT_FIELDS = ['performance', 'score', 'status', 'rank', 'name'];

    private const ORDERS = ['asc', 'desc'];

    /** @var TeacherDashboardService */
    private $dashboardService;

    /** @var StudentMetricsService */
    private $metrics;

    public function __construct(
        TeacherDashboardService $dashboardService,
        StudentMetricsService $metrics
    ) {
        $this->dashboardService = $dashboardService;
        $this->metrics = $metrics;
    }

    /**
     * @return array<string, mixed>
     */
    public function buildOverview(
        int $teacherId,
        array $schoolIds,
        int $classId,
        string $range = 'week',
        string $sort = 'rank',
        string $order = 'asc'
    ): array {
        $range = $this->metrics->normalizeRange($range);
        $sort = $this->normalizeSort($sort);
        $order = $this->normalizeOrder($order);
        $rangeStart = $this->metrics->resolveRangeStart($range);

        $scope = $this->dashboardService->resolveClassAccess($teacherId, $schoolIds, $classId);

        if ($scope === null) {
            throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
        }

        $classMeta = Classes::query()
            ->with('grade:id,name')
            ->find($classId, ['id', 'name', 'grade_id']);

        $classLabel = (string) ($classMeta->name ?? '');
        $gradeLabel = (string) ($classMeta->grade->name ?? '');

        $students = Student::query()
            ->activeInClasses(collect([$classId]))
            ->with(['Class:id,name', 'Grade:id,name'])
            ->get(['id', 'name', 'name_ar', 'photo', 'class_id', 'grade_id']);

        if ($students->isEmpty()) {
            return $this->emptyPayload($classId, $classLabel, $range, $sort, $order);
        }

        $subjectIds = $scope['subjects_by_class'][$classId] ?? [];

        $items = $this->metrics->buildRankedStudentRows(
            $students,
            $subjectIds,
            $teacherId,
            $rangeStart,
            $classLabel,
            $gradeLabel
        );

        $items = $this->sortItems($items, $sort, $order);

        return [
            'source'      => 'assigns_students_and_subject_progress',
            'range'       => $range,
            'class_id'    => $classId,
            'class_label' => $classLabel,
            'meta'        => [
                'total_students' => count($items),
                'sort'           => $sort,
                'order'          => $order,
            ],
            'items'       => $items,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function sortItems(array $items, string $sort, string $order): array
    {
        usort($items, function (array $a, array $b) use ($sort, $order) {
            $result = 0;

            switch ($sort) {
                case 'performance':
                    $result = ((float) $a['performance']['percent']) <=> ((float) $b['performance']['percent']);
                    break;
                case 'score':
                    $result = ((float) $a['score']['percent']) <=> ((float) $b['score']['percent']);
                    break;
                case 'status':
                    $result = $this->statusSortWeight((string) $a['status']) <=> $this->statusSortWeight((string) $b['status']);
                    break;
                case 'name':
                    $result = strcasecmp((string) $a['name'], (string) $b['name']);
                    break;
                case 'rank':
                default:
                    $result = ((int) $a['rank']) <=> ((int) $b['rank']);
                    break;
            }

            if ($result === 0) {
                $result = strcasecmp((string) $a['name'], (string) $b['name']);
            }

            return $order === 'desc' ? -$result : $result;
        });

        return array_values($items);
    }

    private function statusSortWeight(string $status): int
    {
        $weights = [
            'good'            => 4,
            'average'         => 3,
            'needs_attention' => 2,
            'no_data'         => 1,
        ];

        return $weights[$status] ?? 0;
    }

    private function normalizeSort(string $sort): string
    {
        return in_array($sort, self::SORT_FIELDS, true) ? $sort : 'rank';
    }

    private function normalizeOrder(string $order): string
    {
        return in_array($order, self::ORDERS, true) ? $order : 'asc';
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(
        int $classId,
        string $classLabel,
        string $range,
        string $sort,
        string $order
    ): array {
        return [
            'source'      => 'assigns_students_and_subject_progress',
            'range'       => $range,
            'class_id'    => $classId,
            'class_label' => $classLabel,
            'meta'        => [
                'total_students' => 0,
                'sort'           => $sort,
                'order'          => $order,
            ],
            'items'       => [],
        ];
    }
}
