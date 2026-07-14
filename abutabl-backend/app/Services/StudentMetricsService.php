<?php

namespace App\Services;

use App\Models\AssignsStudents;
use App\Models\Student;
use App\Models\StudentSubjectProgress;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Single source of truth for student score / performance / rank formulas.
 *
 * Score, performance, and rank MUST be computed here only.
 * Performance Analytics (Recorder / History / TimeSeries / Comparison / Trend)
 * must call this service for live values — never re-implement these equations.
 *
 * Used by Class Overview, Student Profile, and PerformanceSnapshotRecorder.
 *
 * @see \App\Services\PerformanceAnalytics\PerformanceAnalyticsRules
 */
class StudentMetricsService
{
    public const NEED_ATTENTION_THRESHOLD = 70;

    public const OVERDUE_PENALTY_PERCENT = 5;

    /**
     * @param  array{completed: int, total: int}  $stats
     * @return array{percent: float, completed: int, total: int, has_data: bool}
     */
    public function computeScore(array $stats): array
    {
        $total = (int) ($stats['total'] ?? 0);
        $completed = (int) ($stats['completed'] ?? 0);

        if ($total === 0) {
            return [
                'percent'   => 0.0,
                'completed' => 0,
                'total'     => 0,
                'has_data'  => false,
            ];
        }

        return [
            'percent'   => round(($completed / $total) * 100, 1),
            'completed' => $completed,
            'total'     => $total,
            'has_data'  => true,
        ];
    }

    public function computePerformance(
        float $scorePercent,
        float $progressAverage,
        int $overdueCount,
        bool $hasProgressData
    ): float {
        if ($hasProgressData) {
            return round($progressAverage, 1);
        }

        return round(max(0.0, $scorePercent - ($overdueCount * self::OVERDUE_PENALTY_PERCENT)), 1);
    }

    /**
     * @return array{label: string, trend: string}
     */
    public function resolvePerformanceMeta(float $percent): array
    {
        if ($percent >= 85) {
            return ['label' => 'very_good', 'trend' => 'up'];
        }

        if ($percent >= self::NEED_ATTENTION_THRESHOLD) {
            return ['label' => 'good', 'trend' => 'up'];
        }

        if ($percent >= 50) {
            return ['label' => 'average', 'trend' => 'stable'];
        }

        return ['label' => 'below_average', 'trend' => 'down'];
    }

    public function resolveStatus(float $performancePercent, int $overdueCount, bool $hasScoreData): string
    {
        if (! $hasScoreData) {
            return 'no_data';
        }

        if ($performancePercent >= 80 && $overdueCount === 0) {
            return 'good';
        }

        if ($performancePercent >= self::NEED_ATTENTION_THRESHOLD) {
            return 'average';
        }

        return 'needs_attention';
    }

    /**
     * Dense rank by score then performance then name.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    public function assignRanks(array $items): array
    {
        $ranked = $items;

        usort($ranked, function (array $a, array $b) {
            $scoreCompare = ((float) $b['score']['percent']) <=> ((float) $a['score']['percent']);

            if ($scoreCompare !== 0) {
                return $scoreCompare;
            }

            $performanceCompare = ((float) $b['performance']['percent']) <=> ((float) $a['performance']['percent']);

            if ($performanceCompare !== 0) {
                return $performanceCompare;
            }

            return strcasecmp((string) $a['name'], (string) $b['name']);
        });

        $rank = 0;
        $previousKey = null;

        foreach ($ranked as $index => $row) {
            $currentKey = sprintf(
                '%.1f|%.1f',
                (float) $row['score']['percent'],
                (float) $row['performance']['percent']
            );

            if ($currentKey !== $previousKey) {
                $rank = $index + 1;
                $previousKey = $currentKey;
            }

            $ranked[$index]['rank'] = $rank;
        }

        $rankMap = collect($ranked)->mapWithKeys(fn (array $row) => [
            (int) $row['student_id'] => (int) $row['rank'],
        ]);

        foreach ($items as $index => $row) {
            $items[$index]['rank'] = (int) ($rankMap[(int) $row['student_id']] ?? 0);
        }

        return $items;
    }

    /**
     * @param  int[]  $studentIds
     * @return array<int, array{completed: int, total: int}>
     */
    public function loadSubmissionStatsByStudent(
        array $studentIds,
        int $teacherId,
        Carbon $rangeStart,
        ?Carbon $rangeEnd = null
    ): array {
        if ($studentIds === []) {
            return [];
        }

        $rows = AssignsStudents::query()
            ->whereIn('student_id', $studentIds)
            ->where('status', 1)
            ->whereHas('assign', function ($query) use ($teacherId, $rangeStart, $rangeEnd) {
                $query
                    ->createdByTeacher($teacherId)
                    ->where('created_at', '>=', $rangeStart);

                if ($rangeEnd !== null) {
                    $query->where('created_at', '<', $rangeEnd);
                }
            })
            ->get(['student_id', 'opened_at']);

        $stats = [];

        foreach ($rows as $row) {
            $studentId = (int) $row->student_id;

            if (! isset($stats[$studentId])) {
                $stats[$studentId] = ['completed' => 0, 'total' => 0];
            }

            $stats[$studentId]['total']++;

            if ($row->opened_at !== null) {
                $stats[$studentId]['completed']++;
            }
        }

        return $stats;
    }

    /**
     * @param  int[]  $studentIds
     * @return array<int, int>
     */
    public function loadOverdueCountsByStudent(array $studentIds, int $teacherId): array
    {
        if ($studentIds === []) {
            return [];
        }

        $rows = AssignsStudents::query()
            ->overdue()
            ->whereIn('student_id', $studentIds)
            ->whereHas('assign', function ($query) use ($teacherId) {
                $query->createdByTeacher($teacherId);
            })
            ->groupBy('student_id')
            ->selectRaw('student_id, COUNT(DISTINCT assign_id) as overdue_count')
            ->get();

        $map = [];

        foreach ($rows as $row) {
            $map[(int) $row->student_id] = (int) $row->overdue_count;
        }

        return $map;
    }

    /**
     * @param  Collection<int, int|string>  $studentIds
     * @param  Collection<int, int|string>  $subjectIds
     * @return array<int, array<int, float>>
     */
    public function loadProgressByStudent(Collection $studentIds, Collection $subjectIds): array
    {
        if ($studentIds->isEmpty() || $subjectIds->isEmpty()) {
            return [];
        }

        $rows = StudentSubjectProgress::query()
            ->whereIn('student_id', $studentIds)
            ->whereIn('subject_id', $subjectIds)
            ->get(['student_id', 'subject_id', 'value']);

        $map = [];

        foreach ($rows as $row) {
            $map[(int) $row->student_id][(int) $row->subject_id] = (float) $row->value;
        }

        return $map;
    }

    /**
     * @param  int[]  $subjectIds
     * @param  array<int, array<int, float>>  $progressByStudent
     */
    public function studentHasProgressData(
        int $studentId,
        array $subjectIds,
        array $progressByStudent
    ): bool {
        foreach ($subjectIds as $subjectId) {
            if (array_key_exists((int) $subjectId, $progressByStudent[$studentId] ?? [])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  int[]  $subjectIds
     * @param  array<int, array<int, float>>  $progressByStudent
     */
    public function studentAverageProgress(
        int $studentId,
        array $subjectIds,
        array $progressByStudent
    ): float {
        if ($subjectIds === []) {
            return 0.0;
        }

        $values = [];

        foreach ($subjectIds as $subjectId) {
            $values[] = $progressByStudent[$studentId][(int) $subjectId] ?? 0.0;
        }

        return round(array_sum($values) / count($values), 1);
    }

    public function localizedStudentName(Student $student): string
    {
        if (app()->getLocale() === 'ar' && ! empty($student->name_ar)) {
            return (string) $student->name_ar;
        }

        return (string) ($student->name ?? '');
    }

    public function studentPhotoUrl(?string $photo): ?string
    {
        if (empty($photo)) {
            return null;
        }

        return asset('/storage/'.ltrim($photo, '/'));
    }

    public function normalizeRange(string $range): string
    {
        return in_array($range, ['week', 'month', 'term'], true) ? $range : 'week';
    }

    public function resolveRangeStart(string $range): Carbon
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
     * Build ranked metric rows for all students in a class (shared by overview + profile).
     *
     * @param  Collection<int, Student>  $students
     * @param  int[]  $subjectIds
     * @return array<int, array<string, mixed>>
     */
    public function buildRankedStudentRows(
        Collection $students,
        array $subjectIds,
        int $teacherId,
        Carbon $rangeStart,
        string $classLabelFallback = '',
        string $gradeLabel = ''
    ): array {
        if ($students->isEmpty()) {
            return [];
        }

        $studentIds = $students->pluck('id')->map(fn ($id) => (int) $id)->all();
        $progressByStudent = $this->loadProgressByStudent(collect($studentIds), collect($subjectIds));
        $submissionStats = $this->loadSubmissionStatsByStudent($studentIds, $teacherId, $rangeStart);
        $overdueByStudent = $this->loadOverdueCountsByStudent($studentIds, $teacherId);

        $items = [];

        foreach ($students as $student) {
            $studentId = (int) $student->id;
            $stats = $submissionStats[$studentId] ?? ['completed' => 0, 'total' => 0];
            $score = $this->computeScore($stats);
            $overdueCount = $overdueByStudent[$studentId] ?? 0;
            $hasProgressData = $this->studentHasProgressData($studentId, $subjectIds, $progressByStudent);
            $progressAverage = $this->studentAverageProgress($studentId, $subjectIds, $progressByStudent);
            $performancePercent = $this->computePerformance(
                (float) $score['percent'],
                $progressAverage,
                $overdueCount,
                $hasProgressData
            );
            $performanceMeta = $this->resolvePerformanceMeta($performancePercent);

            $items[] = [
                'student_id'      => $studentId,
                'name'            => $this->localizedStudentName($student),
                'photo_url'       => $this->studentPhotoUrl($student->photo),
                'class_label'     => $gradeLabel !== ''
                    ? $gradeLabel
                    : (string) ($student->Class->name ?? $classLabelFallback),
                'performance'     => [
                    'percent' => $performancePercent,
                    'label'   => $performanceMeta['label'],
                    'trend'   => $performanceMeta['trend'],
                ],
                'score'           => $score,
                'status'          => $this->resolveStatus(
                    $performancePercent,
                    $overdueCount,
                    (bool) $score['has_data']
                ),
                'overdue_count'   => $overdueCount,
                'needs_attention' => $performancePercent < self::NEED_ATTENTION_THRESHOLD || $overdueCount > 0,
            ];
        }

        return $this->assignRanks($items);
    }

    /**
     * Rank students across a teacher's classes (not school-wide).
     * Per-class inputs via buildRankedStudentRows, then one assignRanks across the union.
     * Does not re-implement score / performance / rank formulas.
     *
     * @param  Collection<int, Student>  $students
     * @param  array<int|string, int[]>  $subjectsByClass
     * @return array<int, array<string, mixed>>
     */
    public function buildRankedStudentRowsForTeacherScope(
        Collection $students,
        array $subjectsByClass,
        int $teacherId,
        Carbon $rangeStart
    ): array {
        if ($students->isEmpty()) {
            return [];
        }

        $merged = [];

        foreach ($students->groupBy(fn (Student $student) => (int) $student->class_id) as $classId => $classStudents) {
            $subjectIds = $subjectsByClass[$classId] ?? $subjectsByClass[(string) $classId] ?? [];
            $rows = $this->buildRankedStudentRows(
                $classStudents->values(),
                is_array($subjectIds) ? $subjectIds : [],
                $teacherId,
                $rangeStart,
                '',
                ''
            );

            foreach ($rows as $row) {
                $merged[] = $row;
            }
        }

        return $this->assignRanks($merged);
    }
}
