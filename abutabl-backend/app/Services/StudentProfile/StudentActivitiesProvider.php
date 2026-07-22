<?php

namespace App\Services\StudentProfile;

use App\Models\AssignsStudents;
use App\Services\StudentMetricsService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudentActivitiesProvider
{
    private const PER_PAGE = 10;

    /** @var StudentMetricsService */
    private $metrics;

    public function __construct(StudentMetricsService $metrics)
    {
        $this->metrics = $metrics;
    }

    /**
     * @return array<string, mixed>
     */
    public function build(
        int $teacherId,
        int $studentId,
        string $range,
        int $assignmentsPage = 1,
        int $quizzesPage = 1
    ): array {
        $rangeStart = $this->metrics->resolveRangeStart($range);

        return [
            'assignments' => $this->buildPagedGroup(
                $teacherId,
                $studentId,
                $rangeStart,
                'assignment',
                max(1, $assignmentsPage)
            ),
            'quizzes' => $this->attachQuizzesAverage(
                $teacherId,
                $studentId,
                $rangeStart,
                $this->buildPagedGroup(
                    $teacherId,
                    $studentId,
                    $rangeStart,
                    'quiz',
                    max(1, $quizzesPage)
                )
            ),
        ];
    }

    /**
     * Average across scored quizzes in range (SSOT) — not page slice, not FE.
     *
     * @param  array{items: array<int, array<string, mixed>>, pagination: array<string, mixed>}  $group
     * @return array<string, mixed>
     */
    private function attachQuizzesAverage(
        int $teacherId,
        int $studentId,
        Carbon $rangeStart,
        array $group
    ): array {
        $rows = $this->baseQuery($teacherId, $studentId, $rangeStart, 'quiz')
            ->with(['assign:id,type,assigned_name,due_at,created_at'])
            ->get(['id', 'assign_id', 'student_id', 'opened_at', 'created_at']);

        $assignIds = $rows->pluck('assign_id')->map(fn ($id) => (int) $id)->unique()->values()->all();
        $scoreByAssign = $this->quizScorePercentByAssign($studentId, $assignIds);

        $scores = [];

        foreach ($rows as $row) {
            $assignId = (int) $row->assign_id;
            if (! array_key_exists($assignId, $scoreByAssign)) {
                continue;
            }
            $scores[] = (float) $scoreByAssign[$assignId];
        }

        if ($scores === []) {
            $group['average_percent'] = null;
            $group['average_available'] = false;

            return $group;
        }

        // Average Score SSOT: Average(quiz_results.percent) via Metrics average helper only.
        $group['average_percent'] = $this->metrics->computeAveragePercent($scores);
        $group['average_available'] = true;

        return $group;
    }

    /**
     * DB-level pagination — query count stays fixed regardless of total rows.
     *
     * @return array{items: array<int, array<string, mixed>>, pagination: array<string, mixed>}
     */
    private function buildPagedGroup(
        int $teacherId,
        int $studentId,
        Carbon $rangeStart,
        string $group,
        int $page
    ): array {
        $base = $this->baseQuery($teacherId, $studentId, $rangeStart, $group);

        $total = (clone $base)->count();
        $lastPage = max(1, (int) ceil($total / self::PER_PAGE));
        $page = min($page, $lastPage);

        $rows = (clone $base)
            ->with(['assign:id,type,assigned_name,due_at,created_at'])
            ->orderByDesc('created_at')
            ->forPage($page, self::PER_PAGE)
            ->get(['id', 'assign_id', 'student_id', 'opened_at', 'created_at']);

        $scoreByAssign = [];
        if ($group === 'quiz') {
            $assignIds = $rows->pluck('assign_id')->map(fn ($id) => (int) $id)->unique()->values()->all();
            $scoreByAssign = $this->quizScorePercentByAssign($studentId, $assignIds);
        }

        $items = [];

        foreach ($rows as $row) {
            $mapped = $this->mapRow($row, $scoreByAssign);

            if ($mapped !== null) {
                $items[] = $mapped;
            }
        }

        return [
            'items'      => $items,
            'pagination' => [
                'current_page' => $page,
                'per_page'     => self::PER_PAGE,
                'total'        => $total,
                'last_page'    => $lastPage,
                'has_more'     => $page < $lastPage,
            ],
        ];
    }

    private function baseQuery(
        int $teacherId,
        int $studentId,
        Carbon $rangeStart,
        string $group
    ): Builder {
        return AssignsStudents::query()
            ->where('student_id', $studentId)
            ->where('status', 1)
            ->whereHas('assign', function ($query) use ($teacherId, $rangeStart, $group) {
                $query
                    ->createdByTeacher($teacherId)
                    ->where('created_at', '>=', $rangeStart);

                if ($group === 'quiz') {
                    $query->where('type', 'quizes');
                } else {
                    $query->where(function ($inner) {
                        $inner
                            ->whereNull('type')
                            ->orWhere('type', '!=', 'quizes');
                    });
                }
            });
    }

    /**
     * @param  array<int, float>  $scoreByAssign  Quiz Score SSOT: quiz_results.percent keyed by assign_id
     * @return array<string, mixed>|null
     */
    private function mapRow(AssignsStudents $row, array $scoreByAssign = []): ?array
    {
        $assign = $row->assign;

        if ($assign === null) {
            return null;
        }

        $assignedAt = $row->created_at ? Carbon::parse($row->created_at) : null;
        $status = $this->resolveStatus($row);
        $isQuiz = $assign->type === 'quizes';
        $assignId = (int) $row->assign_id;
        $quizScore = $isQuiz && array_key_exists($assignId, $scoreByAssign)
            ? (float) $scoreByAssign[$assignId]
            : null;

        return [
            'id'           => (int) $row->id,
            'assign_id'    => $assignId,
            'title'        => (string) ($assign->assigned_name ?: $assign->type),
            'type'         => $isQuiz ? 'quiz' : 'assignment',
            'status'       => $status,
            'status_badge' => $this->statusBadge($status),
            'score'        => $quizScore,
            'max_score'    => $quizScore !== null ? 100.0 : null,
            'score_label'  => $quizScore !== null ? round($quizScore, 1).'%' : null,
            'due_at'       => $assign->due_at
                ? Carbon::parse($assign->due_at)->toIso8601String()
                : null,
            'assigned_at'  => $assignedAt
                ? $assignedAt->toIso8601String()
                : null,
            'opened_at'    => $row->opened_at
                ? Carbon::parse($row->opened_at)->toIso8601String()
                : null,
        ];
    }

    /**
     * Latest authoritative quiz_results.percent per assign for one student.
     *
     * @param  array<int, int>  $assignIds
     * @return array<int, float>
     */
    private function quizScorePercentByAssign(int $studentId, array $assignIds): array
    {
        if (
            $studentId <= 0
            || $assignIds === []
            || ! Schema::hasTable('quiz_attempts')
            || ! Schema::hasTable('quiz_results')
        ) {
            return [];
        }

        $attempts = DB::table('quiz_attempts')
            ->where('student_id', $studentId)
            ->whereIn('assign_id', $assignIds)
            ->get(['id', 'assign_id']);

        if ($attempts->isEmpty()) {
            return [];
        }

        $attemptIds = $attempts->pluck('id')->map(fn ($id) => (int) $id)->all();
        $assignByAttempt = [];
        foreach ($attempts as $attempt) {
            $assignByAttempt[(int) $attempt->id] = (int) $attempt->assign_id;
        }

        $resultsQuery = DB::table('quiz_results')
            ->where('student_id', $studentId)
            ->whereIn('attempt_id', $attemptIds)
            ->whereNotNull('percent');

        if (Schema::hasColumn('quiz_results', 'is_authoritative')) {
            $resultsQuery->where(function ($inner) {
                $inner->where('is_authoritative', 1)
                    ->orWhereNull('is_authoritative');
            });
        }

        if (Schema::hasColumn('quiz_results', 'finalized_at')) {
            $resultsQuery->orderByDesc('finalized_at');
        }
        $resultsQuery->orderByDesc('id');

        $out = [];
        foreach ($resultsQuery->get(['attempt_id', 'percent']) as $result) {
            $attemptId = (int) $result->attempt_id;
            $assignId = $assignByAttempt[$attemptId] ?? 0;
            if ($assignId <= 0 || isset($out[$assignId])) {
                continue;
            }
            $out[$assignId] = round((float) $result->percent, 2);
        }

        return $out;
    }

    private function statusBadge(string $status): string
    {
        if ($status === 'completed') {
            return 'submitted';
        }

        if ($status === 'late') {
            return 'missing';
        }

        return 'pending';
    }

    private function resolveStatus(AssignsStudents $row): string
    {
        if ($row->opened_at !== null) {
            return 'completed';
        }

        $dueAt = $row->assign?->due_at;

        if ($this->metrics->isOverdue(false, $dueAt !== null ? Carbon::parse($dueAt) : null)) {
            return 'late';
        }

        return 'pending';
    }
}
