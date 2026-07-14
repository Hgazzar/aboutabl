<?php

namespace App\Services;

use App\Models\AssignsStudents;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Shared Learning Progress SSOT for Class Details (class scope) and Student Profile (student scope).
 * Scope difference is only which student IDs are passed in.
 */
class LearningProgressService
{
    /** @var StudentMetricsService */
    private $metrics;

    public function __construct(StudentMetricsService $metrics)
    {
        $this->metrics = $metrics;
    }

    /**
     * @param  Collection<int, int|string>  $studentIds
     * @return array{
     *   source: string,
     *   range: string,
     *   activity: array{completed: int, total: int, percent: float},
     *   submissions: array{completed: int, missing: int, total: int},
     *   score_percent: float
     * }
     */
    public function build(int $teacherId, Collection $studentIds, string $range): array
    {
        $range = $this->metrics->normalizeRange($range);
        $rangeStart = $this->metrics->resolveRangeStart($range);

        return $this->buildForRange($teacherId, $studentIds, $rangeStart, $range);
    }

    /**
     * @param  Collection<int, int|string>  $studentIds
     * @return array<string, mixed>
     */
    public function buildForRange(
        int $teacherId,
        Collection $studentIds,
        Carbon $rangeStart,
        string $range
    ): array {
        if ($studentIds->isEmpty()) {
            return $this->empty($range);
        }

        $studentIdList = $studentIds->values()->all();

        $assignScope = function ($query) use ($teacherId, $rangeStart) {
            $query
                ->createdByTeacher($teacherId)
                ->where('created_at', '>=', $rangeStart);
        };

        $submissions = AssignsStudents::query()
            ->whereIn('student_id', $studentIdList)
            ->where('status', 1)
            ->whereHas('assign', $assignScope)
            ->get(['id', 'opened_at']);

        $totalSubmissions = $submissions->count();
        $completedSubmissions = $submissions
            ->filter(fn (AssignsStudents $row) => $row->opened_at !== null)
            ->count();

        $missingSubmissions = AssignsStudents::query()
            ->overdue()
            ->whereIn('student_id', $studentIdList)
            ->whereHas('assign', $assignScope)
            ->count();

        $activityPercent = $totalSubmissions > 0
            ? round(($completedSubmissions / $totalSubmissions) * 100, 1)
            : 0.0;

        return [
            'source'        => 'assignments',
            'range'         => $range,
            'activity'      => [
                'completed' => $completedSubmissions,
                'total'     => $totalSubmissions,
                'percent'   => $activityPercent,
            ],
            'submissions'   => [
                'completed' => $completedSubmissions,
                'missing'   => $missingSubmissions,
                'total'     => $totalSubmissions,
            ],
            'score_percent' => $activityPercent,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function empty(string $range): array
    {
        $range = $this->metrics->normalizeRange($range);

        return [
            'source'        => 'assignments',
            'range'         => $range,
            'activity'      => [
                'completed' => 0,
                'total'     => 0,
                'percent'   => 0.0,
            ],
            'submissions'   => [
                'completed' => 0,
                'missing'   => 0,
                'total'     => 0,
            ],
            'score_percent' => 0.0,
        ];
    }
}
