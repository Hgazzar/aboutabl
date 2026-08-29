<?php

namespace App\Services\PerformanceAnalytics;

use Carbon\Carbon;

/**
 * Period-over-period comparison from stored performance_facts averages.
 * Does not recompute score/performance formulas — uses fact.performance_percent only.
 */
class PerformanceComparisonService
{
    /** @var PerformanceHistoryService */
    private $history;

    public function __construct(PerformanceHistoryService $history)
    {
        $this->history = $history;
    }

    /**
     * @return array{
     *   current_avg: float,
     *   previous_avg: float,
     *   delta_percent: float,
     *   current_count: int,
     *   previous_count: int
     * }
     */
    public function compareClassPeriods(
        int $classId,
        Carbon $currentFrom,
        Carbon $currentTo,
        Carbon $previousFrom,
        Carbon $previousTo
    ): array {
        $current = $this->history->factsForClass($classId, $currentFrom, $currentTo);
        $previous = $this->history->factsForClass($classId, $previousFrom, $previousTo);

        return $this->compareCollections($current, $previous);
    }

    /**
     * @param  int[]  $classIds
     * @return array{
     *   current_avg: float,
     *   previous_avg: float,
     *   delta_percent: float,
     *   current_count: int,
     *   previous_count: int
     * }
     */
    public function compareClassesPeriods(
        array $classIds,
        Carbon $currentFrom,
        Carbon $currentTo,
        Carbon $previousFrom,
        Carbon $previousTo
    ): array {
        $current = $this->history->factsForClasses($classIds, $currentFrom, $currentTo);
        $previous = $this->history->factsForClasses($classIds, $previousFrom, $previousTo);

        return $this->compareCollections($current, $previous);
    }

    /**
     * @return array{
     *   current_avg: float,
     *   previous_avg: float,
     *   delta_percent: float,
     *   current_count: int,
     *   previous_count: int
     * }
     */
    public function compareStudentPeriods(
        int $studentId,
        Carbon $currentFrom,
        Carbon $currentTo,
        Carbon $previousFrom,
        Carbon $previousTo,
        ?int $classId = null
    ): array {
        $current = $this->history->factsForStudent($studentId, $currentFrom, $currentTo, $classId);
        $previous = $this->history->factsForStudent($studentId, $previousFrom, $previousTo, $classId);

        return $this->compareCollections($current, $previous);
    }

    /**
     * Convenience: last 7 days vs prior 7 days for a class.
     *
     * @return array{
     *   current_avg: float,
     *   previous_avg: float,
     *   delta_percent: float,
     *   current_count: int,
     *   previous_count: int,
     *   current_from: string,
     *   current_to: string,
     *   previous_from: string,
     *   previous_to: string
     * }
     */
    public function weekOverWeekForClass(int $classId, ?Carbon $anchor = null): array
    {
        $anchor = ($anchor ?? now())->copy()->startOfDay();
        $currentTo = $anchor->copy();
        $currentFrom = $anchor->copy()->subDays(6);
        $previousTo = $currentFrom->copy()->subDay();
        $previousFrom = $previousTo->copy()->subDays(6);

        return array_merge(
            $this->compareClassPeriods($classId, $currentFrom, $currentTo, $previousFrom, $previousTo),
            [
                'current_from'  => $currentFrom->toDateString(),
                'current_to'    => $currentTo->toDateString(),
                'previous_from' => $previousFrom->toDateString(),
                'previous_to'   => $previousTo->toDateString(),
            ]
        );
    }

    /**
     * Last 7 days vs prior 7 days for one student.
     *
     * @return array<string, mixed>
     */
    public function weekOverWeekForStudent(int $studentId, ?int $classId = null, ?Carbon $anchor = null): array
    {
        $anchor = ($anchor ?? now())->copy()->startOfDay();
        $currentTo = $anchor->copy();
        $currentFrom = $anchor->copy()->subDays(6);
        $previousTo = $currentFrom->copy()->subDay();
        $previousFrom = $previousTo->copy()->subDays(6);

        return array_merge(
            $this->compareStudentPeriods(
                $studentId,
                $currentFrom,
                $currentTo,
                $previousFrom,
                $previousTo,
                $classId
            ),
            [
                'current_from'  => $currentFrom->toDateString(),
                'current_to'    => $currentTo->toDateString(),
                'previous_from' => $previousFrom->toDateString(),
                'previous_to'   => $previousTo->toDateString(),
            ]
        );
    }

    /**
     * @param  \Illuminate\Support\Collection<int, \App\Models\PerformanceFact>  $current
     * @param  \Illuminate\Support\Collection<int, \App\Models\PerformanceFact>  $previous
     * @return array{
     *   current_avg: float,
     *   previous_avg: float,
     *   delta_percent: float,
     *   current_count: int,
     *   previous_count: int
     * }
     */
    private function compareCollections($current, $previous): array
    {
        $currentAvg = $current->isEmpty() ? 0.0 : round((float) $current->avg('performance_percent'), 1);
        $previousAvg = $previous->isEmpty() ? 0.0 : round((float) $previous->avg('performance_percent'), 1);

        return [
            'current_avg'    => $currentAvg,
            'previous_avg'   => $previousAvg,
            'delta_percent'  => round($currentAvg - $previousAvg, 1),
            'current_count'  => $current->count(),
            'previous_count' => $previous->count(),
        ];
    }
}
