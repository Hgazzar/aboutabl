<?php

namespace App\Services;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\ClassAlertDismissal;
use App\Models\Classes;
use App\Models\Student;
use App\Services\PerformanceAnalytics\PerformanceComparisonService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ClassAlertsService
{
    private const PERFORMANCE_DROP_THRESHOLD = 5.0;

    private const DEADLINE_WINDOW_HOURS = 24;

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
    public function buildAlerts(int $teacherId, array $schoolIds, int $classId): array
    {
        $scope = $this->dashboardService->resolveClassAccess($teacherId, $schoolIds, $classId);

        if ($scope === null) {
            throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
        }

        $classMeta = Classes::query()
            ->with('grade:id,name')
            ->find($classId, ['id', 'name', 'grade_id']);

        $className = (string) ($classMeta->name ?? '');
        $gradeName = (string) ($classMeta->grade->name ?? '');
        $classLabel = $className !== '' ? $className : $gradeName;

        $students = Student::query()
            ->activeInClasses(collect([$classId]))
            ->get(['id', 'class_id']);

        $studentIds = $students->pluck('id')->map(fn ($id) => (int) $id)->all();
        $dismissedKeys = $this->loadDismissedKeys($teacherId, $classId);

        $candidates = collect()
            ->merge($this->buildPerformanceAlerts($teacherId, $studentIds, $classLabel, $classId))
            ->merge($this->buildDeadlineAlerts($teacherId, $studentIds, $classLabel))
            ->values();

        $active = $candidates
            ->reject(fn (array $alert) => in_array($alert['alert_key'], $dismissedKeys, true))
            ->values()
            ->all();

        return [
            'source'   => 'dynamic_class_alerts',
            'class_id' => $classId,
            'meta'     => [
                'total'           => count($active),
                'dismissed_total' => count($dismissedKeys),
            ],
            'items'    => $active,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function dismissAlert(
        int $teacherId,
        array $schoolIds,
        int $classId,
        string $alertKey
    ): array {
        $this->assertClassAccess($teacherId, $schoolIds, $classId);

        $alertKey = trim($alertKey);

        if ($alertKey === '') {
            throw new \InvalidArgumentException('alert_key is required.');
        }

        ClassAlertDismissal::query()->updateOrCreate(
            [
                'teacher_id' => $teacherId,
                'class_id'   => $classId,
                'alert_key'  => $alertKey,
            ],
            [
                'dismissed_at' => now(),
            ]
        );

        return $this->buildAlerts($teacherId, $schoolIds, $classId);
    }

    /**
     * @return array<string, mixed>
     */
    public function undoDismiss(
        int $teacherId,
        array $schoolIds,
        int $classId,
        string $alertKey
    ): array {
        $this->assertClassAccess($teacherId, $schoolIds, $classId);

        ClassAlertDismissal::query()
            ->forTeacherClass($teacherId, $classId)
            ->where('alert_key', $alertKey)
            ->delete();

        return $this->buildAlerts($teacherId, $schoolIds, $classId);
    }

    /**
     * @return array<string, mixed>
     */
    public function resetDismissals(int $teacherId, array $schoolIds, int $classId): array
    {
        $this->assertClassAccess($teacherId, $schoolIds, $classId);

        ClassAlertDismissal::query()
            ->forTeacherClass($teacherId, $classId)
            ->delete();

        return $this->buildAlerts($teacherId, $schoolIds, $classId);
    }

    /**
     * TEMPORARY mock removed (F-044C) — Performance alerts use real signals only.
     */

    /**
     * @param  int[]  $studentIds
     * @return array<int, array<string, mixed>>
     */
    private function buildPerformanceAlerts(int $teacherId, array $studentIds, string $classLabel, ?int $classId = null): array
    {
        if ($studentIds === []) {
            return [];
        }

        $currentStart = now()->copy()->subDays(7);
        $previousStart = now()->copy()->subDays(14);
        $previousEnd = $currentStart->copy();

        $historyDelta = $classId !== null && $classId > 0
            ? $this->resolvePerformanceDeltaFromHistory($classId, $currentStart, now(), $previousStart, $previousEnd)
            : null;

        if ($historyDelta !== null) {
            $currentScore = $historyDelta['current_avg'];
            $previousScore = $historyDelta['previous_avg'];
            $delta = $historyDelta['delta_percent'];
        } else {
            $currentScore = $this->classCompletionPercent($teacherId, $studentIds, $currentStart, now());
            $previousScore = $this->classCompletionPercent($teacherId, $studentIds, $previousStart, $previousEnd);

            if ($previousScore === null || $currentScore === null) {
                return [];
            }

            $delta = $this->metrics->computeDeltaPercent($currentScore, $previousScore);
        }

        if ($delta > -self::PERFORMANCE_DROP_THRESHOLD) {
            return [];
        }

        $needAttention = $this->countNeedAttentionStudents($teacherId, $studentIds);
        $weekKey = now()->format('o-\WW');
        $detectedAt = now()->copy()->startOfWeek();

        $messageParts = [
            sprintf('Average Performance Dropped %.1f%% This Week', abs($delta)),
        ];

        if ($needAttention > 0) {
            $messageParts[] = 'Participation Low';
        }

        return [[
            'alert_key'     => 'performance_drop:week:'.$weekKey,
            'type'          => 'performance',
            'severity'  => 'warning',
            'title'         => 'Students Need More Attention',
            'message'       => implode(', ', $messageParts),
            'relative_time' => $this->relativeTime($detectedAt),
            'created_at'    => $detectedAt->toIso8601String(),
            'payload'       => [
                'delta_percent'            => $delta,
                'current_percent'          => $currentScore,
                'previous_percent'         => $previousScore,
                'students_need_attention'  => $needAttention,
                'class_label'              => $classLabel,
                'window'                   => 'week',
            ],
            'dismissible'   => true,
        ]];
    }

    /**
     * Prefer Performance Analytics comparison when both periods have facts.
     *
     * @return array{current_avg: float, previous_avg: float, delta_percent: float}|null
     */
    private function resolvePerformanceDeltaFromHistory(
        int $classId,
        Carbon $currentFrom,
        Carbon $currentTo,
        Carbon $previousFrom,
        Carbon $previousTo
    ): ?array {
        try {
            /** @var PerformanceComparisonService $comparison */
            $comparison = app(PerformanceComparisonService::class);
            $result = $comparison->compareClassPeriods(
                $classId,
                $currentFrom,
                $currentTo,
                $previousFrom,
                $previousTo
            );

            if ((int) $result['current_count'] === 0 || (int) $result['previous_count'] === 0) {
                return null;
            }

            return [
                'current_avg'   => (float) $result['current_avg'],
                'previous_avg'  => (float) $result['previous_avg'],
                'delta_percent' => (float) $result['delta_percent'],
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * @param  int[]  $studentIds
     * @return array<int, array<string, mixed>>
     */
    private function buildDeadlineAlerts(int $teacherId, array $studentIds, string $classLabel): array
    {
        if ($studentIds === []) {
            return [];
        }

        $windowStart = now();
        $windowEnd = now()->copy()->addHours(self::DEADLINE_WINDOW_HOURS);

        $assigns = Assigns::query()
            ->createdByTeacher($teacherId)
            ->whereNotNull('due_at')
            ->whereBetween('due_at', [$windowStart, $windowEnd])
            ->orderBy('due_at')
            ->get(['id', 'assigned_name', 'type', 'due_at', 'created_at']);

        if ($assigns->isEmpty()) {
            return [];
        }

        $alerts = [];

        foreach ($assigns as $assign) {
            $pendingCount = AssignsStudents::query()
                ->where('assign_id', $assign->id)
                ->whereIn('student_id', $studentIds)
                ->where('status', 1)
                ->whereNull('opened_at')
                ->count();

            if ($pendingCount <= 0) {
                continue;
            }

            $dueAt = Carbon::parse($assign->due_at);
            $title = (string) ($assign->assigned_name ?: $assign->type);
            $dueLabel = $dueAt->isToday() ? 'Today' : 'Soon';
            $rawCreatedAt = $assign->getRawOriginal('created_at') ?? $assign->getAttributes()['created_at'] ?? null;
            $detectedAt = $rawCreatedAt ? Carbon::parse($rawCreatedAt) : $dueAt->copy()->subHours(1);

            $alerts[] = [
                'alert_key'     => sprintf(
                    'assignment_deadline:%d:%s',
                    (int) $assign->id,
                    $dueAt->toDateString()
                ),
                'type'          => 'deadline',
                'severity'  => 'info',
                'title'         => 'Assignment Deadline '.$dueLabel,
                'message'       => sprintf(
                    '%s Due For %s - %d Students Have Not Yet Submitted',
                    $title,
                    $classLabel !== '' ? $classLabel : 'Class',
                    $pendingCount
                ),
                'relative_time' => $this->relativeTime($detectedAt),
                'created_at'    => $detectedAt->toIso8601String(),
                'payload'       => [
                    'assign_id'         => (int) $assign->id,
                    'assignment_title'  => $title,
                    'due_at'            => $dueAt->toIso8601String(),
                    'pending_students'  => $pendingCount,
                    'class_label'       => $classLabel,
                ],
                'dismissible'   => true,
            ];
        }

        return $alerts;
    }

    /**
     * @param  int[]  $studentIds
     */
    private function classCompletionPercent(
        int $teacherId,
        array $studentIds,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): ?float {
        $rows = AssignsStudents::query()
            ->whereIn('student_id', $studentIds)
            ->where('status', 1)
            ->whereHas('assign', function ($query) use ($teacherId, $rangeStart, $rangeEnd) {
                $query
                    ->createdByTeacher($teacherId)
                    ->where('created_at', '>=', $rangeStart)
                    ->where('created_at', '<', $rangeEnd);
            })
            ->get(['opened_at']);

        if ($rows->isEmpty()) {
            return null;
        }

        $completed = $rows->filter(fn ($row) => $row->opened_at !== null)->count();

        return $this->metrics->computeCompletion([
            'completed' => $completed,
            'total'     => $rows->count(),
        ])['percent'];
    }

    /**
     * @param  int[]  $studentIds
     */
    private function countNeedAttentionStudents(int $teacherId, array $studentIds): int
    {
        if ($studentIds === []) {
            return 0;
        }

        $stats = AssignsStudents::query()
            ->whereIn('student_id', $studentIds)
            ->where('status', 1)
            ->whereHas('assign', function ($query) use ($teacherId) {
                $query
                    ->createdByTeacher($teacherId)
                    ->where('created_at', '>=', now()->copy()->subDays(7));
            })
            ->get(['student_id', 'opened_at']);

        if ($stats->isEmpty()) {
            return 0;
        }

        $byStudent = $stats->groupBy('student_id');
        $count = 0;

        foreach ($byStudent as $rows) {
            $total = $rows->count();
            $completed = $rows->filter(fn ($row) => $row->opened_at !== null)->count();
            $percent = $this->metrics->computeCompletion([
                'completed' => $completed,
                'total'     => $total,
            ], null)['percent'];

            if ($this->metrics->needsAttention((float) $percent, 0)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * @return string[]
     */
    private function loadDismissedKeys(int $teacherId, int $classId): array
    {
        return ClassAlertDismissal::query()
            ->forTeacherClass($teacherId, $classId)
            ->pluck('alert_key')
            ->map(fn ($key) => (string) $key)
            ->all();
    }

    private function assertClassAccess(int $teacherId, array $schoolIds, int $classId): void
    {
        $scope = $this->dashboardService->resolveClassAccess($teacherId, $schoolIds, $classId);

        if ($scope === null) {
            throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
        }
    }

    private function relativeTime(Carbon $moment): string
    {
        return ucfirst($moment->locale('en')->diffForHumans());
    }
}
