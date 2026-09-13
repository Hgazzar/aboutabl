<?php

namespace App\Services\Assignment;

use App\Contracts\Assignment\AssignmentAnalyticsInterface;
use App\Contracts\Assignment\AssignmentMaterialResolverInterface;
use App\Contracts\Assignment\AssignmentTargetResolverInterface;
use App\Models\AssignActivity;
use App\Models\AssignActivitySubmission;
use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Services\StudentMetricsService;
use App\Services\TeacherDashboardService;
use App\Support\Assignment\LearningActivityMap;
use App\Support\Assignment\MultiActivityMetrics;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * F-041C — Assignment domain façade over Assigns / AssignsStudents SSOT.
 *
 * Statistics remain owned by LearningProgressService, StudentMetricsService,
 * TeacherDashboardService, ClassAlertsService, ClassActivitiesTasksService.
 * Notifications remain Notification::create inside AssignmentLifecycleService.
 *
 * F-041E.2 — Class assignment cards: listForClass() is the only read source
 * for the teacher Assignments screen (does not replace activities-tasks).
 */
class AssignmentService
{
    /** @var AssignmentTargetResolverInterface */
    private $targeting;

    /** @var AssignmentLifecycleService */
    private $lifecycle;

    /** @var AssignmentPermissionService */
    private $permissions;

    /** @var AssignmentMaterialResolverInterface */
    private $materials;

    /** @var AssignmentAnalyticsInterface */
    private $analytics;

    /** @var TeacherDashboardService */
    private $dashboard;

    /** @var StudentMetricsService */
    private $metrics;

    public function __construct(
        AssignmentTargetResolverInterface $targeting,
        AssignmentLifecycleService $lifecycle,
        AssignmentPermissionService $permissions,
        AssignmentMaterialResolverInterface $materials,
        AssignmentAnalyticsInterface $analytics,
        TeacherDashboardService $dashboard,
        StudentMetricsService $metrics
    ) {
        $this->targeting = $targeting;
        $this->lifecycle = $lifecycle;
        $this->permissions = $permissions;
        $this->materials = $materials;
        $this->analytics = $analytics;
        $this->dashboard = $dashboard;
        $this->metrics = $metrics;
    }

    /**
     * @param  array<int, int>  $schoolIds
     */
    public function listForSchools(array $schoolIds, ?int $createdBy = null): Collection
    {
        $query = Assigns::query()
            ->whereIn('school_id', $schoolIds);

        if ($createdBy !== null && $createdBy > 0) {
            $query->where('created_by', $createdBy);
        }

        return $query
            ->withCount('Students')
            ->with('School')
            ->get();
    }

    /**
     * Class-scoped assignment cards for the teacher Assignments screen.
     *
     * One row per Assigns intersecting the class roster. Completion uses
     * opened_at for legacy assigns; learning_activities uses
     * assign_activity_submissions (fully completed activity set per student).
     * Overdue uses StudentMetricsService::isOverdue; percentage
     * uses StudentMetricsService::computeCompletion.
     *
     * @param  array<int, int>  $schoolIds
     * @param  array{
     *     search?: string|null,
     *     status?: string|null,
     *     subject?: int|null,
     *     teacher?: int|null,
     *     range?: string|null,
     *     sort?: string|null,
     *     page?: int|null,
     *     per_page?: int|null
     * }  $filters
     * @return array<string, mixed>
     */
    public function listForClass(
        int $teacherId,
        array $schoolIds,
        int $classId,
        array $filters = []
    ): array {
        $scope = $this->dashboard->resolveClassAccess($teacherId, $schoolIds, $classId);

        if ($scope === null) {
            throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
        }

        $search = isset($filters['search']) ? trim((string) $filters['search']) : '';
        $status = $this->normalizeCardStatusFilter((string) ($filters['status'] ?? 'all'));
        $subjectId = isset($filters['subject']) ? (int) $filters['subject'] : null;
        $teacherFilter = isset($filters['teacher']) ? (int) $filters['teacher'] : null;
        $range = $this->normalizeListRange((string) ($filters['range'] ?? 'week'));
        $sort = $this->normalizeSort((string) ($filters['sort'] ?? 'newest'));
        $perPage = max(1, min(50, (int) ($filters['per_page'] ?? 15)));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $classStudentIds = Student::query()
            ->where('class_id', $classId)
            ->where('status', '1')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($classStudentIds->isEmpty()) {
            return $this->emptyClassListPayload($classId, $status, $range, $sort, $perPage, $page, $filters);
        }

        $studentIds = $classStudentIds->all();
        $createdBy = $teacherFilter !== null && $teacherFilter > 0
            ? $teacherFilter
            : $teacherId;

        $query = Assigns::query()
            ->where('assigns.status', 1)
            ->where('assigns.created_by', $createdBy)
            ->whereHas('Students', function (Builder $submissionQuery) use ($studentIds) {
                $submissionQuery
                    ->whereIn('student_id', $studentIds)
                    ->where('status', 1);
            })
            ->with([
                'Subject:id,name,name_ar',
                'Teacher:id,name,name_ar',
            ])
            ->withCount([
                'assignStandards as standards_count',
                'Students as target_students' => function (Builder $submissionQuery) use ($studentIds) {
                    $submissionQuery
                        ->whereIn('student_id', $studentIds)
                        ->where('status', 1);
                },
                'Students as completed_students' => function (Builder $submissionQuery) use ($studentIds) {
                    $submissionQuery
                        ->whereIn('student_id', $studentIds)
                        ->where('status', 1)
                        ->whereNotNull('opened_at');
                },
            ]);

        if ($range !== 'all') {
            // Rolling windows — same semantics as ClassActivitiesTasksService /
            // ClassStandardsService for the shared "This Week / Month / Term" chips.
            // Do NOT use StudentMetricsService calendar startOfWeek/startOfMonth here:
            // on Monday that drops Sunday (and confuses teachers expecting last 7 days).
            $query->where('assigns.created_at', '>=', $this->resolveListRangeStart($range));
        }

        if ($subjectId !== null && $subjectId > 0) {
            $query->where('assigns.subject_id', $subjectId);
        }

        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function (Builder $searchQuery) use ($like) {
                $searchQuery
                    ->where('assigns.assigned_name', 'like', $like)
                    ->orWhere('assigns.type', 'like', $like);
            });
        }

        $targetSql = $this->classSubmissionCountSql($studentIds, false);
        $completedSql = $this->classSubmissionCountSql($studentIds, true);

        $this->applyCardStatusFilter($query, $status, $targetSql, $completedSql);
        $this->applyCardSort($query, $sort, $targetSql, $completedSql);

        /** @var LengthAwarePaginator $paginator */
        $paginator = $query->paginate($perPage, ['assigns.*'], 'page', $page);

        $this->overlayLearningActivitiesCompletedCounts(
            collect($paginator->items()),
            $studentIds
        );

        $data = collect($paginator->items())
            ->map(fn (Assigns $assign) => $this->mapClassAssignmentCard($assign))
            ->values()
            ->all();

        return [
            'class_id'     => $classId,
            'source'       => 'assigns',
            'filters'      => [
                'search'  => $search !== '' ? $search : null,
                'status'  => $status,
                'subject' => $subjectId,
                'teacher' => $createdBy,
                'range'   => $range,
                'sort'    => $sort,
            ],
            'data'         => $data,
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
        ];
    }

    /**
     * F-043 — Single assignment details for Screen #6.
     *
     * @param  array<int, int>  $schoolIds
     * @return array<string, mixed>
     */
    public function getForClass(
        int $teacherId,
        array $schoolIds,
        int $classId,
        int $assignmentId
    ): array {
        $scope = $this->dashboard->resolveClassAccess($teacherId, $schoolIds, $classId);

        if ($scope === null) {
            throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
        }

        $classStudentIds = Student::query()
            ->where('class_id', $classId)
            ->where('status', '1')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $studentIds = $classStudentIds->all();

        $assign = Assigns::query()
            ->where('assigns.id', $assignmentId)
            ->where('assigns.status', 1)
            ->where('assigns.created_by', $teacherId)
            ->whereHas('Students', function (Builder $submissionQuery) use ($studentIds) {
                if ($studentIds === []) {
                    $submissionQuery->whereRaw('1 = 0');

                    return;
                }

                $submissionQuery
                    ->whereIn('student_id', $studentIds)
                    ->where('status', 1);
            })
            ->with([
                'Subject:id,name,name_ar',
                'Teacher:id,name,name_ar',
                'activities',
            ])
            ->withCount([
                'assignStandards as standards_count',
                'Students as target_students' => function (Builder $submissionQuery) use ($studentIds) {
                    $submissionQuery
                        ->whereIn('student_id', $studentIds)
                        ->where('status', 1);
                },
                'Students as completed_students' => function (Builder $submissionQuery) use ($studentIds) {
                    $submissionQuery
                        ->whereIn('student_id', $studentIds)
                        ->where('status', 1)
                        ->whereNotNull('opened_at');
                },
            ])
            ->first();

        if ($assign === null) {
            throw new \InvalidArgumentException('assignment_not_found');
        }

        $isLearningActivities = (string) $assign->type === LearningActivityMap::ASSIGN_TYPE;
        if ($isLearningActivities) {
            $this->overlayLearningActivitiesCompletedCounts(collect([$assign]), $studentIds);
        }

        $card = $this->mapClassAssignmentCard($assign);
        $isQuiz = $card['assignment_type'] === 'quiz';
        $students = $this->mapAssignmentStudentRows(
            $assign,
            $studentIds,
            $card['due_at'] ?? null,
            $isQuiz
        );

        $averageScore = null;
        if ($isQuiz || $isLearningActivities) {
            $percents = array_values(array_filter(
                array_map(
                    static fn (array $row) => $row['score_percent'],
                    $students
                ),
                static fn ($value) => $value !== null
            ));
            if ($percents !== []) {
                $averageScore = round(
                    array_sum($percents) / count($percents),
                    2
                );
            }
        }

        return [
            'class_id'      => $classId,
            'source'        => 'assigns',
            'assignment'    => [
                'id'              => $card['id'],
                'title'           => $card['title'],
                'subject'         => $card['subject'],
                'module'          => $card['module'],
                'module_type'     => $card['module'],
                'assignment_type' => $card['assignment_type'],
                'due_date'        => $card['due_at'],
                'due_at'          => $card['due_at'],
                'created_at'      => $card['created_at'],
                'status'          => $card['status'],
                'created_by'      => $card['created_by'],
                'subtitle'        => $card['subtitle'],
                'standards_count' => $card['standards_count'],
            ],
            'statistics'    => [
                'target_students'       => $card['target_students'],
                'completed_students'    => $card['completed_students'],
                'pending_students'      => $card['pending_students'],
                'overdue_students'      => $card['overdue_students'],
                'completion_percentage' => $card['completion_percentage'],
                'has_missing_students'  => $card['has_missing_students'],
                'has_overdue_students'  => $card['has_overdue_students'],
                // Quiz-only graded average from quiz_results; null for Tasks.
                'average_score'         => $averageScore,
            ],
            'students'      => $students,
            'materials'     => $this->bucketMaterials(
                $this->materials->resolveForAssign((int) $assign->id)
            ),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{files: array<int, mixed>, voice_recordings: array<int, mixed>, links: array<int, mixed>}
     */
    private function bucketMaterials(array $items): array
    {
        $files = [];
        $voices = [];
        $links = [];

        foreach ($items as $item) {
            $kind = (string) ($item['kind'] ?? '');
            if ($kind === 'voice') {
                $voices[] = $item;
            } elseif ($kind === 'link') {
                $links[] = $item;
            } else {
                $files[] = $item;
            }
        }

        return [
            'files' => $files,
            'voice_recordings' => $voices,
            'links' => $links,
        ];
    }

    /**
     * Per-student completion rows for Screen #8 / #9.
     *
     * Legacy: status from opened_at + due_at; score only for type=quizes.
     * Multi-Activity (type=learning_activities): tasks/scores from
     * assign_activities + assign_activity_submissions (not type_id / opened_at-only).
     *
     * @param  array<int, int>  $classStudentIds
     * @return array<int, array<string, mixed>>
     */
    private function mapAssignmentStudentRows(
        Assigns $assign,
        array $classStudentIds,
        ?string $dueAtIso,
        bool $isQuiz
    ): array {
        if ($classStudentIds === []) {
            return [];
        }

        $assignId = (int) $assign->id;
        $isLearningActivities = (string) $assign->type === LearningActivityMap::ASSIGN_TYPE;

        $dueAt = null;
        if ($dueAtIso) {
            try {
                $dueAt = Carbon::parse($dueAtIso);
            } catch (\Throwable $e) {
                $dueAt = null;
            }
        }

        $rows = AssignsStudents::query()
            ->where('assign_id', $assignId)
            ->where('status', 1)
            ->whereIn('student_id', $classStudentIds)
            ->with(['student:id,name,name_ar,photo'])
            ->orderBy('student_id')
            ->get();

        $activities = collect();
        $submissionsByStudent = collect();
        if ($isLearningActivities) {
            $activities = $assign->relationLoaded('activities')
                ? $assign->activities
                : AssignActivity::query()
                    ->where('assign_id', $assignId)
                    ->orderBy('sort_order')
                    ->get();

            $submissionsByStudent = AssignActivitySubmission::query()
                ->where('assign_id', $assignId)
                ->whereIn('student_id', $classStudentIds)
                ->get()
                ->groupBy(static fn ($row) => (int) $row->student_id);
        }

        $scoreByStudent = [];
        $durationByStudent = [];
        if ($isQuiz && ! $isLearningActivities) {
            $scoreByStudent = $this->quizScorePercentByStudent($assignId, $classStudentIds);
            $durationByStudent = $this->quizAttemptDurationByStudent($assignId, $classStudentIds);
        }

        $mapped = [];
        foreach ($rows as $row) {
            $studentId = (int) $row->student_id;
            $openedAt = $row->opened_at ? Carbon::parse($row->opened_at) : null;

            $student = $row->student;
            $name = '';
            if ($student) {
                $name = (app()->getLocale() === 'ar' && ! empty($student->name_ar))
                    ? (string) $student->name_ar
                    : (string) ($student->name ?? '');
            }

            if ($isLearningActivities) {
                $la = MultiActivityMetrics::forStudent(
                    $activities,
                    $submissionsByStudent->get($studentId, collect())
                );

                // Parent lifecycle SSOT (assigns_students) — not activity completion.
                /** @var AssignmentParentSubmissionService $parentLifecycle */
                $parentLifecycle = app(AssignmentParentSubmissionService::class);
                $parentStatus = $parentLifecycle->resolveParentStatus($row);
                $submittedAt = $row->submitted_at ? Carbon::parse($row->submitted_at) : null;
                $gradedAt = $row->graded_at ? Carbon::parse($row->graded_at) : null;

                $status = 'missing';
                if ($parentStatus === AssignmentParentSubmissionService::STATUS_GRADED) {
                    $status = 'graded';
                } elseif ($parentStatus === AssignmentParentSubmissionService::STATUS_SUBMITTED) {
                    $status = ($dueAt !== null && $submittedAt !== null && $submittedAt->gt($dueAt))
                        ? 'late'
                        : 'submitted';
                }

                $mapped[] = [
                    'student_id'          => $studentId,
                    'assign_student_id'   => (int) $row->id,
                    'name'                => $name,
                    'photo_url'           => $student && $student->photo
                        ? (string) $student->photo
                        : null,
                    'status'              => $status,
                    'submission_status'   => $parentStatus,
                    'submitted_at'        => $submittedAt ? $submittedAt->toIso8601String() : null,
                    'graded_at'           => $gradedAt ? $gradedAt->toIso8601String() : null,
                    'opened_at'           => $openedAt ? $openedAt->toIso8601String() : null,
                    'score_percent'       => $la['score_percent'],
                    'tasks_total'         => $la['tasks_total'],
                    'tasks_completed'     => $la['tasks_completed'],
                    'completion_percent'  => $la['completion_percent'],
                    'accuracy_percent'    => $la['accuracy_percent'],
                    'duration'            => null,
                ];

                continue;
            }

            $status = 'missing';
            if ($openedAt !== null) {
                $status = ($dueAt !== null && $openedAt->gt($dueAt)) ? 'late' : 'submitted';
            }

            $scorePercent = $isQuiz
                ? ($scoreByStudent[$studentId] ?? null)
                : null;
            $tasksTotal = 1;
            $tasksCompleted = $openedAt !== null ? 1 : 0;
            $completion = $this->metrics->computeCompletion([
                'completed' => $tasksCompleted,
                'total'     => $tasksTotal,
            ]);

            $mapped[] = [
                'student_id'          => $studentId,
                'name'                => $name,
                'photo_url'           => $student && $student->photo
                    ? (string) $student->photo
                    : null,
                'status'              => $status,
                'opened_at'           => $openedAt ? $openedAt->toIso8601String() : null,
                'score_percent'       => $scorePercent,
                'tasks_total'         => $tasksTotal,
                'tasks_completed'     => $tasksCompleted,
                'completion_percent'  => $completion['has_data'] ? $completion['percent'] : null,
                'accuracy_percent'    => $scorePercent,
                'duration'            => $isQuiz
                    ? ($durationByStudent[$studentId] ?? null)
                    : null,
            ];
        }

        usort($mapped, static function (array $a, array $b) {
            return strcasecmp((string) $a['name'], (string) $b['name']);
        });

        return $mapped;
    }

    /**
     * For learning_activities assigns, replace opened_at-based completed_students
     * with students who have parent-submitted (or graded) on assigns_students.
     *
     * @param  Collection<int, Assigns>  $assigns
     * @param  array<int, int>  $studentIds
     */
    private function overlayLearningActivitiesCompletedCounts(
        Collection $assigns,
        array $studentIds
    ): void {
        $laAssigns = $assigns->filter(
            static fn (Assigns $assign) => (string) $assign->type === LearningActivityMap::ASSIGN_TYPE
        );

        if ($laAssigns->isEmpty() || $studentIds === []) {
            return;
        }

        $assignIds = $laAssigns->pluck('id')->map(static fn ($id) => (int) $id)->all();

        if (! \Illuminate\Support\Facades\Schema::hasColumn('assigns_students', 'submission_status')
            && ! \Illuminate\Support\Facades\Schema::hasColumn('assigns_students', 'submitted_at')) {
            foreach ($laAssigns as $assign) {
                $assign->completed_students = 0;
            }

            return;
        }

        $completedByAssign = AssignsStudents::query()
            ->whereIn('assign_id', $assignIds)
            ->whereIn('student_id', $studentIds)
            ->where('status', 1)
            ->where(function (Builder $query) {
                if (\Illuminate\Support\Facades\Schema::hasColumn('assigns_students', 'submission_status')) {
                    $query->whereIn('submission_status', [
                        AssignmentParentSubmissionService::STATUS_SUBMITTED,
                        AssignmentParentSubmissionService::STATUS_GRADED,
                    ]);
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('assigns_students', 'submitted_at')) {
                    $query->orWhereNotNull('submitted_at');
                }
            })
            ->selectRaw('assign_id, COUNT(DISTINCT student_id) as completed_count')
            ->groupBy('assign_id')
            ->pluck('completed_count', 'assign_id');

        foreach ($laAssigns as $assign) {
            $assign->completed_students = (int) ($completedByAssign[(int) $assign->id] ?? 0);
        }
    }

    /**
     * F-046E — Attempt duration labels keyed by student_id for this assign.
     * Formula: submitted_at - started_at on the latest submitted quiz_attempt.
     * Does not use ends_at. Missing timestamps → student omitted (API null → N/A).
     *
     * @param  array<int, int>  $studentIds
     * @return array<int, string>
     */
    private function quizAttemptDurationByStudent(int $assignId, array $studentIds): array
    {
        if ($studentIds === []) {
            return [];
        }

        $attempts = DB::table('quiz_attempts')
            ->where('assign_id', $assignId)
            ->whereIn('student_id', $studentIds)
            ->whereNotNull('started_at')
            ->whereNotNull('submitted_at')
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get(['student_id', 'started_at', 'submitted_at']);

        $out = [];
        foreach ($attempts as $attempt) {
            $studentId = (int) $attempt->student_id;
            if (isset($out[$studentId])) {
                continue;
            }

            try {
                $started = Carbon::parse($attempt->started_at);
                $submitted = Carbon::parse($attempt->submitted_at);
            } catch (\Throwable $e) {
                continue;
            }

            if ($submitted->lt($started)) {
                continue;
            }

            $formatted = $this->formatAttemptDurationLabel($started, $submitted);
            if ($formatted !== null) {
                $out[$studentId] = $formatted;
            }
        }

        return $out;
    }

    /**
     * F-046E — Human-readable duration for Screen #9 Duration card (e.g. 18m 42s).
     */
    private function formatAttemptDurationLabel(Carbon $started, Carbon $submitted): ?string
    {
        $totalSeconds = $started->diffInSeconds($submitted);
        if ($totalSeconds < 0) {
            return null;
        }

        $hours = intdiv($totalSeconds, 3600);
        $minutes = intdiv($totalSeconds % 3600, 60);
        $seconds = $totalSeconds % 60;

        if ($hours > 0) {
            return $hours.'h '.$minutes.'m';
        }

        if ($minutes > 0) {
            return $minutes.'m '.$seconds.'s';
        }

        return $seconds.'s';
    }

    /**
     * Authoritative quiz percents keyed by student_id for this assign.
     * Reuses QuizRuntime tables only — never for non-quiz assignments.
     *
     * @param  array<int, int>  $studentIds
     * @return array<int, float>
     */
    private function quizScorePercentByStudent(int $assignId, array $studentIds): array
    {
        if ($studentIds === []) {
            return [];
        }

        $results = DB::table('quiz_results as qr')
            ->join('quiz_attempts as qa', 'qa.id', '=', 'qr.attempt_id')
            ->where('qa.assign_id', $assignId)
            ->whereIn('qa.student_id', $studentIds)
            ->orderByDesc('qr.is_authoritative')
            ->orderByDesc('qr.finalized_at')
            ->orderByDesc('qr.id')
            ->get(['qr.student_id', 'qr.percent']);

        $out = [];
        foreach ($results as $result) {
            $sid = (int) $result->student_id;
            if (isset($out[$sid])) {
                continue;
            }
            $out[$sid] = round((float) $result->percent, 2);
        }

        return $out;
    }

    /**
     * Module picker options for assign create (legacy get_module_data).
     *
     * @param  array<int, int>  $subjectIds
     * @return \Illuminate\Support\Collection<int, object>
     */
    public function moduleOptions(int $schoolId, string $type, array $subjectIds): Collection
    {
        $columns = [
            'subjects' => 'name_ar',
            'units' => 'name_ar',
            'lessons' => 'name_ar',
            'lessons_contents' => 'name_ar',
            'quizes' => 'title_ar',
            'games' => 'name_ar',
        ];

        $query = DB::table($type);

        if ($type === 'subjects') {
            $query->whereIn('id', $subjectIds);
        } else {
            $query->whereIn('subject_id', $subjectIds);
        }

        return $query->select('id', $columns[$type].' as name')->get();
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{assign: Assigns, student_ids: array<int, int>}
     */
    public function create(array $input, int $authUserId, ?object $user = null): array
    {
        // Permissive probe — identical to open AssignsController (no stricter auth).
        if ($user !== null && ! $this->permissions->canCreate($user)) {
            throw new \InvalidArgumentException('forbidden');
        }

        $studentIds = $this->targeting->resolveStudentIds($input);
        $rawActivities = $input['activities'] ?? null;

        if (is_array($rawActivities) && count($rawActivities) > 0) {
            $schoolId = (int) ($input['school_id'] ?? 0);
            $subjectIds = $this->subjectIdsForSchool($schoolId);
            $preferredSubjectId = isset($input['subject_id']) ? (int) $input['subject_id'] : null;
            $resolved = $this->learningActivitiesBrowser()->resolveForStore(
                $rawActivities,
                $subjectIds,
                $preferredSubjectId > 0 ? $preferredSubjectId : null
            );

            $result = $this->lifecycle->createLearningActivities(
                $input,
                $studentIds,
                $resolved,
                $authUserId
            );
        } else {
            $result = $this->lifecycle->create($input, $studentIds, $authUserId);
        }

        $this->analytics->record('assign.created', [
            'assign_id' => (int) $result['assign']->id,
            'student_ids' => $result['student_ids'],
        ]);

        return $result;
    }

    /**
     * @param  array<int, int>  $subjectIds
     * @return array<int, array<string, mixed>>
     */
    public function learningActivityBooks(array $subjectIds): array
    {
        return $this->learningActivitiesBrowser()->books($subjectIds);
    }

    /**
     * @param  array<int, int>  $subjectIds
     * @return array<int, array<string, mixed>>
     */
    public function learningActivitySections(int $subjectId, array $subjectIds): array
    {
        return $this->learningActivitiesBrowser()->sections($subjectId, $subjectIds);
    }

    /**
     * @param  array<int, int>  $subjectIds
     * @return array<int, array<string, mixed>>
     */
    public function learningActivityItems(int $subjectId, string $sectionKey, array $subjectIds): array
    {
        return $this->learningActivitiesBrowser()->activities($subjectId, $sectionKey, $subjectIds);
    }

    /**
     * @return array<int, int>
     */
    private function subjectIdsForSchool(int $schoolId): array
    {
        return DB::table('subjects_schools')
            ->where('school_id', $schoolId)
            ->whereIn('status', [1, '1'])
            ->pluck('subject_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    private function learningActivitiesBrowser(): LearningActivitiesBrowserService
    {
        return app(LearningActivitiesBrowserService::class);
    }

    /**
     * @return array{student_ids: array<int, int>, teacher_id: int|null, school_id: int|null}
     */
    public function delete(int $assignId, ?object $user = null): array
    {
        $assign = Assigns::find($assignId);

        if ($assign === null) {
            throw new \InvalidArgumentException('assign_not_found');
        }

        if ($user !== null && ! $this->permissions->canDelete($user, $assign)) {
            throw new \InvalidArgumentException('forbidden');
        }

        $result = $this->lifecycle->delete($assignId);

        $this->analytics->record('assign.deleted', [
            'assign_id' => $assignId,
            'student_ids' => $result['student_ids'],
        ]);

        return $result;
    }

    public function markOpened(int $assignId, int $studentId): AssignsStudents
    {
        $row = $this->lifecycle->markOpened($assignId, $studentId);

        $this->analytics->record('assign.opened', [
            'assign_id' => $assignId,
            'student_id' => $studentId,
        ]);

        return $row;
    }

    /**
     * Materials for an assign (assignment_materials via resolver).
     *
     * @return array<int, mixed>
     */
    public function materialsFor(int $assignId): array
    {
        $assign = Assigns::find($assignId);
        $user = auth('admin-api')->user();
        if ($assign !== null && $user !== null) {
            $this->permissions->assertCanAccessMaterials($user, $assign);
        }

        return $this->materials->resolveForAssign($assignId);
    }

    public function permissions(): AssignmentPermissionService
    {
        return $this->permissions;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapClassAssignmentCard(Assigns $assign): array
    {
        $target = (int) ($assign->target_students ?? 0);
        $completed = (int) ($assign->completed_students ?? 0);
        $dueAt = $this->resolveDueAt($assign);
        $createdAt = $this->resolveCreatedAt($assign);

        $allCompleted = $target > 0 && $completed >= $target;
        $incomplete = max(0, $target - $completed);
        $assignOverdue = $this->metrics->isOverdue($allCompleted, $dueAt);

        $overdueStudents = $assignOverdue ? $incomplete : 0;
        $pendingStudents = $assignOverdue ? 0 : $incomplete;

        $completion = $this->metrics->computeCompletion([
            'completed' => $completed,
            'total'     => $target,
        ]);

        $status = 'active';
        if ($allCompleted) {
            $status = 'done';
        } elseif ($overdueStudents > 0) {
            $status = 'overdue';
        }

        $isQuiz = $assign->type === 'quizes';
        $title = (string) ($assign->assigned_name ?: $assign->type);
        $subject = $assign->Subject;

        return [
            'id'                    => (int) $assign->id,
            'title'                 => $title,
            'subtitle'              => $isQuiz
                ? 'Quiz #'.$assign->id
                : 'Assignment #'.$assign->id,
            'assignment_type'       => $isQuiz ? 'quiz' : 'assignment',
            'status'                => $status,
            'due_at'                => $dueAt ? $dueAt->toIso8601String() : null,
            'created_at'            => $createdAt ? $createdAt->toIso8601String() : null,
            'created_by'            => (int) $assign->created_by,
            'subject'               => $subject ? [
                'id'   => (int) $subject->id,
                'name' => $this->localizedSubjectName($subject),
            ] : null,
            'module'                => (string) $assign->type,
            'target_students'       => $target,
            'completed_students'    => $completed,
            'pending_students'      => $pendingStudents,
            'overdue_students'      => $overdueStudents,
            'completion_percentage' => $completion['percent'],
            'has_missing_students'  => $incomplete > 0,
            'has_overdue_students'  => $overdueStudents > 0,
            'standards_count'       => (int) ($assign->standards_count ?? 0),
        ];
    }

    private function applyCardStatusFilter(
        Builder $query,
        string $status,
        string $targetSql,
        string $completedSql
    ): void {
        if ($status === 'all') {
            return;
        }

        $now = now();

        if ($status === 'done') {
            $query->whereRaw("{$completedSql} >= {$targetSql}")
                ->whereRaw("{$targetSql} > 0");

            return;
        }

        if ($status === 'overdue') {
            $query->whereNotNull('assigns.due_at')
                ->where('assigns.due_at', '<', $now)
                ->whereRaw("{$completedSql} < {$targetSql}");

            return;
        }

        // active — incomplete and not past due
        $query->where(function (Builder $activeQuery) use ($now) {
            $activeQuery
                ->whereNull('assigns.due_at')
                ->orWhere('assigns.due_at', '>=', $now);
        })->whereRaw("{$completedSql} < {$targetSql}");
    }

    private function applyCardSort(
        Builder $query,
        string $sort,
        string $targetSql,
        string $completedSql
    ): void {
        if ($sort === 'oldest') {
            $query->orderBy('assigns.created_at', 'asc')->orderBy('assigns.id', 'asc');

            return;
        }

        if ($sort === 'due_date') {
            $query->orderByRaw('assigns.due_at is null')
                ->orderBy('assigns.due_at', 'asc')
                ->orderBy('assigns.id', 'desc');

            return;
        }

        if ($sort === 'completion') {
            $query->orderByRaw(
                "({$completedSql} / nullif({$targetSql}, 0)) desc"
            )->orderBy('assigns.id', 'desc');

            return;
        }

        $query->orderBy('assigns.created_at', 'desc')->orderBy('assigns.id', 'desc');
    }

    /**
     * Correlated count SQL for class roster submissions (IDs already int-cast).
     *
     * @param  array<int, int>  $studentIds
     */
    private function classSubmissionCountSql(array $studentIds, bool $completedOnly): string
    {
        $ids = implode(',', array_map('intval', $studentIds));
        $completedClause = $completedOnly ? ' and assigns_students.opened_at is not null' : '';

        return '(select count(*) from assigns_students'
            .' where assigns_students.assign_id = assigns.id'
            ." and assigns_students.student_id in ({$ids})"
            .' and assigns_students.status = 1'
            .$completedClause
            .')';
    }

    private function normalizeCardStatusFilter(string $status): string
    {
        return in_array($status, ['all', 'active', 'done', 'overdue'], true)
            ? $status
            : 'all';
    }

    private function normalizeListRange(string $range): string
    {
        $aliases = [
            'this_week'  => 'week',
            'this_month' => 'month',
            'this_term'  => 'term',
        ];

        $range = $aliases[$range] ?? $range;

        if ($range === 'all') {
            return 'all';
        }

        return $this->metrics->normalizeRange($range);
    }

    /**
     * Rolling range start for assignment cards list (F-041E.2 / F-043).
     * week = last 7 days, month = last 30 days, term = last 4 months.
     */
    private function resolveListRangeStart(string $range): Carbon
    {
        if ($range === 'month') {
            return now()->subDays(30)->startOfDay();
        }

        if ($range === 'term') {
            return now()->subMonths(4)->startOfDay();
        }

        return now()->subDays(7)->startOfDay();
    }

    private function normalizeSort(string $sort): string
    {
        return in_array($sort, ['newest', 'oldest', 'due_date', 'completion'], true)
            ? $sort
            : 'newest';
    }

    private function resolveDueAt(Assigns $assign): ?Carbon
    {
        if ($assign->due_at instanceof Carbon) {
            return $assign->due_at;
        }

        $raw = $assign->getAttributes()['due_at'] ?? null;

        return $raw ? Carbon::parse($raw) : null;
    }

    private function resolveCreatedAt(Assigns $assign): ?Carbon
    {
        $raw = $assign->getRawOriginal('created_at')
            ?? ($assign->getAttributes()['created_at'] ?? null);

        if ($raw instanceof Carbon) {
            return $raw;
        }

        return $raw ? Carbon::parse($raw) : null;
    }

    private function localizedSubjectName(object $subject): string
    {
        if (app()->getLocale() === 'ar' && ! empty($subject->name_ar)) {
            return (string) $subject->name_ar;
        }

        return (string) ($subject->name ?? $subject->name_ar ?? '');
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function emptyClassListPayload(
        int $classId,
        string $status,
        string $range,
        string $sort,
        int $perPage,
        int $page,
        array $filters
    ): array {
        return [
            'class_id'     => $classId,
            'source'       => 'assigns',
            'filters'      => [
                'search'  => isset($filters['search']) && trim((string) $filters['search']) !== ''
                    ? trim((string) $filters['search'])
                    : null,
                'status'  => $status,
                'subject' => isset($filters['subject']) ? (int) $filters['subject'] : null,
                'teacher' => isset($filters['teacher']) ? (int) $filters['teacher'] : null,
                'range'   => $range,
                'sort'    => $sort,
            ],
            'data'         => [],
            'current_page' => $page,
            'last_page'    => 1,
            'per_page'     => $perPage,
            'total'        => 0,
        ];
    }
}
