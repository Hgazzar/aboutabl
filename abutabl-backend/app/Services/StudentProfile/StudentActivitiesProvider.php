<?php

namespace App\Services\StudentProfile;

use App\Models\AssignsStudents;
use App\Services\StudentMetricsService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

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

        $scores = [];

        foreach ($rows as $row) {
            $mapped = $this->mapRow($row);

            if ($mapped !== null && $mapped['score'] !== null) {
                $scores[] = (float) $mapped['score'];
            }
        }

        if ($scores === []) {
            $group['average_percent'] = null;
            $group['average_available'] = false;

            return $group;
        }

        $group['average_percent'] = round(array_sum($scores) / count($scores), 1);
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

        $items = [];

        foreach ($rows as $row) {
            $mapped = $this->mapRow($row);

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
     * @return array<string, mixed>|null
     */
    private function mapRow(AssignsStudents $row): ?array
    {
        $assign = $row->assign;

        if ($assign === null) {
            return null;
        }

        $assignedAt = $row->created_at ? Carbon::parse($row->created_at) : null;
        $status = $this->resolveStatus($row);

        return [
            'id'           => (int) $row->id,
            'assign_id'    => (int) $row->assign_id,
            'title'        => (string) ($assign->assigned_name ?: $assign->type),
            'type'         => $assign->type === 'quizes' ? 'quiz' : 'assignment',
            'status'       => $status,
            'status_badge' => $this->statusBadge($status),
            'score'        => null,
            'max_score'    => null,
            'score_label'  => null,
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

        if ($dueAt !== null && Carbon::parse($dueAt)->lt(now())) {
            return 'late';
        }

        return 'pending';
    }
}
