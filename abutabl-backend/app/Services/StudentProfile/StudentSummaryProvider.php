<?php

namespace App\Services\StudentProfile;

use App\Models\Classes;
use App\Models\Student;
use App\Services\StudentMetricsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudentSummaryProvider
{
    /** @var StudentMetricsService */
    private $metrics;

    public function __construct(StudentMetricsService $metrics)
    {
        $this->metrics = $metrics;
    }

    /**
     * @param  array<string, mixed>  $scope
     * @return array{student: array<string, mixed>|null, ranked_rows: array<int, array<string, mixed>>, class_label: string, grade_label: string}
     */
    public function build(
        int $teacherId,
        int $classId,
        int $studentId,
        array $scope,
        string $range
    ): array {
        $rangeStart = $this->metrics->resolveRangeStart($range);

        $classMeta = Classes::query()
            ->with('grade:id,name')
            ->find($classId, ['id', 'name', 'grade_id']);

        $classLabel = (string) ($classMeta->name ?? '');
        $gradeLabel = (string) ($classMeta->grade->name ?? '');

        $students = Student::query()
            ->activeInClasses(collect([$classId]))
            ->with(['Class:id,name', 'Grade:id,name'])
            ->get(['id', 'name', 'name_ar', 'photo', 'class_id', 'grade_id']);

        if ($students->isEmpty()) {
            return [
                'student'      => null,
                'ranked_rows'  => [],
                'class_label'  => $classLabel,
                'grade_label'  => $gradeLabel,
            ];
        }

        $subjectIds = $scope['subjects_by_class'][$classId] ?? [];

        $rankedRows = $this->metrics->buildRankedStudentRows(
            $students,
            $subjectIds,
            $teacherId,
            $rangeStart,
            $classLabel,
            $gradeLabel
        );

        $row = collect($rankedRows)->firstWhere('student_id', $studentId);

        if ($row === null) {
            return [
                'student'      => null,
                'ranked_rows'  => $rankedRows,
                'class_label'  => $classLabel,
                'grade_label'  => $gradeLabel,
            ];
        }

        $completed = (int) ($row['score']['completed'] ?? 0);
        $total = (int) ($row['score']['total'] ?? 0);
        $accuracy = $this->loadAccuracyFromQuizResults($studentId);

        return [
            'student' => [
                'student_id'          => (int) $row['student_id'],
                'name'                => (string) $row['name'],
                'photo_url'           => $row['photo_url'],
                'class_label'         => $classLabel,
                'grade_label'         => $gradeLabel,
                'rank'                => (int) $row['rank'],
                'performance_percent' => (float) $row['performance']['percent'],
                // Completion % from assigns_students (via Metrics score alias) — not Accuracy.
                'score_percent'       => (float) $row['score']['percent'],
                // F-044C Accuracy SSOT: average quiz_results.percent only.
                'accuracy_percent'    => $accuracy['percent'],
                'accuracy_available'  => $accuracy['available'],
                'status'              => (string) $row['status'],
                'performance_label'   => (string) $row['performance']['label'],
                'trend'               => (string) $row['performance']['trend'],
                'needs_attention'     => (bool) $row['needs_attention'],
                'overdue_count'       => (int) $row['overdue_count'],
                'completed'           => $completed,
                'total'               => $total,
                'missing'             => max(0, $total - $completed),
            ],
            'ranked_rows' => $rankedRows,
            'class_label' => $classLabel,
            'grade_label' => $gradeLabel,
        ];
    }

    /**
     * Accuracy = Average(quiz_results.percent). Never Completion / computeScore.
     *
     * @return array{percent: float, available: bool}
     */
    private function loadAccuracyFromQuizResults(int $studentId): array
    {
        if ($studentId <= 0 || ! Schema::hasTable('quiz_results')) {
            return ['percent' => 0.0, 'available' => false];
        }

        $query = DB::table('quiz_results')->where('student_id', $studentId);

        if (Schema::hasColumn('quiz_results', 'is_authoritative')) {
            $query->where(function ($inner) {
                $inner->where('is_authoritative', 1)
                    ->orWhereNull('is_authoritative');
            });
        }

        $percents = $query
            ->whereNotNull('percent')
            ->pluck('percent')
            ->map(fn ($value) => (float) $value)
            ->values()
            ->all();

        if ($percents === []) {
            return ['percent' => 0.0, 'available' => false];
        }

        return [
            'percent'   => $this->metrics->computeAveragePercent($percents),
            'available' => true,
        ];
    }
}
