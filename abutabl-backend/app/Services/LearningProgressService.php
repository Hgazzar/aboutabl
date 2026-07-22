<?php

namespace App\Services;

use App\Models\Student;
use App\Models\TeachersGrades;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Shared Learning Progress SSOT for Class Details (class scope) and Student Profile (student scope).
 *
 * F-044B.1 / F-044C — Official source is student_subject_progress only.
 * Never derives Learning Progress from assigns_students.
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
        unset($rangeStart); // SSP is current-state Progress; range kept in payload for contract only.

        if ($studentIds->isEmpty()) {
            return $this->empty($range);
        }

        $studentIdList = $studentIds
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($studentIdList === []) {
            return $this->empty($range);
        }

        $students = Student::query()
            ->whereIn('id', $studentIdList)
            ->get(['id', 'class_id']);

        if ($students->isEmpty()) {
            return $this->empty($range);
        }

        $classIds = $students->pluck('class_id')->unique()->filter()->values();
        $subjectIds = TeachersGrades::query()
            ->assignedToTeacher($teacherId)
            ->whereIn('class_id', $classIds)
            ->whereNotNull('subject_id')
            ->pluck('subject_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->filter(fn ($id) => $id > 0)
            ->values();

        if ($subjectIds->isEmpty()) {
            return $this->empty($range);
        }

        $subjectIdList = $subjectIds->all();
        $progressByStudent = $this->metrics->loadProgressByStudent(
            collect($studentIdList),
            $subjectIds
        );

        $percents = [];
        $cellsWithData = 0;
        $cellsTotal = 0;

        foreach ($students as $student) {
            $studentId = (int) $student->id;
            $progress = $this->metrics->computeProgress(
                $studentId,
                $subjectIdList,
                $progressByStudent
            );
            $percents[] = (float) $progress['percent'];

            foreach ($subjectIdList as $subjectId) {
                $cellsTotal++;
                if (array_key_exists($subjectId, $progressByStudent[$studentId] ?? [])) {
                    $cellsWithData++;
                }
            }
        }

        $percent = $this->metrics->computeAveragePercent($percents);
        $missing = max(0, $cellsTotal - $cellsWithData);

        return [
            'source'        => 'student_subject_progress',
            'range'         => $this->metrics->normalizeRange($range),
            'activity'      => [
                'completed' => $cellsWithData,
                'total'     => $cellsTotal,
                'percent'   => $percent,
            ],
            'submissions'   => [
                'completed' => $cellsWithData,
                'missing'   => $missing,
                'total'     => $cellsTotal,
            ],
            'score_percent' => $percent,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function empty(string $range): array
    {
        $range = $this->metrics->normalizeRange($range);

        return [
            'source'        => 'student_subject_progress',
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
