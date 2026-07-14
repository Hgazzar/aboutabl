<?php

namespace App\Services\PerformanceAnalytics;

use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Builds Average Scores Over Time by aggregating stored performance_facts (SSOT History).
 * Does not re-run StudentMetricsService formulas — averages fact.performance_percent / score_percent.
 * Empty history → PerformanceFallback::flatAverageScoresLine via withFallback helpers
 * (TEMPORARY only — see PerformanceAnalyticsRules / PerformanceFallback).
 */
class PerformanceTimeSeriesService
{
    /** @var PerformanceHistoryService */
    private $history;

    public function __construct(PerformanceHistoryService $history)
    {
        $this->history = $history;
    }

    /**
     * Daily average performance for one class.
     *
     * @return array<int, array{date: string, label: string, performance_percent: float, score_percent: float, student_count: int}>
     */
    public function classSeries(int $classId, Carbon $from, Carbon $to): array
    {
        $facts = $this->history->factsForClass($classId, $from, $to);

        return $this->averageByDay($facts);
    }

    /**
     * Daily average across multiple classes (e.g. teacher "All Classes").
     *
     * @param  int[]  $classIds
     * @return array<int, array{date: string, label: string, performance_percent: float, score_percent: float, student_count: int}>
     */
    public function classesSeries(array $classIds, Carbon $from, Carbon $to): array
    {
        $facts = $this->history->factsForClasses($classIds, $from, $to);

        return $this->averageByDay($facts);
    }

    /**
     * Student series vs optional peer class average for the same days.
     *
     * @return array{
     *   student: array<int, array{date: string, label: string, performance_percent: float, score_percent: float}>,
     *   class: array<int, array{date: string, label: string, performance_percent: float, score_percent: float, student_count: int}>
     * }
     */
    public function studentVsClassSeries(
        int $studentId,
        int $classId,
        Carbon $from,
        Carbon $to
    ): array {
        $classFacts = $this->history->factsForClass($classId, $from, $to);
        $studentFacts = $classFacts->where('student_id', $studentId)->values();

        $studentSeries = [];
        foreach ($studentFacts as $fact) {
            $date = $fact->metric_date->toDateString();
            $studentSeries[] = [
                'date'                => $date,
                'label'               => $date,
                'performance_percent' => round((float) $fact->performance_percent, 1),
                'score_percent'       => round((float) $fact->score_percent, 1),
            ];
        }

        return [
            'student' => $studentSeries,
            'class'   => $this->averageByDay($classFacts),
        ];
    }

    /**
     * Pair class + all-classes daily averages (ready for Class/All Classes charts).
     * Single facts query for the teacher class set when possible.
     *
     * @param  int[]  $allClassIds
     * @return array<int, array{date: string, label: string, class_percent: float, all_classes_percent: float}>
     */
    public function classVersusAllClassesSeries(
        int $classId,
        array $allClassIds,
        Carbon $from,
        Carbon $to
    ): array {
        $ids = array_values(array_unique(array_map('intval', $allClassIds)));
        if (! in_array($classId, $ids, true)) {
            $ids[] = $classId;
        }

        $allFacts = $this->history->factsForClasses($ids, $from, $to);
        if ($allFacts->isEmpty()) {
            return [];
        }

        $classByDay = collect($this->averageByDay(
            $allFacts->where('class_id', $classId)->values()
        ))->keyBy('date');

        $allByDay = collect($this->averageByDay($allFacts))->keyBy('date');
        $dates = $classByDay->keys()->merge($allByDay->keys())->unique()->sort()->values();

        $points = [];
        foreach ($dates as $date) {
            $classPoint = $classByDay->get($date);
            $allPoint = $allByDay->get($date);

            $points[] = [
                'date'                => $date,
                'label'               => $date,
                'class_percent'       => $classPoint !== null
                    ? (float) $classPoint['performance_percent']
                    : 0.0,
                'all_classes_percent' => $allPoint !== null
                    ? (float) $allPoint['performance_percent']
                    : 0.0,
            ];
        }

        return $points;
    }

    /**
     * Dashboard line chart: history mapped to contract shape, or canonical flat fallback.
     *
     * @param  int[]  $allClassIds
     * @return array<int, array{label: string, class_percent: float, school_percent: float}>
     */
    public function classVersusAllClassesLineOrFallback(
        int $classId,
        array $allClassIds,
        string $range,
        float $classPercent,
        float $allClassesPercent,
        ?Carbon $from = null,
        ?Carbon $to = null
    ): array {
        $from = ($from ?? $this->resolveRangeStart($range))->copy()->startOfDay();
        $to = ($to ?? now())->copy()->endOfDay();

        try {
            $history = $this->classVersusAllClassesSeries($classId, $allClassIds, $from, $to);

            if ($history !== []) {
                return array_map(function (array $point) use ($range) {
                    return [
                        'label'          => PerformanceFallback::formatLineLabel((string) $point['date'], $range),
                        'class_percent'  => (float) $point['class_percent'],
                        'school_percent' => (float) $point['all_classes_percent'],
                    ];
                }, $history);
            }
        } catch (\Throwable $e) {
            // Fall through to canonical fallback.
        }

        return PerformanceFallback::flatAverageScoresLine($classPercent, $allClassesPercent, $range);
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

    /**
     * @param  Collection<int, \App\Models\PerformanceFact>  $facts
     * @return array<int, array{date: string, label: string, performance_percent: float, score_percent: float, student_count: int}>
     */
    private function averageByDay(Collection $facts): array
    {
        if ($facts->isEmpty()) {
            return [];
        }

        $grouped = $facts->groupBy(function ($fact) {
            return $fact->metric_date->toDateString();
        });

        $series = [];

        foreach ($grouped->sortKeys() as $date => $dayFacts) {
            $studentCount = $dayFacts->pluck('student_id')->unique()->count();
            $series[] = [
                'date'                => $date,
                'label'               => $date,
                'performance_percent' => round((float) $dayFacts->avg('performance_percent'), 1),
                'score_percent'       => round((float) $dayFacts->avg('score_percent'), 1),
                'student_count'       => $studentCount,
            ];
        }

        return $series;
    }
}
