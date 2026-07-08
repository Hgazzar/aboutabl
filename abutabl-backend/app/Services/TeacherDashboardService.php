<?php

namespace App\Services;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Classes;
use App\Models\Student;
use App\Models\StudentSubjectProgress;
use App\Models\TeachersGrades;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TeacherDashboardService
{
    private const NEED_ATTENTION_THRESHOLD = 70;

    /**
     * Build the Phase 1 teacher overview payload from real DB aggregates.
     *
     * @param  int    $teacherId
     * @param  int[]  $schoolIds
     * @return array<string, mixed>
     */
    public function buildOverview(int $teacherId, array $schoolIds): array
    {
        $scope = $this->hydrateTeacherScope($teacherId, $schoolIds);

        if ($scope === null) {
            return $this->emptyOverview();
        }

        $classesMeta = $this->loadClassesMeta($scope['class_ids']);

        $classes = $this->buildClassCards(
            $classesMeta,
            $scope['students'],
            $scope['subjects_by_class'],
            $scope['progress_by_student'],
            $scope['overdue_by_student'],
            $scope['need_attention_ids'],
            $scope['assign_rows']
        );

        return [
            'stats'   => $this->buildStats($scope),
            'summary' => [
                'students_pending_submissions' => $this->countStudentsWithPendingSubmissions($scope['assign_rows']),
            ],
            'classes' => $classes,
            'charts'  => $this->buildCharts($classes, $scope['assign_rows'], $scope['students']),
            'alerts'  => $this->buildAlerts(
                $scope['students'],
                $classesMeta,
                $scope['subjects_by_class'],
                $scope['progress_by_student'],
                $scope['overdue_by_student'],
                $scope['need_attention_ids']
            ),
        ];
    }

    /**
     * Analytics section — classes comparison bar chart + completion donut.
     *
     * @param  int[]  $schoolIds
     * @return array<string, mixed>
     */
    public function buildTeacherAnalytics(int $teacherId, array $schoolIds): array
    {
        $scope = $this->hydrateTeacherScope($teacherId, $schoolIds);

        if ($scope === null) {
            return $this->emptyTeacherAnalytics();
        }

        $classesMeta = $this->loadClassesMeta($scope['class_ids']);

        $classCards = $this->buildClassCards(
            $classesMeta,
            $scope['students'],
            $scope['subjects_by_class'],
            $scope['progress_by_student'],
            $scope['overdue_by_student'],
            $scope['need_attention_ids'],
            $scope['assign_rows']
        );

        $charts = $this->buildCharts($classCards, $scope['assign_rows'], $scope['students']);

        $classesComparison = array_map(function (array $row) {
            return [
                'class_id'            => $row['class_id'],
                'name'                => $row['name'],
                'performance_percent' => $row['performance_percent'],
                'attendance_percent'  => null,
                'completion_percent'  => $row['completion_percent'],
            ];
        }, $charts['classes_comparison']);

        return [
            'attendance_available' => false,
            'classes_comparison'   => $classesComparison,
            'completion_status'    => $charts['completion_status'],
        ];
    }

    /**
     * Alerts section — overdue assignments and low academic performance.
     *
     * @param  int[]  $schoolIds
     * @return array<string, mixed>
     */
    public function buildTeacherAlerts(int $teacherId, array $schoolIds): array
    {
        $scope = $this->hydrateTeacherScope($teacherId, $schoolIds);

        if ($scope === null) {
            return [
                'meta'   => ['total' => 0],
                'alerts' => [],
            ];
        }

        $classesMeta = $this->loadClassesMeta($scope['class_ids']);
        $overdueCategoryByStudent = $this->loadOverdueCategoryByStudent($scope);

        $rawAlerts = $this->buildAlerts(
            $scope['students'],
            $classesMeta,
            $scope['subjects_by_class'],
            $scope['progress_by_student'],
            $scope['overdue_by_student'],
            $scope['need_attention_ids']
        );

        $alerts = array_map(function (array $row) use ($overdueCategoryByStudent) {
            $alertType = $row['alert_type'];
            $studentId = (int) $row['student_id'];
            $overdueCount = (int) ($row['overdue_count'] ?? 0);

            $category = $alertType === 'overdue_assignments'
                ? ($overdueCategoryByStudent[$studentId] ?? 'assignments')
                : 'performance';

            return [
                'student_id' => $studentId,
                'name'       => $row['name'],
                'photo_url'  => $row['photo'],
                'class'      => [
                    'id'         => (int) $row['class_id'],
                    'label'      => $row['class_label'],
                    'grade_name' => $row['grade_name'],
                    'class_name' => $row['class_name'],
                ],
                'alert'      => [
                    'type'     => $alertType,
                    'category' => $category,
                    'reason'   => $row['alert_reason'],
                    'count'    => $overdueCount,
                ],
                'progress'   => [
                    'percent' => (float) $row['performance_percent'],
                    'label'   => $row['performance_label'],
                ],
            ];
        }, $rawAlerts);

        return [
            'meta'   => ['total' => count($alerts)],
            'alerts' => $alerts,
        ];
    }

    /**
     * Classes Overview screen — UI-shaped class cards for grid/list views.
     *
     * @param  int[]  $schoolIds
     * @return array<string, mixed>|null
     */
    public function buildClassesOverview(int $teacherId, array $schoolIds, ?int $classIdFilter = null): ?array
    {
        $scope = $this->hydrateTeacherScope($teacherId, $schoolIds);

        if ($scope === null) {
            return null;
        }

        if ($classIdFilter !== null && ! $scope['class_ids']->contains($classIdFilter)) {
            throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
        }

        $classIds = $classIdFilter !== null
            ? collect([$classIdFilter])
            : $scope['class_ids'];

        $classesMeta = $this->loadClassesMeta($classIds);

        $students = $classIdFilter !== null
            ? $scope['students']->where('class_id', $classIdFilter)->values()
            : $scope['students'];

        $cards = $this->buildClassCards(
            $classesMeta,
            $students,
            $scope['subjects_by_class'],
            $scope['progress_by_student'],
            $scope['overdue_by_student'],
            $scope['need_attention_ids'],
            $scope['assign_rows']
        );

        $classes = array_map(fn (array $card) => $this->enrichClassCardForUi($card), $cards);

        return [
            'classes' => $classes,
            'meta'    => [
                'total'    => count($classes),
                'filter'   => $classIdFilter !== null ? 'single' : 'all',
                'class_id' => $classIdFilter,
            ],
        ];
    }

    /**
     * Class Details — Overview tab for a single class.
     *
     * @param  int[]  $schoolIds
     * @return array<string, mixed>
     */
    public function buildClassDetailsOverview(
        int $teacherId,
        array $schoolIds,
        int $classId,
        string $range = 'week'
    ): array {
        $scope = $this->hydrateTeacherScope($teacherId, $schoolIds);

        if ($scope === null || ! $scope['class_ids']->contains($classId)) {
            throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
        }

        $range = $this->normalizeClassDetailsRange($range);
        $rangeStart = $this->resolveRangeStart($range);

        $classesMeta = $this->loadClassesMeta(collect([$classId]));
        $classMeta = $classesMeta->get($classId);

        if (! $classMeta) {
            throw new \InvalidArgumentException('Class not found.');
        }

        $classStudents = $scope['students']->where('class_id', $classId)->values();
        $classStudentIds = $classStudents->pluck('id')->map(fn ($id) => (int) $id);
        $subjectIds = $scope['subjects_by_class'][$classId] ?? [];

        $classCards = $this->buildClassCards(
            $classesMeta,
            $classStudents,
            $scope['subjects_by_class'],
            $scope['progress_by_student'],
            $scope['overdue_by_student'],
            $scope['need_attention_ids'],
            $scope['assign_rows']
        );

        $classCard = $classCards[0] ?? null;
        $performancePercent = (float) ($classCard['performance_percent'] ?? 0);
        $performanceTrend = $this->resolvePerformanceTrend($performancePercent);

        $classAssignRows = $scope['assign_rows']->filter(
            fn ($row) => $classStudentIds->contains((int) $row->student_id)
        );

        $studentsNeedAttention = $classStudentIds
            ->filter(fn (int $id) => $scope['need_attention_ids']->contains($id))
            ->count();

        $completionBreakdown = $this->buildCompletionStatus($classAssignRows);

        $allClassCards = $this->buildClassCards(
            $this->loadClassesMeta($scope['class_ids']),
            $scope['students'],
            $scope['subjects_by_class'],
            $scope['progress_by_student'],
            $scope['overdue_by_student'],
            $scope['need_attention_ids'],
            $scope['assign_rows']
        );

        $schoolPerformancePercent = $allClassCards === []
            ? 0.0
            : round(collect($allClassCards)->avg('performance_percent'), 1);

        return [
            'class' => [
                'class_id'      => $classId,
                'label'         => (string) $classMeta->class_name,
                'subject_name'  => $this->resolveClassSubjectName($teacherId, $classId),
                'student_count' => $classStudents->count(),
            ],
            'range' => $range,
            'stats' => [
                'performance_percent'       => $performancePercent,
                'performance_trend'         => [
                    'direction'     => $performanceTrend,
                    'delta_percent' => 0.0,
                ],
                'completion_rate_percent'   => $this->completionPercent($classAssignRows),
                'students_need_attention'   => $studentsNeedAttention,
            ],
            'charts' => [
                'performance_line'    => $this->buildPerformanceLineChart(
                    $performancePercent,
                    $schoolPerformancePercent,
                    $range
                ),
                'performance_summary' => [
                    'class_percent'  => $performancePercent,
                    'school_percent' => $schoolPerformancePercent,
                ],
                'completion_status' => $completionBreakdown,
            ],
            'activities'       => $this->buildClassActivities(
                $scope,
                $classStudentIds,
                $rangeStart
            ),
            'students_preview' => $this->buildClassStudentsPreview(
                $classStudents,
                $subjectIds,
                $scope['progress_by_student'],
                $scope['overdue_by_student'],
                $scope['need_attention_ids']
            ),
        ];
    }

    /**
     * Dashboard card metrics — single source of truth for the 4 stat cards.
     *
     * @param  array<string, mixed>  $scope
     * @return array<string, int>
     */
    public function buildStats(array $scope): array
    {
        return [
            'total_classes'           => $this->countTotalClasses($scope),
            'total_students'          => $this->countTotalStudents($scope),
            'students_need_attention' => $this->countStudentsNeedAttention($scope),
            'assignments_in_review'   => $this->countAssignmentsToReview($scope),
        ];
    }

    /**
     * Card 1: distinct classes assigned to the teacher via teachers_grades.
     *
     * @param  array<string, mixed>  $scope
     */
    public function countTotalClasses(array $scope): int
    {
        return $scope['class_ids']->count();
    }

    /**
     * Card 2: active students in the teacher's assigned classes.
     *
     * @param  array<string, mixed>  $scope
     */
    public function countTotalStudents(array $scope): int
    {
        return $scope['students']->count();
    }

    /**
     * Card 3: students flagged by low progress or overdue assignments.
     *
     * @param  array<string, mixed>  $scope
     */
    public function countStudentsNeedAttention(array $scope): int
    {
        if (isset($scope['need_attention_ids'])) {
            return $scope['need_attention_ids']->count();
        }

        $progressByStudent = $this->loadProgressByStudent($scope['student_ids'], $scope['subject_ids']);
        $overdueByStudent = $this->loadOverdueCountsByStudent($scope);

        return $this->resolveNeedAttentionStudentIds(
            $scope['students'],
            $scope['subjects_by_class'],
            $progressByStudent,
            $overdueByStudent
        )->count();
    }

    /**
     * Card 4: pending student submissions awaiting review (opened_at IS NULL).
     *
     * @param  array<string, mixed>  $scope
     */
    public function countAssignmentsToReview(array $scope): int
    {
        if ($scope['student_ids']->isEmpty()) {
            return 0;
        }

        return AssignsStudents::query()
            ->pendingReview()
            ->whereIn('student_id', $scope['student_ids'])
            ->whereHas('assign', function ($query) use ($scope) {
                $query->createdByTeacher($scope['teacher_id']);
            })
            ->count();
    }

    /**
     * @param  int[]  $schoolIds
     * @return array<string, mixed>|null
     */
    private function hydrateTeacherScope(int $teacherId, array $schoolIds): ?array
    {
        $scope = $this->resolveTeacherScope($teacherId, $schoolIds);

        if ($scope === null) {
            return null;
        }

        $progressByStudent = $this->loadProgressByStudent($scope['student_ids'], $scope['subject_ids']);
        $overdueByStudent = $this->loadOverdueCountsByStudent($scope);
        $assignRows = $this->loadTeacherAssignStudentRows($scope);
        $needAttentionIds = $this->resolveNeedAttentionStudentIds(
            $scope['students'],
            $scope['subjects_by_class'],
            $progressByStudent,
            $overdueByStudent
        );

        $scope['progress_by_student'] = $progressByStudent;
        $scope['overdue_by_student'] = $overdueByStudent;
        $scope['assign_rows'] = $assignRows;
        $scope['need_attention_ids'] = $needAttentionIds;

        return $scope;
    }

    /**
     * Resolve teacher scope: class assignments, subjects, and active students.
     *
     * @param  int[]  $schoolIds
     * @return array<string, mixed>|null
     */
    private function resolveTeacherScope(int $teacherId, array $schoolIds = []): ?array
    {
        $assignments = TeachersGrades::query()
            ->assignedToTeacher($teacherId)
            ->get(['class_id', 'grade_id', 'subject_id', 'school_id']);

        if ($assignments->isEmpty()) {
            return null;
        }

        $resolvedSchoolIds = $assignments
            ->pluck('school_id')
            ->unique()
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if ($resolvedSchoolIds === [] && $schoolIds !== []) {
            $resolvedSchoolIds = $schoolIds;
        }

        $classIds = $assignments->pluck('class_id')->unique()->filter()->values();
        $subjectIds = $assignments->pluck('subject_id')->unique()->filter()->values();

        /** @var array<int, int[]> $subjectsByClass */
        $subjectsByClass = $assignments
            ->groupBy('class_id')
            ->map(fn (Collection $rows) => $rows->pluck('subject_id')->unique()->filter()->values()->all())
            ->all();

        $students = Student::query()
            ->activeInClasses($classIds)
            ->get(['id', 'class_id', 'grade_id', 'name', 'name_ar', 'photo']);

        return [
            'teacher_id'        => $teacherId,
            'school_ids'        => $resolvedSchoolIds,
            'assignments'       => $assignments,
            'class_ids'         => $classIds,
            'subject_ids'       => $subjectIds,
            'subjects_by_class' => $subjectsByClass,
            'students'          => $students,
            'student_ids'       => $students->pluck('id'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyTeacherAnalytics(): array
    {
        return [
            'attendance_available' => false,
            'classes_comparison'   => [],
            'completion_status'    => $this->emptyCompletionStatus(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyOverview(int $totalClasses = 0): array
    {
        return [
            'stats' => [
                'total_classes'           => $totalClasses,
                'total_students'          => 0,
                'students_need_attention' => 0,
                'assignments_in_review'   => 0,
            ],
            'summary' => [
                'students_pending_submissions' => 0,
            ],
            'classes' => [],
            'charts'  => [
                'classes_comparison' => [],
                'completion_status'  => $this->emptyCompletionStatus(),
            ],
            'alerts' => [],
        ];
    }

    /**
     * @param  Collection<int, int|string>  $classIds
     * @return Collection<int, object>
     */
    private function loadClassesMeta(Collection $classIds): Collection
    {
        return Classes::query()
            ->with('grade:id,name')
            ->whereIn('id', $classIds)
            ->get(['id', 'name', 'status', 'grade_id'])
            ->map(function (Classes $class) {
                return (object) [
                    'class_id'     => (int) $class->id,
                    'class_name'   => $class->name,
                    'class_status' => (int) $class->status,
                    'grade_id'     => (int) $class->grade_id,
                    'grade_name'   => $class->grade->name ?? '',
                ];
            })
            ->keyBy('class_id');
    }

    /**
     * @param  Collection<int, int|string>  $studentIds
     * @param  Collection<int, int|string>  $subjectIds
     * @return array<int, array<int, float>>
     */
    private function loadProgressByStudent(Collection $studentIds, Collection $subjectIds): array
    {
        if ($studentIds->isEmpty() || $subjectIds->isEmpty()) {
            return [];
        }

        $rows = StudentSubjectProgress::query()
            ->whereIn('student_id', $studentIds)
            ->whereIn('subject_id', $subjectIds)
            ->get(['student_id', 'subject_id', 'value']);

        $map = [];
        foreach ($rows as $row) {
            $map[(int) $row->student_id][(int) $row->subject_id] = (float) $row->value;
        }

        return $map;
    }

    /**
     * Overdue assignments per student:
     * assigns_students.opened_at IS NULL AND assigns.due_date < today.
     *
     * @param  array<string, mixed>  $scope
     * @return array<int, int>
     */
    private function loadOverdueCountsByStudent(array $scope): array
    {
        if ($scope['student_ids']->isEmpty()) {
            return [];
        }

        $rows = AssignsStudents::query()
            ->overdue()
            ->whereIn('student_id', $scope['student_ids'])
            ->whereHas('assign', function ($query) use ($scope) {
                $query->createdByTeacher($scope['teacher_id']);
            })
            ->groupBy('student_id')
            ->selectRaw('student_id, COUNT(DISTINCT assign_id) as overdue_count')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[(int) $row->student_id] = (int) $row->overdue_count;
        }

        return $map;
    }

    /**
     * Dominant overdue category per student (assignments vs quizzes).
     *
     * @param  array<string, mixed>  $scope
     * @return array<int, string>
     */
    private function loadOverdueCategoryByStudent(array $scope): array
    {
        if ($scope['student_ids']->isEmpty()) {
            return [];
        }

        $rows = AssignsStudents::query()
            ->overdue()
            ->whereIn('student_id', $scope['student_ids'])
            ->whereHas('assign', function ($query) use ($scope) {
                $query->createdByTeacher($scope['teacher_id']);
            })
            ->with('assign:id,type')
            ->get(['id', 'student_id', 'assign_id']);

        /** @var array<int, array<string, int>> $countsByStudent */
        $countsByStudent = [];

        foreach ($rows as $row) {
            $studentId = (int) $row->student_id;
            $category = ($row->assign->type ?? '') === 'quizes' ? 'quizzes' : 'assignments';
            $countsByStudent[$studentId][$category] = ($countsByStudent[$studentId][$category] ?? 0) + 1;
        }

        $result = [];
        foreach ($countsByStudent as $studentId => $counts) {
            arsort($counts);
            $result[(int) $studentId] = (string) array_key_first($counts);
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $scope
     * @return Collection<int, AssignsStudents>
     */
    private function loadTeacherAssignStudentRows(array $scope): Collection
    {
        if ($scope['student_ids']->isEmpty()) {
            return collect();
        }

        return AssignsStudents::query()
            ->whereIn('student_id', $scope['student_ids'])
            ->where('status', 1)
            ->whereHas('assign', function ($query) use ($scope) {
                $query->createdByTeacher($scope['teacher_id']);
            })
            ->with('assign:id,type')
            ->get(['id', 'student_id', 'assign_id', 'opened_at'])
            ->map(function (AssignsStudents $row) {
                return (object) [
                    'student_id'  => (int) $row->student_id,
                    'opened_at'   => $row->opened_at,
                    'assign_id'   => (int) $row->assign_id,
                    'assign_type' => $row->assign->type ?? null,
                ];
            });
    }

    /**
     * Flag students when average progress < 70% OR they have overdue assignments.
     *
     * @param  Collection<int, Student>  $students
     * @param  array<int, int[]>  $subjectsByClass
     * @param  array<int, array<int, float>>  $progressByStudent
     * @param  array<int, int>  $overdueByStudent
     * @return Collection<int, int>
     */
    private function resolveNeedAttentionStudentIds(
        Collection $students,
        array $subjectsByClass,
        array $progressByStudent,
        array $overdueByStudent
    ): Collection {
        $ids = collect();

        foreach ($students as $student) {
            $studentId = (int) $student->id;
            $classId = (int) $student->class_id;

            if (($overdueByStudent[$studentId] ?? 0) > 0) {
                $ids->push($studentId);
                continue;
            }

            $subjectIds = $subjectsByClass[$classId] ?? [];
            $avg = $this->studentAverageProgress($studentId, $subjectIds, $progressByStudent);

            if ($avg < self::NEED_ATTENTION_THRESHOLD) {
                $ids->push($studentId);
            }
        }

        return $ids->unique()->values();
    }

    /**
     * @param  int[]  $subjectIds
     */
    private function studentAverageProgress(int $studentId, array $subjectIds, array $progressByStudent): float
    {
        if ($subjectIds === []) {
            return 0.0;
        }

        $values = [];
        foreach ($subjectIds as $subjectId) {
            $values[] = $progressByStudent[$studentId][$subjectId] ?? 0.0;
        }

        return round(array_sum($values) / count($values), 1);
    }

    /**
     * @param  Collection<int, object>  $classesMeta
     * @param  Collection<int, Student>  $students
     * @param  array<int, int[]>  $subjectsByClass
     * @param  array<int, array<int, float>>  $progressByStudent
     * @param  array<int, int>  $overdueByStudent
     * @param  Collection<int, int>  $needAttentionIds
     * @param  Collection<int, object>  $assignRows
     * @return array<int, array<string, mixed>>
     */
    private function buildClassCards(
        Collection $classesMeta,
        Collection $students,
        array $subjectsByClass,
        array $progressByStudent,
        array $overdueByStudent,
        Collection $needAttentionIds,
        Collection $assignRows
    ): array {
        $cards = [];

        foreach ($classesMeta as $classId => $meta) {
            $classStudents = $students->where('class_id', $classId)->values();
            $subjectIds = $subjectsByClass[(int) $classId] ?? [];
            $classStudentIds = $classStudents->pluck('id')->map(fn ($id) => (int) $id);

            $studentAverages = [];
            foreach ($classStudents as $student) {
                $studentAverages[(int) $student->id] = $this->studentAverageProgress(
                    (int) $student->id,
                    $subjectIds,
                    $progressByStudent
                );
            }

            $performance = $studentAverages !== []
                ? round(array_sum($studentAverages) / count($studentAverages), 1)
                : 0.0;

            $topStudent = null;
            if ($studentAverages !== []) {
                arsort($studentAverages);
                $topStudentId = (int) array_key_first($studentAverages);
                $topStudentModel = $classStudents->firstWhere('id', $topStudentId);
                if ($topStudentModel) {
                    $topStudent = [
                        'id'                  => $topStudentId,
                        'name'                => $this->localizedName($topStudentModel),
                        'performance_percent' => $studentAverages[$topStudentId],
                    ];
                }
            }

            $needAttentionCount = $classStudentIds
                ->filter(fn (int $id) => $needAttentionIds->contains($id))
                ->count();

            $pendingAssignments = $this->countPendingSubmissionsForClass($assignRows, $classStudentIds);

            $cards[] = [
                'class_id'                => (int) $classId,
                'grade_id'                => (int) $meta->grade_id,
                'name'                    => trim($meta->grade_name . ' ' . $meta->class_name),
                'grade_name'              => $meta->grade_name,
                'class_name'              => $meta->class_name,
                'student_count'           => $classStudents->count(),
                'performance_percent'     => $performance,
                'students_need_attention' => $needAttentionCount,
                'pending_assignments'     => $pendingAssignments,
                'top_student'             => $topStudent,
                'status'                  => ((int) $meta->class_status) === 1 ? 'active' : 'inactive',
            ];
        }

        usort($cards, fn (array $a, array $b) => strcmp($a['name'], $b['name']));

        return $cards;
    }

    /**
     * @param  Collection<int, int>  $classStudentIds
     */
    private function countPendingSubmissionsForClass(Collection $assignRows, Collection $classStudentIds): int
    {
        if ($classStudentIds->isEmpty()) {
            return 0;
        }

        $classStudentIdSet = $classStudentIds->flip();

        return $assignRows
            ->filter(function ($row) use ($classStudentIdSet) {
                return $classStudentIdSet->has((int) $row->student_id) && $row->opened_at === null;
            })
            ->count();
    }

    /**
     * @param  array<int, array<string, mixed>>  $classCards
     * @param  Collection<int, object>  $assignRows
     * @param  Collection<int, Student>  $students
     * @return array<string, mixed>
     */
    private function buildCharts(array $classCards, Collection $assignRows, Collection $students): array
    {
        /** @var Collection<int, Collection<int, Student>> $studentsByClass */
        $studentsByClass = $students->groupBy('class_id');

        $comparison = [];
        foreach ($classCards as $card) {
            $classStudentIds = ($studentsByClass->get($card['class_id']) ?? collect())
                ->pluck('id')
                ->map(fn ($id) => (int) $id);

            $classAssignRows = $assignRows->filter(
                fn ($row) => $classStudentIds->contains((int) $row->student_id)
            );

            $comparison[] = [
                'class_id'            => $card['class_id'],
                'name'                => $card['name'],
                'performance_percent' => $card['performance_percent'],
                'completion_percent'  => $this->completionPercent($classAssignRows),
            ];
        }

        return [
            'classes_comparison' => $comparison,
            'completion_status'  => $this->buildCompletionStatus($assignRows),
        ];
    }

    /**
     * @param  Collection<int, object>  $assignRows
     */
    private function buildCompletionStatus(Collection $assignRows): array
    {
        return [
            'all'         => $this->completionBreakdown($assignRows),
            'assignments' => $this->completionBreakdown(
                $assignRows->filter(fn ($row) => $row->assign_type !== 'quizes')
            ),
            'quizzes'     => $this->completionBreakdown(
                $assignRows->filter(fn ($row) => $row->assign_type === 'quizes')
            ),
        ];
    }

    /**
     * @return array<string, int|float>
     */
    private function emptyCompletionStatus(): array
    {
        return [
            'all'         => $this->completionBreakdown(collect()),
            'assignments' => $this->completionBreakdown(collect()),
            'quizzes'     => $this->completionBreakdown(collect()),
        ];
    }

    /**
     * Phase 1 completion proxy: opened_at IS NOT NULL = completed.
     *
     * @param  Collection<int, object>  $rows
     * @return array{completed: float, in_progress: float, not_started: float, total: int}
     */
    private function completionBreakdown(Collection $rows): array
    {
        $total = $rows->count();
        if ($total === 0) {
            return [
                'completed'   => 0.0,
                'in_progress' => 0.0,
                'not_started' => 0.0,
                'total'       => 0,
            ];
        }

        $completed = $rows->filter(fn ($row) => $row->opened_at !== null)->count();
        $notStarted = $total - $completed;

        return [
            'completed'   => round(($completed / $total) * 100, 1),
            'in_progress' => 0.0,
            'not_started' => round(($notStarted / $total) * 100, 1),
            'total'       => $total,
        ];
    }

    /**
     * @param  Collection<int, object>  $assignRows
     */
    private function completionPercent(Collection $assignRows): float
    {
        if ($assignRows->isEmpty()) {
            return 0.0;
        }

        $completed = $assignRows->filter(fn ($row) => $row->opened_at !== null)->count();

        return round(($completed / $assignRows->count()) * 100, 1);
    }

    /**
     * @param  Collection<int, object>  $classesMeta
     * @param  Collection<int, Student>  $students
     * @param  array<int, int[]>  $subjectsByClass
     * @param  array<int, array<int, float>>  $progressByStudent
     * @param  array<int, int>  $overdueByStudent
     * @param  Collection<int, int>  $needAttentionIds
     * @return array<int, array<string, mixed>>
     */
    private function buildAlerts(
        Collection $students,
        Collection $classesMeta,
        array $subjectsByClass,
        array $progressByStudent,
        array $overdueByStudent,
        Collection $needAttentionIds
    ): array {
        $alerts = [];

        foreach ($students as $student) {
            $studentId = (int) $student->id;
            if (! $needAttentionIds->contains($studentId)) {
                continue;
            }

            $classId = (int) $student->class_id;
            $meta = $classesMeta->get($classId);
            if (! $meta) {
                continue;
            }

            $subjectIds = $subjectsByClass[$classId] ?? [];
            $performance = $this->studentAverageProgress($studentId, $subjectIds, $progressByStudent);
            $overdueCount = $overdueByStudent[$studentId] ?? 0;

            $alertType = $overdueCount > 0 ? 'overdue_assignments' : 'low_performance';
            $alertReason = $overdueCount > 0
                ? sprintf('Overdue Assignments (%d)', $overdueCount)
                : sprintf('Performance below %d%%', self::NEED_ATTENTION_THRESHOLD);

            $alerts[] = [
                'student_id'          => $studentId,
                'name'                => $this->localizedName($student),
                'class_id'            => $classId,
                'class_name'          => $meta->class_name,
                'grade_name'          => $meta->grade_name,
                'class_label'         => trim($meta->grade_name . ' ' . $meta->class_name),
                'photo'               => $this->studentPhotoUrl($student->photo),
                'alert_type'          => $alertType,
                'alert_reason'        => $alertReason,
                'overdue_count'       => $overdueCount,
                'performance_percent' => $performance,
                'performance_label'   => $this->performanceLabel($performance),
            ];
        }

        usort($alerts, function (array $a, array $b) {
            if ($a['alert_type'] === $b['alert_type']) {
                return $a['performance_percent'] <=> $b['performance_percent'];
            }

            return $a['alert_type'] === 'overdue_assignments' ? -1 : 1;
        });

        return array_slice($alerts, 0, 50);
    }

    /**
     * @param  Collection<int, object>  $assignRows
     */
    private function countStudentsWithPendingSubmissions(Collection $assignRows): int
    {
        return $assignRows
            ->filter(fn ($row) => $row->opened_at === null)
            ->pluck('student_id')
            ->unique()
            ->count();
    }

    private function performanceLabel(float $percent): string
    {
        if ($percent >= self::NEED_ATTENTION_THRESHOLD) {
            return 'average';
        }

        return 'below_average';
    }

    private function localizedName(Student $student): string
    {
        if (app()->getLocale() === 'ar' && ! empty($student->name_ar)) {
            return $student->name_ar;
        }

        return $student->name ?? '';
    }

    private function studentPhotoUrl(?string $photo): ?string
    {
        if (empty($photo)) {
            return null;
        }

        return asset('/storage/' . ltrim($photo, '/'));
    }

    /**
     * @param  array<string, mixed>  $card
     * @return array<string, mixed>
     */
    private function enrichClassCardForUi(array $card): array
    {
        $card['health_status'] = $this->resolveHealthStatus(
            (float) $card['performance_percent'],
            (int) $card['students_need_attention']
        );
        $card['performance_trend'] = $this->resolvePerformanceTrend((float) $card['performance_percent']);

        return $card;
    }

    private function resolveHealthStatus(float $performancePercent, int $studentsNeedAttention): string
    {
        if ($studentsNeedAttention > 0) {
            return 'needs_review';
        }

        if ($performancePercent < self::NEED_ATTENTION_THRESHOLD) {
            return 'at_risk';
        }

        return 'good';
    }

    /**
     * Phase 1 simplified trend — no historical snapshots table.
     */
    private function resolvePerformanceTrend(float $performancePercent): string
    {
        if ($performancePercent <= 0) {
            return 'stable';
        }

        if ($performancePercent >= self::NEED_ATTENTION_THRESHOLD) {
            return 'up';
        }

        return 'down';
    }

    private function normalizeClassDetailsRange(string $range): string
    {
        return in_array($range, ['week', 'month', 'term'], true) ? $range : 'week';
    }

    private function resolveRangeStart(string $range): Carbon
    {
        if ($range === 'month') {
            return now()->startOfMonth();
        }

        if ($range === 'term') {
            return now()->copy()->subMonths(3)->startOfMonth();
        }

        return now()->startOfWeek();
    }

    private function resolveClassSubjectName(int $teacherId, int $classId): string
    {
        $assignment = TeachersGrades::query()
            ->assignedToTeacher($teacherId)
            ->where('class_id', $classId)
            ->whereNotNull('subject_id')
            ->with('subject:id,name,name_ar')
            ->first();

        if (! $assignment || ! $assignment->subject) {
            return '';
        }

        if (app()->getLocale() === 'ar' && ! empty($assignment->subject->name_ar)) {
            return (string) $assignment->subject->name_ar;
        }

        return (string) ($assignment->subject->name ?? '');
    }

    /**
     * Phase 1 line chart — flat series at current performance (no snapshots table).
     * class_percent: active class average student progress.
     * school_percent: average performance across all classes assigned to the teacher.
     *
     * @return array<int, array{label: string, class_percent: float, school_percent: float}>
     */
    private function buildPerformanceLineChart(
        float $classPercent,
        float $schoolPercent,
        string $range
    ): array {
        $points = [];

        if ($range === 'month') {
            for ($week = 1; $week <= 4; $week++) {
                $points[] = [
                    'label'          => sprintf('W%d', $week),
                    'class_percent'  => $classPercent,
                    'school_percent' => $schoolPercent,
                ];
            }

            return $points;
        }

        if ($range === 'term') {
            for ($month = 2; $month >= 0; $month--) {
                $points[] = [
                    'label'          => now()->copy()->subMonths($month)->format('M'),
                    'class_percent'  => $classPercent,
                    'school_percent' => $schoolPercent,
                ];
            }

            return $points;
        }

        $dayLabels = ['Su', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        foreach ($dayLabels as $label) {
            $points[] = [
                'label'          => $label,
                'class_percent'  => $classPercent,
                'school_percent' => $schoolPercent,
            ];
        }

        return $points;
    }

    /**
     * @param  Collection<int, int|string>  $classStudentIds
     * @return array<int, array<string, mixed>>
     */
    private function buildClassActivities(
        array $scope,
        Collection $classStudentIds,
        Carbon $rangeStart
    ): array {
        if ($classStudentIds->isEmpty()) {
            return [];
        }

        $studentIdList = $classStudentIds->values()->all();
        $today = now()->toDateString();

        $assignIds = AssignsStudents::query()
            ->whereIn('student_id', $studentIdList)
            ->where('status', 1)
            ->whereHas('assign', function ($query) use ($scope, $rangeStart) {
                $query
                    ->createdByTeacher($scope['teacher_id'])
                    ->where('created_at', '>=', $rangeStart);
            })
            ->pluck('assign_id')
            ->unique()
            ->values();

        if ($assignIds->isEmpty()) {
            return [];
        }

        $assigns = Assigns::query()
            ->whereIn('id', $assignIds)
            ->orderByDesc('created_at')
            ->get(['id', 'type', 'assigned_name', 'due_date', 'created_at']);

        $activities = [];

        foreach ($assigns as $assign) {
            $submissions = AssignsStudents::query()
                ->where('assign_id', $assign->id)
                ->whereIn('student_id', $studentIdList)
                ->where('status', 1)
                ->get(['opened_at']);

            $total = $submissions->count();
            $completed = $submissions->filter(fn ($row) => $row->opened_at !== null)->count();
            $completionPercent = $total > 0 ? round(($completed / $total) * 100, 1) : 0.0;

            $status = 'pending';
            if ($total > 0 && $completed === $total) {
                $status = 'completed';
            } elseif (
                ! empty($assign->due_date)
                && $assign->due_date < $today
                && $completed < $total
            ) {
                $status = 'overdue';
            }

            $activities[] = [
                'id'                  => (int) $assign->id,
                'title'               => (string) ($assign->assigned_name ?: $assign->type),
                'type'                => $assign->type === 'quizes' ? 'quiz' : 'assignment',
                'due_date'            => $assign->due_date,
                'status'              => $status,
                'completion_percent'  => $completionPercent,
            ];
        }

        return array_slice($activities, 0, 20);
    }

    /**
     * @param  Collection<int, Student>  $classStudents
     * @param  int[]  $subjectIds
     * @param  array<int, array<int, float>>  $progressByStudent
     * @param  array<int, int>  $overdueByStudent
     * @param  Collection<int, int>  $needAttentionIds
     * @return array<int, array<string, mixed>>
     */
    private function buildClassStudentsPreview(
        Collection $classStudents,
        array $subjectIds,
        array $progressByStudent,
        array $overdueByStudent,
        Collection $needAttentionIds
    ): array {
        $rows = [];

        foreach ($classStudents as $student) {
            $studentId = (int) $student->id;
            $performance = $this->studentAverageProgress($studentId, $subjectIds, $progressByStudent);
            $overdueCount = $overdueByStudent[$studentId] ?? 0;
            $needsAttention = $needAttentionIds->contains($studentId);

            $rows[] = [
                'student_id'          => $studentId,
                'name'                => $this->localizedName($student),
                'photo_url'           => $this->studentPhotoUrl($student->photo),
                'performance_percent' => $performance,
                'performance_label'   => $this->performanceLabel($performance),
                'needs_attention'     => $needsAttention,
                'overdue_count'       => $overdueCount,
            ];
        }

        usort($rows, function (array $a, array $b) {
            if ($a['needs_attention'] !== $b['needs_attention']) {
                return $a['needs_attention'] ? -1 : 1;
            }

            return $a['performance_percent'] <=> $b['performance_percent'];
        });

        return array_slice($rows, 0, 10);
    }
}
