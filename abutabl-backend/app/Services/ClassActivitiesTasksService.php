<?php

namespace App\Services;

use App\Models\AssignsStudents;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ClassActivitiesTasksService
{
    private const FILTERS = ['all', 'pending', 'late', 'completed'];

    private const RANGES = ['week', 'month', 'term'];

    private const LIST_LIMIT = 50;

    /** @var TeacherDashboardService */
    private $dashboardService;

    public function __construct(TeacherDashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * @return array<string, mixed>
     */
    public function buildList(
        int $teacherId,
        array $schoolIds,
        int $classId,
        string $filter = 'all',
        string $range = 'week'
    ): array {
        $filter = $this->normalizeFilter($filter);
        $range = $this->normalizeRange($range);
        $rangeStart = $this->resolveRangeStart($range);

        $scope = $this->dashboardService->resolveClassAccess($teacherId, $schoolIds, $classId);

        if ($scope === null) {
            throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
        }

        $classStudentIds = Student::query()
            ->where('class_id', $classId)
            ->where('status', '1')
            ->pluck('id')
            ->map(fn ($id) => (int) $id);

        if ($classStudentIds->isEmpty()) {
            return $this->emptyPayload($classId, $filter, $range);
        }

        $submissions = AssignsStudents::query()
            ->whereIn('student_id', $classStudentIds->all())
            ->where('status', 1)
            ->whereHas('assign', function ($query) use ($teacherId, $rangeStart) {
                $query
                    ->createdByTeacher($teacherId)
                    ->where('created_at', '>=', $rangeStart);
            })
            ->with([
                'assign:id,type,assigned_name,due_at,created_at',
                'student:id,name,name_ar,class_id',
            ])
            ->orderByDesc('created_at')
            ->get();

        $items = $submissions
            ->map(fn (AssignsStudents $row) => $this->mapSubmissionRow($row))
            ->filter()
            ->values();

        $tabCounts = $this->buildTabCounts($items);

        if ($filter !== 'all') {
            $items = $items
                ->filter(fn (array $item) => $item['status'] === $filter)
                ->values();
        }

        return [
            'source'     => 'assigns_students',
            'range'      => $range,
            'filter'     => $filter,
            'class_id'   => $classId,
            'tab_counts' => $tabCounts,
            'items'      => $items->take(self::LIST_LIMIT)->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapSubmissionRow(AssignsStudents $row): ?array
    {
        $assign = $row->assign;
        $student = $row->student;

        if ($assign === null || $student === null) {
            return null;
        }

        $status = $this->resolveStatus($row);
        $assignedAt = $row->created_at ? Carbon::parse($row->created_at) : null;

        return [
            'id'            => (int) $row->id,
            'assign_id'     => (int) $row->assign_id,
            'student_id'    => (int) $row->student_id,
            'title'         => (string) ($assign->assigned_name ?: $assign->type),
            'context'       => $this->localizedStudentName($student),
            'type'          => $assign->type === 'quizes' ? 'quiz' : 'assignment',
            'status'        => $status,
            'due_at'        => $assign->due_at
                ? Carbon::parse($assign->due_at)->toIso8601String()
                : null,
            'assigned_at'   => $assignedAt
                ? Carbon::parse($assignedAt)->toIso8601String()
                : null,
            'relative_time' => $assignedAt
                ? ucfirst($assignedAt->locale('en')->diffForHumans())
                : null,
            'opened_at'     => $row->opened_at
                ? Carbon::parse($row->opened_at)->toIso8601String()
                : null,
        ];
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

    /**
     * @param  Collection<int, array<string, mixed>>  $items
     * @return array<string, int>
     */
    private function buildTabCounts(Collection $items): array
    {
        $counts = [
            'all'       => $items->count(),
            'pending'   => 0,
            'late'      => 0,
            'completed' => 0,
        ];

        foreach ($items as $item) {
            $status = $item['status'] ?? '';

            if (isset($counts[$status])) {
                $counts[$status]++;
            }
        }

        return $counts;
    }

    private function localizedStudentName(Student $student): string
    {
        if (app()->getLocale() === 'ar' && ! empty($student->name_ar)) {
            return (string) $student->name_ar;
        }

        return (string) ($student->name ?? '');
    }

    private function normalizeFilter(string $filter): string
    {
        return in_array($filter, self::FILTERS, true) ? $filter : 'all';
    }

    private function normalizeRange(string $range): string
    {
        return in_array($range, self::RANGES, true) ? $range : 'week';
    }

    private function resolveRangeStart(string $range): Carbon
    {
        if ($range === 'month') {
            return now()->subDays(30)->startOfDay();
        }

        if ($range === 'term') {
            return now()->subMonths(4)->startOfDay();
        }

        return now()->subDays(7)->startOfDay();
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(int $classId, string $filter, string $range): array
    {
        return [
            'source'     => 'assigns_students',
            'range'      => $range,
            'filter'     => $filter,
            'class_id'   => $classId,
            'tab_counts' => [
                'all'       => 0,
                'pending'   => 0,
                'late'      => 0,
                'completed' => 0,
            ],
            'items'      => [],
        ];
    }
}
