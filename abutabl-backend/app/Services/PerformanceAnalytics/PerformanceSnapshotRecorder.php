<?php

namespace App\Services\PerformanceAnalytics;

use App\Models\PerformanceFact;
use App\Models\Student;
use App\Services\StudentMetricsService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use InvalidArgumentException;

/**
 * Sole writer for performance_facts (Single Writer Principle).
 *
 * Live score / performance / overdue values are produced ONLY via
 * StudentMetricsService (buildRankedStudentRows / helpers) — this class never
 * re-implements computeScore / computePerformance / assignRanks.
 *
 * Prefer snapshotStudent() / snapshotClassStudents() for captures.
 * Low-level record() / recordMany() must receive Metrics-derived percents only
 * (e.g. tests or Trigger that already ran Metrics).
 *
 * Idempotent daily upsert: fact_key = student:class:subjectOr0:YYYY-MM-DD.
 * Re-recording the same day updates that day's row only — prior metric_date
 * rows are not rewritten.
 *
 * Future performance sources: update Metrics inputs first, then call this
 * Recorder — see PerformanceAnalyticsRules.
 *
 * @see \App\Services\StudentMetricsService
 * @see \App\Services\PerformanceAnalytics\PerformanceAnalyticsRules
 */
class PerformanceSnapshotRecorder
{
    private const UPSERT_CHUNK = 500;

    /** @var StudentMetricsService */
    private $metrics;

    public function __construct(StudentMetricsService $metrics)
    {
        $this->metrics = $metrics;
    }

    /**
     * Upsert one daily fact. Prefer snapshotClassStudents() for production captures.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function record(array $attributes): PerformanceFact
    {
        $row = $this->normalizeAttributes($attributes);

        return PerformanceFact::withWriteAllowed(function () use ($row) {
            return PerformanceFact::query()->updateOrCreate(
                ['fact_key' => $row['fact_key']],
                $row
            );
        });
    }

    /**
     * Batch upsert daily facts (single writer path for bulk captures).
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return Collection<int, PerformanceFact>
     */
    public function recordMany(array $rows): Collection
    {
        if ($rows === []) {
            return collect();
        }

        $normalized = [];
        $factKeys = [];

        foreach ($rows as $attributes) {
            $row = $this->normalizeAttributes($attributes);
            $normalized[] = $row;
            $factKeys[] = $row['fact_key'];
        }

        PerformanceFact::withWriteAllowed(function () use ($normalized) {
            foreach (array_chunk($normalized, self::UPSERT_CHUNK) as $chunk) {
                $payload = [];
                $now = now();

                foreach ($chunk as $row) {
                    $payload[] = array_merge($row, [
                        'meta'       => isset($row['meta']) ? json_encode($row['meta']) : null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                PerformanceFact::query()->upsert(
                    $payload,
                    ['fact_key'],
                    [
                        'school_id',
                        'class_id',
                        'student_id',
                        'subject_id',
                        'metric_date',
                        'captured_at',
                        'performance_percent',
                        'score_percent',
                        'completion_percent',
                        'progress_average',
                        'overdue_count',
                        'has_progress_data',
                        'source',
                        'source_type',
                        'source_id',
                        'meta',
                        'updated_at',
                    ]
                );
            }
        });

        return PerformanceFact::query()
            ->whereIn('fact_key', $factKeys)
            ->get();
    }

    /**
     * Capture current performance for one student using StudentMetricsService.
     *
     * @param  int[]  $subjectIds
     */
    public function snapshotStudent(
        Student $student,
        array $subjectIds,
        int $teacherId,
        int $schoolId,
        int $classId,
        string $source,
        string $range = 'week',
        ?Carbon $metricDate = null,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?array $meta = null
    ): ?PerformanceFact {
        $facts = $this->snapshotClassStudents(
            collect([$student]),
            $subjectIds,
            $teacherId,
            $schoolId,
            $classId,
            $source,
            $range,
            $metricDate,
            $sourceType,
            $sourceId,
            $meta
        );

        return $facts->first();
    }

    /**
     * Capture current performance for all students in a class using StudentMetricsService.
     *
     * @param  Collection<int, Student>  $students
     * @param  int[]  $subjectIds
     * @return Collection<int, PerformanceFact>
     */
    public function snapshotClassStudents(
        Collection $students,
        array $subjectIds,
        int $teacherId,
        int $schoolId,
        int $classId,
        string $source,
        string $range = 'week',
        ?Carbon $metricDate = null,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?array $meta = null
    ): Collection {
        if ($students->isEmpty()) {
            return collect();
        }

        $normalizedRange = $this->metrics->normalizeRange($range);
        $rangeStart = $this->metrics->resolveRangeStart($normalizedRange);
        $date = ($metricDate ?? now())->toDateString();

        $studentIds = $students->pluck('id')->map(fn ($id) => (int) $id)->values();
        $progressByStudent = $this->metrics->loadProgressByStudent($studentIds, collect($subjectIds));

        $rankedRows = $this->metrics->buildRankedStudentRows(
            $students,
            $subjectIds,
            $teacherId,
            $rangeStart
        );

        $payloads = [];

        foreach ($rankedRows as $row) {
            $studentId = (int) $row['student_id'];
            $hasProgress = $this->metrics->studentHasProgressData($studentId, $subjectIds, $progressByStudent);
            $progressAverage = $this->metrics->studentAverageProgress($studentId, $subjectIds, $progressByStudent);

            $payloads[] = [
                'school_id'           => $schoolId,
                'class_id'            => $classId,
                'student_id'          => $studentId,
                'subject_id'          => null,
                'metric_date'         => $date,
                'performance_percent' => (float) ($row['performance']['percent'] ?? 0),
                'score_percent'       => (float) ($row['score']['percent'] ?? 0),
                'completion_percent'  => (float) ($row['score']['percent'] ?? 0),
                'progress_average'    => $hasProgress ? $progressAverage : null,
                'overdue_count'       => (int) ($row['overdue_count'] ?? 0),
                'has_progress_data'   => $hasProgress,
                'source'              => $source,
                'source_type'         => $sourceType,
                'source_id'           => $sourceId,
                'meta'                => $meta,
            ];
        }

        return $this->recordMany($payloads);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function normalizeAttributes(array $attributes): array
    {
        $studentId = (int) ($attributes['student_id'] ?? 0);
        $classId = (int) ($attributes['class_id'] ?? 0);
        $schoolId = (int) ($attributes['school_id'] ?? 0);
        $subjectId = array_key_exists('subject_id', $attributes) && $attributes['subject_id'] !== null
            ? (int) $attributes['subject_id']
            : null;
        $source = (string) ($attributes['source'] ?? '');
        $metricDate = isset($attributes['metric_date'])
            ? Carbon::parse($attributes['metric_date'])->toDateString()
            : now()->toDateString();

        if ($studentId < 1 || $classId < 1 || $schoolId < 1) {
            throw new InvalidArgumentException('performance_facts require school_id, class_id, and student_id.');
        }

        if ($source === '') {
            throw new InvalidArgumentException('performance_facts.source is required.');
        }

        $scorePercent = round((float) ($attributes['score_percent'] ?? 0), 2);
        $performancePercent = round((float) ($attributes['performance_percent'] ?? 0), 2);
        $completionPercent = array_key_exists('completion_percent', $attributes)
            ? round((float) $attributes['completion_percent'], 2)
            : $scorePercent;

        $capturedAt = isset($attributes['captured_at'])
            ? Carbon::parse($attributes['captured_at'])->toDateTimeString()
            : now()->toDateTimeString();

        return [
            'fact_key'             => PerformanceFact::buildFactKey($studentId, $classId, $subjectId, $metricDate),
            'school_id'            => $schoolId,
            'class_id'             => $classId,
            'student_id'           => $studentId,
            'subject_id'           => $subjectId,
            'metric_date'          => $metricDate,
            'captured_at'          => $capturedAt,
            'performance_percent'  => $performancePercent,
            'score_percent'        => $scorePercent,
            'completion_percent'   => $completionPercent,
            'progress_average'     => array_key_exists('progress_average', $attributes)
                ? ($attributes['progress_average'] === null
                    ? null
                    : round((float) $attributes['progress_average'], 2))
                : null,
            'overdue_count'        => (int) ($attributes['overdue_count'] ?? 0),
            'has_progress_data'    => (bool) ($attributes['has_progress_data'] ?? false),
            'source'               => $source,
            'source_type'          => $attributes['source_type'] ?? null,
            'source_id'            => isset($attributes['source_id']) ? (int) $attributes['source_id'] : null,
            'meta'                 => $attributes['meta'] ?? null,
        ];
    }
}
