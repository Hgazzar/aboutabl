<?php

namespace App\Services\PerformanceAnalytics;

use App\Models\PerformanceFact;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Read API for performance_facts (no writes — Recorder only).
 * Does not compute score/performance/rank — only loads stored facts.
 */
class PerformanceHistoryService
{
    /**
     * @param  int[]|null  $studentIds
     * @return Collection<int, PerformanceFact>
     */
    public function factsForClass(
        int $classId,
        Carbon $from,
        Carbon $to,
        ?array $studentIds = null,
        bool $overallOnly = true
    ): Collection {
        $query = PerformanceFact::query()
            ->where('class_id', $classId)
            ->whereDate('metric_date', '>=', $from->toDateString())
            ->whereDate('metric_date', '<=', $to->toDateString())
            ->orderBy('metric_date');

        if ($overallOnly) {
            $query->whereNull('subject_id');
        }

        if ($studentIds !== null) {
            $query->whereIn('student_id', $studentIds);
        }

        return $query->get();
    }

    /**
     * @return Collection<int, PerformanceFact>
     */
    public function factsForStudent(
        int $studentId,
        Carbon $from,
        Carbon $to,
        ?int $classId = null,
        bool $overallOnly = true
    ): Collection {
        $query = PerformanceFact::query()
            ->where('student_id', $studentId)
            ->whereDate('metric_date', '>=', $from->toDateString())
            ->whereDate('metric_date', '<=', $to->toDateString())
            ->orderBy('metric_date');

        if ($classId !== null) {
            $query->where('class_id', $classId);
        }

        if ($overallOnly) {
            $query->whereNull('subject_id');
        }

        return $query->get();
    }

    /**
     * Latest fact on or before a date (overall subject scope).
     */
    public function latestForStudent(
        int $studentId,
        ?int $classId = null,
        ?Carbon $onOrBefore = null
    ): ?PerformanceFact {
        $query = PerformanceFact::query()
            ->where('student_id', $studentId)
            ->whereNull('subject_id')
            ->orderByDesc('metric_date')
            ->orderByDesc('captured_at');

        if ($classId !== null) {
            $query->where('class_id', $classId);
        }

        if ($onOrBefore !== null) {
            $query->whereDate('metric_date', '<=', $onOrBefore->toDateString());
        }

        return $query->first();
    }

    /**
     * @param  int[]  $classIds
     * @return Collection<int, PerformanceFact>
     */
    public function factsForClasses(
        array $classIds,
        Carbon $from,
        Carbon $to,
        bool $overallOnly = true
    ): Collection {
        if ($classIds === []) {
            return collect();
        }

        $query = PerformanceFact::query()
            ->whereIn('class_id', $classIds)
            ->whereDate('metric_date', '>=', $from->toDateString())
            ->whereDate('metric_date', '<=', $to->toDateString())
            ->orderBy('metric_date');

        if ($overallOnly) {
            $query->whereNull('subject_id');
        }

        return $query->get();
    }
}
