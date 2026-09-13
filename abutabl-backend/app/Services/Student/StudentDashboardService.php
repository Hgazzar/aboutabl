<?php

namespace App\Services\Student;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Models\subjectsSchools;
use App\Services\Assignment\AssignmentParentSubmissionService;
use App\Services\LearningProgressService;
use App\Services\Notification\NotificationInboxService;
use App\Services\PerformanceAnalytics\PerformanceComparisonService;
use App\Services\SmartInsight\InsightMetricsReader;
use App\Services\StudentMetricsService;
use App\Support\Assignment\StudentAssignmentTabClassifier;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StudentDashboardService
{
    /** @var StudentMetricsService */
    private $metrics;

    /** @var StudentProgressOverviewService */
    private $progressOverview;

    /** @var StudentContinueLearningService */
    private $continueLearning;

    /** @var StudentRecommendedActivitiesService */
    private $recommended;

    /** @var StudentRecentActivitiesService */
    private $recentActivities;

    /** @var InsightMetricsReader */
    private $behaviourReader;

    /** @var PerformanceComparisonService */
    private $comparison;

    /** @var LearningProgressService */
    private $learningProgress;

    /** @var StudentXpService */
    private $xp;

    /** @var StudentQuestService */
    private $quests;

    /** @var NotificationInboxService */
    private $inbox;

    /** @var AssignmentParentSubmissionService */
    private $parentSubmissions;

    public function __construct(
        StudentMetricsService $metrics,
        StudentProgressOverviewService $progressOverview,
        StudentContinueLearningService $continueLearning,
        StudentRecommendedActivitiesService $recommended,
        StudentRecentActivitiesService $recentActivities,
        InsightMetricsReader $behaviourReader,
        PerformanceComparisonService $comparison,
        LearningProgressService $learningProgress,
        StudentXpService $xp,
        StudentQuestService $quests,
        NotificationInboxService $inbox,
        AssignmentParentSubmissionService $parentSubmissions
    ) {
        $this->metrics = $metrics;
        $this->progressOverview = $progressOverview;
        $this->continueLearning = $continueLearning;
        $this->recommended = $recommended;
        $this->recentActivities = $recentActivities;
        $this->behaviourReader = $behaviourReader;
        $this->comparison = $comparison;
        $this->learningProgress = $learningProgress;
        $this->xp = $xp;
        $this->quests = $quests;
        $this->inbox = $inbox;
        $this->parentSubmissions = $parentSubmissions;
    }

    /**
     * @return array<string, mixed>
     */
    public function build(int $studentId, string $range = 'week'): array
    {
        $student = Student::query()
            ->with(['School', 'grade', 'class'])
            ->find($studentId);

        if (! $student) {
            throw new \InvalidArgumentException('Student not found.');
        }

        $range = $this->metrics->normalizeRange($range);
        $rangeStart = $this->metrics->resolveRangeStart($range);
        $subjectIds = $this->subjectIdsForStudent($student);
        $teacherId = $this->resolveTeacherId($student);
        $classId = (int) $student->class_id;

        $assignments = $this->buildAssignments($studentId);
        $rankings = $this->buildClassRankings($student, $subjectIds, $teacherId, $rangeStart);
        $progress = $this->progressOverview->build($studentId, $subjectIds);

        if ($teacherId > 0) {
            $learning = $this->learningProgress->build(
                $teacherId,
                collect([$studentId]),
                $range
            );
            $progress['learning'] = $learning;
        }

        $weekly = $this->buildWeeklyActivity($studentId, $classId, $range);
        $streak = $this->buildStreakPayload($studentId);
        $continue = $this->continueLearning->build($studentId, $subjectIds);
        $this->xp->syncAndGet($studentId);
        $recommended = $this->recommended->buildDashboardPayload(
            $studentId,
            $subjectIds,
            $assignments['tabs']['todo'] ?? []
        );
        $recentLimit = max(1, (int) config('student_dashboard.recent_activities_limit', 4));
        $recent = $this->recentActivities->buildDashboardPayload($studentId, $recentLimit);
        $quests = $this->quests->buildDashboardPayload(
            $studentId,
            $student->school_id ? (int) $student->school_id : null,
            $subjectIds
        );

        $unread = $this->inbox->unreadCount($this->inbox->recipientForStudent($student));

        $photoUrl = $student->photo
            ? (str_starts_with((string) $student->photo, 'http')
                ? $student->photo
                : asset('storage/'.$student->photo))
            : null;

        $displayName = app()->getLocale() === 'ar'
            ? ($student->name_ar ?: $student->name)
            : ($student->name ?: $student->name_ar);

        return [
            'student' => [
                'id'         => (int) $student->id,
                'name'       => (string) $displayName,
                'photo_url'  => $photoUrl,
                'class_name' => $student->class ? (string) $student->class->name : '',
                'grade_name' => $student->grade ? (string) $student->grade->name : '',
            ],
            'notifications' => [
                'unread_count' => (int) $unread,
            ],
            'assignments' => $assignments,
            'progress' => $progress,
            'xp' => $this->xp->buildDashboardPayload($studentId),
            'rankings' => $rankings,
            'weekly_activity' => $weekly,
            'streak' => $streak,
            'continue_learning' => $continue,
            'recommended_activities' => $recommended,
            'recent_activities' => $recent,
            'quests' => $quests,
            'range' => $range,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildWeeklyActivity(int $studentId, int $classId, string $range): array
    {
        $behaviour = $this->behaviourReader->learningBehaviourForStudent($studentId);
        $comparison = $this->comparison->weekOverWeekForStudent(
            $studentId,
            $classId > 0 ? $classId : null
        );

        $hasHistory = ($comparison['current_count'] ?? 0) > 0
            || ($comparison['previous_count'] ?? 0) > 0;

        return [
            'range' => $range,
            'event_count' => (int) ($behaviour['weekly_activity'] ?? 0),
            'engagement_trend' => $behaviour['engagement_trend'] ?? null,
            'performance_delta' => $hasHistory ? [
                'current_avg'   => (float) ($comparison['current_avg'] ?? 0),
                'previous_avg'  => (float) ($comparison['previous_avg'] ?? 0),
                'delta_percent' => (float) ($comparison['delta_percent'] ?? 0),
                'has_history'   => true,
            ] : [
                'current_avg'   => null,
                'previous_avg'  => null,
                'delta_percent' => null,
                'has_history'   => false,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildStreakPayload(int $studentId): array
    {
        $streak = $this->behaviourReader->streakPayloadForStudent($studentId);
        $behaviour = $this->behaviourReader->learningBehaviourForStudent($studentId);

        $base = [
            'current_streak' => (int) ($streak['current_streak'] ?? 0),
            'longest_streak' => (int) ($streak['longest_streak'] ?? 0),
            'today_completed' => (bool) ($streak['today_completed'] ?? false),
            'weekly_days' => $streak['weekly_days'] ?? [],
        ];

        if (! ($streak['has_learning_behaviour_data'] ?? false)) {
            return array_merge($base, [
                'available' => false,
                'active_days' => 0,
                'weekly_activity' => 0,
            ]);
        }

        return array_merge($base, [
            'available' => true,
            'active_days' => (int) ($behaviour['active_days'] ?? 0),
            'weekly_activity' => (int) ($behaviour['weekly_activity'] ?? 0),
            'engagement_score' => isset($behaviour['engagement_score'])
                ? (float) $behaviour['engagement_score']
                : null,
            'engagement_trend' => $behaviour['engagement_trend'] ?? null,
        ]);
    }

    /**
     * @return int[]
     */
    public function subjectIdsForStudent(Student $student): array
    {
        $subjectSchool = subjectsSchools::query()
            ->where('school_id', $student->school_id)
            ->where('status', '1')
            ->pluck('id')
            ->toArray();

        return DB::table('subjects_grades')
            ->whereIn('subjects_schools_id', $subjectSchool)
            ->where('grade_id', $student->grade_id)
            ->where('status', '1')
            ->pluck('subject_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    private function resolveTeacherId(Student $student): int
    {
        $teacherId = TeachersGrades::query()
            ->where('class_id', $student->class_id)
            ->where('grade_id', $student->grade_id)
            ->where('school_id', $student->school_id)
            ->where('status', 1)
            ->value('user_id');

        return (int) ($teacherId ?? 0);
    }

    /**
     * @param  int[]  $subjectIds
     * @return array<string, mixed>
     */
    private function buildClassRankings(
        Student $student,
        array $subjectIds,
        int $teacherId,
        Carbon $rangeStart
    ): array {
        $classId = (int) $student->class_id;
        if ($classId <= 0 || $teacherId <= 0) {
            return [
                'available'   => false,
                'class_rank'  => null,
                'score_percent' => null,
                'items'       => [],
            ];
        }

        $students = Student::query()
            ->activeInClasses(collect([$classId]))
            ->with(['Class:id,name', 'Grade:id,name'])
            ->get(['id', 'name', 'name_ar', 'photo', 'class_id', 'grade_id']);

        if ($students->isEmpty()) {
            return [
                'available'   => false,
                'class_rank'  => null,
                'score_percent' => null,
                'items'       => [],
            ];
        }

        $gradeLabel = (string) ($student->grade->name ?? '');
        $classLabel = (string) ($student->class->name ?? '');

        $rankedRows = $this->metrics->buildRankedStudentRows(
            $students,
            $subjectIds,
            $teacherId,
            $rangeStart,
            $classLabel,
            $gradeLabel
        );

        $current = collect($rankedRows)->firstWhere('student_id', (int) $student->id);
        $items = collect($rankedRows)
            ->sortBy('rank')
            ->take(3)
            ->map(function (array $row) use ($student) {
                $studentId = (int) $row['student_id'];

                return [
                    'student_id'    => $studentId,
                    'name'          => (string) $row['name'],
                    'photo_url'     => $row['photo_url'],
                    'rank'          => (int) $row['rank'],
                    'score_percent' => (float) ($row['score']['percent'] ?? 0),
                    'weekly_xp'     => max(0, $this->xp->weeklyXpEarned($studentId)),
                    'is_current'    => $studentId === (int) $student->id,
                ];
            })
            ->values()
            ->all();

        return [
            'available'     => $current !== null,
            'class_rank'    => $current ? (int) $current['rank'] : null,
            'score_percent' => $current ? (float) ($current['score']['percent'] ?? 0) : null,
            'performance_percent' => $current ? (float) ($current['performance']['percent'] ?? 0) : null,
            'items'         => $items,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAssignments(int $studentId): array
    {
        $assignStudentRows = AssignsStudents::query()
            ->where('student_id', $studentId)
            ->where('status', 1)
            ->get();

        $assignIds = $assignStudentRows->pluck('assign_id')->filter()->unique()->values()->all();
        if ($assignIds === []) {
            return [
                'new_count' => 0,
                'tabs'      => [
                    'todo'      => [],
                    'past_due'  => [],
                    'completed' => [],
                ],
            ];
        }

        $assigns = Assigns::query()
            ->whereIn('id', $assignIds)
            ->where('status', '1')
            ->with('activities')
            ->orderByDesc('created_at')
            ->get()
            ->keyBy('id');

        $now = Carbon::now();
        $tabs = [
            'todo'      => [],
            'past_due'  => [],
            'completed' => [],
        ];
        $newCount = 0;

        foreach ($assignStudentRows as $row) {
            $assign = $assigns->get($row->assign_id);
            if (! $assign) {
                continue;
            }

            $dueAt = $assign->due_at ? Carbon::parse($assign->due_at) : null;

            $parentStatus = $this->parentSubmissions->resolveParentStatus($row);
            // COMPLETE = graded only; submitted/waiting stays in TO DO; PAST DUE = expired & unsubmitted.
            $tab = StudentAssignmentTabClassifier::classify($parentStatus, $dueAt, $now);
            $isPastDue = $tab === StudentAssignmentTabClassifier::TAB_PAST_DUE;
            $isCompletedTab = $tab === StudentAssignmentTabClassifier::TAB_COMPLETED;

            // Same SSOT as Assignment Detail — late Submit allowed when active + fully_complete.
            $canSubmit = $parentStatus === AssignmentParentSubmissionService::STATUS_ACTIVE
                && $this->parentSubmissions->canSubmitAssignment($assign, $studentId);
            $redoAllowed = $this->parentSubmissions->canRedoAssignment($assign, $row);

            if (! $isCompletedTab && $row->opened_at === null && ! $row->hasParentSubmission()) {
                $newCount++;
            }

            $item = [
                'assign_id'          => (int) $assign->id,
                'assign_student_id'  => (int) $row->id,
                'title'              => (string) ($assign->assigned_name ?? ''),
                'type'               => (string) $assign->type,
                'type_id'            => $assign->type_id,
                'subject_id'         => $assign->subject_id ? (int) $assign->subject_id : null,
                'due_label'          => $this->dueLabel($dueAt, $now, $isPastDue),
                'due_at'             => $dueAt ? $dueAt->toIso8601String() : null,
                'is_new'             => ! $isCompletedTab && $row->opened_at === null && ! $row->hasParentSubmission(),
                'submission_status'  => $parentStatus,
                'can_submit'         => $canSubmit,
                'redo_allowed'       => $redoAllowed,
            ];

            if ($tab === StudentAssignmentTabClassifier::TAB_COMPLETED) {
                $tabs['completed'][] = $item;
            } elseif ($tab === StudentAssignmentTabClassifier::TAB_PAST_DUE) {
                $tabs['past_due'][] = $item;
            } else {
                $tabs['todo'][] = $item;
            }
        }

        return [
            'new_count' => $newCount,
            'tabs'      => $tabs,
        ];
    }

    private function dueLabel(?Carbon $dueAt, Carbon $now, bool $isPastDue): ?string
    {
        if ($dueAt === null) {
            return null;
        }

        if ($dueAt->isSameDay($now)) {
            return 'Due Today';
        }

        if ($isPastDue) {
            return 'Past Due';
        }

        $days = max(1, (int) $now->diffInDays($dueAt, false));

        return 'Due in '.$days.' Days';
    }
}
