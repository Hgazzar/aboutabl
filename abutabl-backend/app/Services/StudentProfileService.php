<?php

namespace App\Services;

use App\Models\Student;
use App\Services\StudentProfile\StudentActivitiesProvider;
use App\Services\StudentProfile\StudentAnalyticsProvider;
use App\Services\StudentProfile\StudentEvaluationProvider;
use App\Services\StudentProfile\StudentStandardsProvider;
use App\Services\StudentProfile\StudentSummaryProvider;
use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Orchestrator only — each widget comes from an independent provider.
 *
 * Cache readiness: every widget is resolved via rememberWidget().
 * Flip STUDENT_PROFILE_CACHE_ENABLED / TTL later without changing call sites.
 */
class StudentProfileService
{
    private const CACHE_ENABLED_ENV = 'STUDENT_PROFILE_CACHE_ENABLED';

    private const CACHE_TTL_ENV = 'STUDENT_PROFILE_CACHE_TTL';

    /** @var TeacherDashboardService */
    private $dashboardService;

    /** @var StudentMetricsService */
    private $metrics;

    /** @var StudentSummaryProvider */
    private $summaryProvider;

    /** @var StudentAnalyticsProvider */
    private $analyticsProvider;

    /** @var StudentActivitiesProvider */
    private $activitiesProvider;

    /** @var StudentStandardsProvider */
    private $standardsProvider;

    /** @var StudentEvaluationProvider */
    private $evaluationProvider;

    /** @var LearningProgressService */
    private $learningProgress;

    public function __construct(
        TeacherDashboardService $dashboardService,
        StudentMetricsService $metrics,
        StudentSummaryProvider $summaryProvider,
        StudentAnalyticsProvider $analyticsProvider,
        StudentActivitiesProvider $activitiesProvider,
        StudentStandardsProvider $standardsProvider,
        StudentEvaluationProvider $evaluationProvider,
        LearningProgressService $learningProgress
    ) {
        $this->dashboardService = $dashboardService;
        $this->metrics = $metrics;
        $this->summaryProvider = $summaryProvider;
        $this->analyticsProvider = $analyticsProvider;
        $this->activitiesProvider = $activitiesProvider;
        $this->standardsProvider = $standardsProvider;
        $this->evaluationProvider = $evaluationProvider;
        $this->learningProgress = $learningProgress;
    }

    /**
     * @return array<string, mixed>
     */
    public function buildProfile(
        int $teacherId,
        array $schoolIds,
        int $classId,
        int $studentId,
        string $range = 'week',
        string $subjectSlug = 'letters-explorer',
        int $assignmentsPage = 1,
        int $quizzesPage = 1,
        string $rankingsScope = 'class',
        ?string $rankingsSearch = null,
        ?int $rankingsLimit = null
    ): array {
        $range = $this->metrics->normalizeRange($range);
        $rankingsScope = $this->normalizeRankingsScope($rankingsScope);

        $scope = $this->dashboardService->resolveClassAccess($teacherId, $schoolIds, $classId);

        if ($scope === null) {
            throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
        }

        $belongsToClass = Student::query()
            ->activeInClasses(collect([$classId]))
            ->where('id', $studentId)
            ->exists();

        if (! $belongsToClass) {
            throw new \InvalidArgumentException('The selected student is not in this class.');
        }

        $cacheBase = sprintf(
            'student_profile:%d:%d:%d:%s',
            $teacherId,
            $classId,
            $studentId,
            $range
        );

        $summary = $this->rememberWidget(
            $cacheBase.':summary',
            fn () => $this->summaryProvider->build(
                $teacherId,
                $classId,
                $studentId,
                $scope,
                $range
            )
        );

        $student = $summary['student'];

        $classStudentIds = collect($summary['ranked_rows'] ?? [])
            ->pluck('student_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($classStudentIds->isEmpty()) {
            $classStudentIds = Student::query()
                ->activeInClasses(collect([$classId]))
                ->pluck('id')
                ->map(fn ($id) => (int) $id);
        }

        $analytics = $this->rememberWidget(
            $cacheBase.':analytics',
            fn () => $this->analyticsProvider->build(
                $teacherId,
                $studentId,
                $classStudentIds,
                $range,
                $student,
                $classId
            )
        );

        $completion = $this->buildCompletion($student);

        // Same Learning Progress SSOT as Class Overview — student scope only.
        $learningProgress = $this->rememberWidget(
            $cacheBase.':learning_progress',
            fn () => $this->learningProgress->build(
                $teacherId,
                collect([$studentId]),
                $range
            )
        );

        $activities = $this->rememberWidget(
            $cacheBase.sprintf(':activities:a%d:q%d', $assignmentsPage, $quizzesPage),
            fn () => $this->activitiesProvider->build(
                $teacherId,
                $studentId,
                $range,
                $assignmentsPage,
                $quizzesPage
            )
        );

        $standards = $this->rememberWidget(
            $cacheBase.':standards:'.$subjectSlug,
            fn () => $this->standardsProvider->build(
                $classId,
                $studentId,
                $range,
                $subjectSlug
            )
        );

        $teacherEvaluation = $this->rememberWidget(
            $cacheBase.':evaluation:subjects:'.$this->subjectCacheToken(
                $scope['subjects_by_class'][$classId] ?? []
            ).':std:'.$subjectSlug,
            fn () => $this->evaluationProvider->build([
                'teacher_id' => $teacherId,
                'school_ids' => $schoolIds,
                'class_id'   => $classId,
                'student_id' => $studentId,
                'range'      => $range,
                'subject'    => $subjectSlug,
                'student'    => $student,
                'standards'  => $standards,
                'subject_ids' => array_map(
                    'intval',
                    $scope['subjects_by_class'][$classId] ?? []
                ),
                'access_verified' => true,
            ])
        );

        $rangeStart = $this->metrics->resolveRangeStart($range);
        $classRankedRows = $summary['ranked_rows'] ?? [];

        $allClassesRankedRows = $this->rememberWidget(
            $cacheBase.':rankings_all_classes',
            function () use ($scope, $teacherId, $rangeStart) {
                $classIds = collect($scope['class_ids'] ?? []);
                $students = Student::query()
                    ->activeInClasses($classIds)
                    ->with(['Class:id,name', 'Grade:id,name'])
                    ->get(['id', 'name', 'name_ar', 'photo', 'class_id', 'grade_id']);

                return $this->metrics->buildRankedStudentRowsForTeacherScope(
                    $students,
                    $scope['subjects_by_class'] ?? [],
                    $teacherId,
                    $rangeStart
                );
            }
        );

        return [
            'source'             => 'composed_student_profile',
            'range'              => $range,
            'class_id'           => $classId,
            'student'            => $student ?? [],
            'analytics'          => $analytics,
            'completion'         => $completion,
            'learning_progress'  => $learningProgress,
            'activities'         => $activities,
            'standards'          => $standards,
            'teacher_evaluation' => $teacherEvaluation,
            'rankings'           => $this->buildRankings(
                $classRankedRows,
                $allClassesRankedRows,
                $studentId,
                $rankingsScope,
                $rankingsSearch,
                $rankingsLimit
            ),
        ];
    }

    /**
     * Cache seam — pass-through today; enable via env later.
     *
     * @template T
     * @param  Closure():T  $callback
     * @return T
     */
    protected function rememberWidget(string $key, Closure $callback)
    {
        if (! filter_var(env(self::CACHE_ENABLED_ENV, false), FILTER_VALIDATE_BOOLEAN)) {
            return $callback();
        }

        $ttl = (int) env(self::CACHE_TTL_ENV, 60);

        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Stable subject fingerprint for profile cache keys (F-036 binding).
     *
     * @param  array<int|string>  $subjectIds
     */
    private function subjectCacheToken(array $subjectIds): string
    {
        $normalized = array_values(array_unique(array_map('intval', $subjectIds)));
        sort($normalized);

        return $normalized === [] ? 'none' : implode('-', $normalized);
    }

    /**
     * @param  array<string, mixed>|null  $student
     * @return array<string, mixed>
     */
    private function buildCompletion(?array $student): array
    {
        if ($student === null || $student === []) {
            return [
                'completed'     => 0,
                'missing'       => 0,
                'total'         => 0,
                'percent'       => 0.0,
                'score_percent' => 0.0,
            ];
        }

        $completed = (int) ($student['completed'] ?? 0);
        $total = (int) ($student['total'] ?? 0);
        $missing = (int) ($student['missing'] ?? $this->metrics->computeRemaining($completed, $total));
        $percent = (float) ($student['score_percent'] ?? 0);

        return [
            'completed'     => $completed,
            'missing'       => $missing,
            'total'         => $total,
            'percent'       => $percent,
            'score_percent' => $percent,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $classRankedRows
     * @param  array<int, array<string, mixed>>  $allClassesRankedRows
     * @return array<string, mixed>
     */
    private function buildRankings(
        array $classRankedRows,
        array $allClassesRankedRows,
        int $studentId,
        string $rankingsScope,
        ?string $rankingsSearch,
        ?int $rankingsLimit
    ): array {
        $classItems = $this->mapRankedRowsToItems($classRankedRows, $studentId);
        $allClassesItems = $this->mapRankedRowsToItems($allClassesRankedRows, $studentId);

        $classCurrent = collect($classItems)->firstWhere('is_current', true);
        $allClassesCurrent = collect($allClassesItems)->firstWhere('is_current', true);

        $classRank = $classCurrent['rank'] ?? null;
        $allClassesRank = $allClassesCurrent['rank'] ?? null;
        $allClassesAvailable = $allClassesItems !== [];

        $sourceItems = $rankingsScope === 'all_classes' ? $allClassesItems : $classItems;
        $items = $this->filterRankingsItems($sourceItems, $rankingsSearch, $rankingsLimit, $studentId);

        return [
            'available'             => $sourceItems !== [],
            'scope'                 => $rankingsScope,
            'class_rank'            => $classRank,
            'all_classes_rank'      => $allClassesRank,
            'all_classes_available' => $allClassesAvailable,
            // BC aliases — previously unused placeholders; mirror teacher all-classes rank.
            'school_rank'           => $allClassesRank,
            'school_available'      => $allClassesAvailable,
            'items'                 => $items,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $rankedRows
     * @return array<int, array<string, mixed>>
     */
    private function mapRankedRowsToItems(array $rankedRows, int $studentId): array
    {
        $items = array_map(function (array $row) {
            return [
                'student_id'          => (int) $row['student_id'],
                'name'                => (string) $row['name'],
                'photo_url'           => $row['photo_url'],
                'class_label'         => (string) ($row['class_label'] ?? ''),
                'status'              => (string) $row['status'],
                'performance_label'   => (string) ($row['performance']['label'] ?? ''),
                'score_percent'       => (float) $row['score']['percent'],
                'performance_percent' => (float) $row['performance']['percent'],
                'rank'                => (int) $row['rank'],
                'is_current'          => false,
            ];
        }, $rankedRows);

        usort($items, fn (array $a, array $b) => $a['rank'] <=> $b['rank']);

        foreach ($items as $index => $item) {
            $items[$index]['is_current'] = ((int) $item['student_id']) === $studentId;
        }

        return $items;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function filterRankingsItems(
        array $items,
        ?string $search,
        ?int $limit,
        int $studentId
    ): array {
        $filtered = $items;

        $needle = is_string($search) ? trim($search) : '';
        if ($needle !== '') {
            $needleLower = mb_strtolower($needle);
            $filtered = array_values(array_filter(
                $filtered,
                fn (array $item) => mb_strpos(mb_strtolower((string) $item['name']), $needleLower) !== false
            ));
        }

        if ($limit === null || $limit <= 0) {
            return array_values($filtered);
        }

        $limited = array_slice($filtered, 0, $limit);
        $hasCurrent = collect($limited)->contains(
            fn (array $item) => ((int) $item['student_id']) === $studentId
        );

        if ($hasCurrent) {
            return array_values($limited);
        }

        $current = collect($filtered)->firstWhere('student_id', $studentId);
        if ($current === null) {
            // Current student excluded by search — do not force-insert.
            return array_values($limited);
        }

        $limited[] = $current;
        usort($limited, fn (array $a, array $b) => $a['rank'] <=> $b['rank']);

        return array_values($limited);
    }

    private function normalizeRankingsScope(string $scope): string
    {
        return $scope === 'all_classes' ? 'all_classes' : 'class';
    }
}
