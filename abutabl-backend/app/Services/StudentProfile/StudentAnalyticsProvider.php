<?php

namespace App\Services\StudentProfile;

use App\Models\AssignsStudents;
use App\Services\StudentMetricsService;
use App\Services\PerformanceAnalytics\PerformanceTimeSeriesService;
use App\Services\PerformanceAnalytics\PerformanceTrendService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class StudentAnalyticsProvider
{
    /** @var StudentMetricsService */
    private $metrics;

    /** @var PerformanceTimeSeriesService */
    private $timeSeries;

    /** @var PerformanceTrendService */
    private $trends;

    public function __construct(
        StudentMetricsService $metrics,
        PerformanceTimeSeriesService $timeSeries,
        PerformanceTrendService $trends
    ) {
        $this->metrics = $metrics;
        $this->timeSeries = $timeSeries;
        $this->trends = $trends;
    }

    /**
     * Student analytics series — Performance Analytics SSOT when history exists.
     * Falls back to assigns_students daily completion rebuild when history is empty.
     *
     * @param  Collection<int, int>  $classStudentIds
     * @param  array<string, mixed>|null  $summaryStudent
     * @return array<string, mixed>
     */
    public function build(
        int $teacherId,
        int $studentId,
        Collection $classStudentIds,
        string $range,
        ?array $summaryStudent,
        ?int $classId = null
    ): array {
        $rangeStart = $this->metrics->resolveRangeStart($range)->copy()->startOfDay();
        $rangeEnd = now()->copy()->endOfDay();

        if ($classStudentIds->isEmpty()) {
            return $this->emptyAnalytics($summaryStudent);
        }

        $resolvedClassId = $classId ?? 0;
        if ($resolvedClassId < 1 && $summaryStudent !== null) {
            $resolvedClassId = (int) ($summaryStudent['class_id'] ?? 0);
        }

        $historyPayload = $resolvedClassId > 0
            ? $this->buildFromPerformanceHistory($studentId, $resolvedClassId, $rangeStart, $rangeEnd, $summaryStudent)
            : null;

        if ($historyPayload !== null) {
            return $historyPayload;
        }

        return $this->buildCompletionFallback(
            $teacherId,
            $studentId,
            $classStudentIds,
            $rangeStart,
            $rangeEnd,
            $summaryStudent
        );
    }

    /**
     * @param  array<string, mixed>|null  $summaryStudent
     * @return array<string, mixed>|null
     */
    private function buildFromPerformanceHistory(
        int $studentId,
        int $classId,
        Carbon $rangeStart,
        Carbon $rangeEnd,
        ?array $summaryStudent
    ): ?array {
        try {
            $paired = $this->timeSeries->studentVsClassSeries(
                $studentId,
                $classId,
                $rangeStart,
                $rangeEnd
            );

            $studentPoints = $paired['student'] ?? [];

            if ($studentPoints === []) {
                return null;
            }

            $classByDate = collect($paired['class'] ?? [])->keyBy('date');
            $series = [];

            foreach ($studentPoints as $point) {
                $date = (string) $point['date'];
                $classPoint = $classByDate->get($date);
                $day = Carbon::parse($date);

                $series[] = [
                    'day'                => $day->format('D'),
                    'date'               => $date,
                    'value'              => (float) $point['performance_percent'],
                    'completion_percent' => (float) ($point['score_percent'] ?? $point['performance_percent']),
                    'class_avg_percent'  => $classPoint !== null
                        ? (float) $classPoint['performance_percent']
                        : 0.0,
                    'completed'          => 0,
                    'total'              => 0,
                ];
            }

            $spanDays = max(1, $rangeStart->diffInDays($rangeEnd));
            $previousTo = $rangeStart->copy()->subDay()->endOfDay();
            $previousFrom = $previousTo->copy()->subDays($spanDays)->startOfDay();

            $trend = $this->trends->forStudent(
                $studentId,
                $rangeStart,
                $rangeEnd,
                $previousFrom,
                $previousTo,
                $classId
            );

            $performancePercent = $summaryStudent !== null
                ? (float) $summaryStudent['performance_percent']
                : (float) ($studentPoints[count($studentPoints) - 1]['performance_percent'] ?? 0);

            $completionPercent = $summaryStudent !== null
                ? (float) $summaryStudent['score_percent']
                : (float) ($studentPoints[count($studentPoints) - 1]['score_percent'] ?? 0);

            return [
                'available' => true,
                'series'    => $series,
                'summary'   => [
                    'performance_percent'  => $performancePercent,
                    'delta_percent'        => (float) $trend['delta_percent'],
                    'completion_percent'   => $completionPercent,
                    'attendance_percent'   => null,
                    'attendance_available' => false,
                ],
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Pre-history proxy only: rebuilds daily assignment-completion series from assigns_students.
     * Not a Performance Scores fallback — that lives in PerformanceFallback / TimeSeriesService.
     * Removed once performance_facts cover student profile ranges.
     *
     * @param  Collection<int, int>  $classStudentIds
     * @param  array<string, mixed>|null  $summaryStudent
     * @return array<string, mixed>
     */
    private function buildCompletionFallback(
        int $teacherId,
        int $studentId,
        Collection $classStudentIds,
        Carbon $rangeStart,
        Carbon $rangeEnd,
        ?array $summaryStudent
    ): array {
        $rows = AssignsStudents::query()
            ->whereIn('student_id', $classStudentIds->all())
            ->where('status', 1)
            ->whereHas('assign', function ($query) use ($teacherId, $rangeStart, $rangeEnd) {
                $query
                    ->createdByTeacher($teacherId)
                    ->where('created_at', '>=', $rangeStart)
                    ->where('created_at', '<=', $rangeEnd);
            })
            ->with(['assign:id,created_at'])
            ->get(['id', 'student_id', 'assign_id', 'opened_at']);

        $byDayStudent = [];
        $byDayClass = [];

        foreach ($rows as $row) {
            $assign = $row->assign;

            if ($assign === null || $assign->created_at === null) {
                continue;
            }

            $dayKey = Carbon::parse($assign->created_at)->toDateString();

            if (! isset($byDayClass[$dayKey])) {
                $byDayClass[$dayKey] = ['completed' => 0, 'total' => 0];
            }

            $byDayClass[$dayKey]['total']++;

            if ($row->opened_at !== null) {
                $byDayClass[$dayKey]['completed']++;
            }

            if ((int) $row->student_id !== $studentId) {
                continue;
            }

            if (! isset($byDayStudent[$dayKey])) {
                $byDayStudent[$dayKey] = ['completed' => 0, 'total' => 0];
            }

            $byDayStudent[$dayKey]['total']++;

            if ($row->opened_at !== null) {
                $byDayStudent[$dayKey]['completed']++;
            }
        }

        $series = [];
        $cursor = $rangeStart->copy();
        $endDay = $rangeEnd->copy()->startOfDay();

        while ($cursor->lte($endDay)) {
            $dayKey = $cursor->toDateString();
            $studentStats = $byDayStudent[$dayKey] ?? ['completed' => 0, 'total' => 0];
            $classStats = $byDayClass[$dayKey] ?? ['completed' => 0, 'total' => 0];

            $studentPercent = $studentStats['total'] > 0
                ? round(($studentStats['completed'] / $studentStats['total']) * 100, 1)
                : 0.0;

            $classPercent = $classStats['total'] > 0
                ? round(($classStats['completed'] / $classStats['total']) * 100, 1)
                : 0.0;

            $series[] = [
                'day'                => $cursor->format('D'),
                'date'               => $dayKey,
                'value'              => $studentPercent,
                'completion_percent' => $studentPercent,
                'class_avg_percent'  => $classPercent,
                'completed'          => (int) $studentStats['completed'],
                'total'              => (int) $studentStats['total'],
            ];

            $cursor->addDay();
        }

        $performancePercent = $summaryStudent !== null
            ? (float) $summaryStudent['performance_percent']
            : 0.0;

        $completionPercent = $summaryStudent !== null
            ? (float) $summaryStudent['score_percent']
            : 0.0;

        return [
            'available' => true,
            'series'    => $series,
            'summary'   => [
                'performance_percent'  => $performancePercent,
                'delta_percent'        => $this->computeDeltaPercent($series),
                'completion_percent'   => $completionPercent,
                'attendance_percent'   => null,
                'attendance_available' => false,
            ],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $series
     */
    private function computeDeltaPercent(array $series): ?float
    {
        $withActivity = array_values(array_filter(
            $series,
            fn (array $point) => ((int) $point['total']) > 0
        ));

        if (count($withActivity) < 2) {
            return null;
        }

        $first = (float) $withActivity[0]['completion_percent'];
        $last = (float) $withActivity[count($withActivity) - 1]['completion_percent'];

        return round($last - $first, 1);
    }

    /**
     * @param  array<string, mixed>|null  $summaryStudent
     * @return array<string, mixed>
     */
    private function emptyAnalytics(?array $summaryStudent): array
    {
        return [
            'available' => false,
            'series'    => [],
            'summary'   => [
                'performance_percent'  => $summaryStudent['performance_percent'] ?? 0.0,
                'delta_percent'        => null,
                'completion_percent'   => $summaryStudent['score_percent'] ?? 0.0,
                'attendance_percent'   => null,
                'attendance_available' => false,
            ],
        ];
    }
}
