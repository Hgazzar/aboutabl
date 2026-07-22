<?php

namespace Tests\Unit\Assignment;

use App\Models\Student;
use App\Models\User;
use App\Services\Assignment\AssignmentService;
use App\Services\ClassActivitiesTasksService;
use App\Services\StudentMetricsService;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * F-041E.2 — AssignmentService::listForClass read API behaviour.
 */
class AssignmentListForClassTest extends TestCase
{
    public function test_list_for_class_method_exists_on_assignment_service_only(): void
    {
        $this->assertTrue(method_exists(AssignmentService::class, 'listForClass'));
        $this->assertFalse(class_exists('App\\Services\\Assignment\\AssignmentReadService'));
        $this->assertFalse(class_exists('App\\Services\\Assignment\\AssignmentStatisticsService'));
        $this->assertFileDoesNotExist(app_path('Services/Assignment/AssignmentReadService.php'));
    }

    public function test_activities_tasks_service_source_untouched(): void
    {
        $source = file_get_contents(app_path('Services/ClassActivitiesTasksService.php'));
        $this->assertStringContainsString('LIST_LIMIT = 50', $source);
        $this->assertStringContainsString("'source'     => 'assigns_students'", $source);
        $this->assertStringNotContainsString('listForClass', $source);
    }

    public function test_completion_percentage_uses_student_metrics_service(): void
    {
        $metrics = app(StudentMetricsService::class);
        $completion = $metrics->computeCompletion(['completed' => 3, 'total' => 4]);

        $this->assertSame(75.0, $completion['percent']);
        $this->assertTrue($completion['has_data']);
    }

    public function test_empty_class_returns_empty_paginated_payload(): void
    {
        $teacher = User::where('id', 179)->first();
        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $emptyClassId = 999999;
        $exists = Student::query()
            ->where('class_id', $emptyClassId)
            ->where('status', '1')
            ->exists();

        if ($exists) {
            $this->markTestSkipped('Sentinel empty class id unexpectedly has students.');
        }

        try {
            app(AssignmentService::class)->listForClass((int) $teacher->id, [], $emptyClassId, [
                'range' => 'all',
            ]);
            $this->fail('Expected InvalidArgumentException for inaccessible class.');
        } catch (\InvalidArgumentException $ex) {
            $this->assertStringContainsString('not assigned', $ex->getMessage());
        }
    }

    public function test_list_for_class_card_shape_pagination_and_status(): void
    {
        $teacher = User::where('id', 179)->first();
        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $classId = 21;
        $createdAssignIds = [];
        $createdSubmissionIds = [];

        try {
            $studentIds = Student::query()
                ->where('class_id', $classId)
                ->where('status', '1')
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->take(3)
                ->values()
                ->all();

            if (count($studentIds) < 2) {
                $this->markTestSkipped('Class 21 needs at least 2 active students.');
            }

            $template = DB::table('assigns')->where('created_by', 179)->first();
            $now = now();

            // Done assignment — all seeded students opened.
            $doneId = $this->seedAssign(
                $template,
                'F041E2 Done Assignment',
                $now->copy()->addDays(5),
                $now->copy()->subDay(),
                $createdAssignIds
            );
            foreach ($studentIds as $studentId) {
                $createdSubmissionIds[] = $this->seedSubmission(
                    $doneId,
                    $studentId,
                    $template,
                    $now->copy()->subHours(2)
                );
            }

            // Overdue assignment — none opened, past due.
            $overdueId = $this->seedAssign(
                $template,
                'F041E2 Overdue Assignment',
                $now->copy()->subDays(2),
                $now->copy()->subDays(3),
                $createdAssignIds
            );
            foreach ($studentIds as $studentId) {
                $createdSubmissionIds[] = $this->seedSubmission(
                    $overdueId,
                    $studentId,
                    $template,
                    null
                );
            }

            // Active partial — one completed, due in future.
            $activeId = $this->seedAssign(
                $template,
                'F041E2 Active Searchable Unique',
                $now->copy()->addDays(7),
                $now->copy()->subHours(1),
                $createdAssignIds
            );
            $createdSubmissionIds[] = $this->seedSubmission(
                $activeId,
                $studentIds[0],
                $template,
                $now->copy()->subMinutes(30)
            );
            $createdSubmissionIds[] = $this->seedSubmission(
                $activeId,
                $studentIds[1],
                $template,
                null
            );

            $service = app(AssignmentService::class);

            $all = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'    => 'all',
                'sort'     => 'newest',
                'per_page' => 50,
                'page'     => 1,
            ]);

            $this->assertSame('assigns', $all['source']);
            $this->assertSame($classId, $all['class_id']);
            $this->assertArrayHasKey('data', $all);
            $this->assertArrayHasKey('current_page', $all);
            $this->assertArrayHasKey('last_page', $all);
            $this->assertArrayHasKey('per_page', $all);
            $this->assertArrayHasKey('total', $all);
            $this->assertGreaterThanOrEqual(3, $all['total']);

            $byId = collect($all['data'])->keyBy('id');

            $this->assertTrue($byId->has($doneId));
            $doneCard = $byId->get($doneId);
            $this->assertSame('done', $doneCard['status']);
            $this->assertSame(100.0, $doneCard['completion_percentage']);
            $this->assertFalse($doneCard['has_missing_students']);
            $this->assertSame(0, $doneCard['overdue_students']);
            $this->assertSame(count($studentIds), $doneCard['target_students']);
            $this->assertSame(count($studentIds), $doneCard['completed_students']);

            $this->assertTrue($byId->has($overdueId));
            $overdueCard = $byId->get($overdueId);
            $this->assertSame('overdue', $overdueCard['status']);
            $this->assertTrue($overdueCard['has_overdue_students']);
            $this->assertSame(count($studentIds), $overdueCard['overdue_students']);
            $this->assertSame(0.0, $overdueCard['completion_percentage']);

            $this->assertTrue($byId->has($activeId));
            $activeCard = $byId->get($activeId);
            $this->assertSame('active', $activeCard['status']);
            $this->assertSame(1, $activeCard['completed_students']);
            $this->assertSame(1, $activeCard['pending_students']);
            $this->assertSame(50.0, $activeCard['completion_percentage']);
            $this->assertTrue($activeCard['has_missing_students']);

            foreach (['id', 'title', 'subtitle', 'assignment_type', 'status', 'due_at', 'created_at',
                'created_by', 'subject', 'module', 'target_students', 'completed_students',
                'pending_students', 'overdue_students', 'completion_percentage',
                'has_missing_students', 'has_overdue_students', 'standards_count', ] as $field) {
                $this->assertArrayHasKey($field, $activeCard);
            }

            // Search
            $search = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'  => 'all',
                'search' => 'Active Searchable Unique',
            ]);
            $this->assertGreaterThanOrEqual(1, $search['total']);
            $this->assertTrue(
                collect($search['data'])->contains(fn ($row) => (int) $row['id'] === $activeId)
            );

            // Status filters
            $doneOnly = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'  => 'all',
                'status' => 'done',
            ]);
            $this->assertTrue(collect($doneOnly['data'])->every(fn ($row) => $row['status'] === 'done'));
            $this->assertTrue(collect($doneOnly['data'])->contains('id', $doneId));

            $overdueOnly = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'  => 'all',
                'status' => 'overdue',
            ]);
            $this->assertTrue(collect($overdueOnly['data'])->every(fn ($row) => $row['status'] === 'overdue'));

            $activeOnly = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'  => 'all',
                'status' => 'active',
            ]);
            $this->assertTrue(collect($activeOnly['data'])->every(fn ($row) => $row['status'] === 'active'));

            // Sorting newest — seeded active is newest among the three
            $newest = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'    => 'all',
                'sort'     => 'newest',
                'search'   => 'F041E2',
                'per_page' => 10,
            ]);
            $ids = collect($newest['data'])->pluck('id')->all();
            $this->assertContains($activeId, $ids);

            $oldest = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'    => 'all',
                'sort'     => 'oldest',
                'search'   => 'F041E2',
                'per_page' => 10,
            ]);
            $this->assertNotSame(
                collect($newest['data'])->pluck('id')->all(),
                collect($oldest['data'])->pluck('id')->all()
            );

            $byCompletion = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'    => 'all',
                'sort'     => 'completion',
                'search'   => 'F041E2',
                'per_page' => 10,
            ]);
            $completionValues = collect($byCompletion['data'])->pluck('completion_percentage')->all();
            $sorted = $completionValues;
            rsort($sorted, SORT_NUMERIC);
            $this->assertSame($sorted, $completionValues);

            // Pagination
            $page1 = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'    => 'all',
                'search'   => 'F041E2',
                'per_page' => 1,
                'page'     => 1,
            ]);
            $page2 = $service->listForClass((int) $teacher->id, [], $classId, [
                'range'    => 'all',
                'search'   => 'F041E2',
                'per_page' => 1,
                'page'     => 2,
            ]);
            $this->assertSame(1, $page1['per_page']);
            $this->assertSame(1, count($page1['data']));
            $this->assertGreaterThanOrEqual(2, $page1['last_page']);
            $this->assertNotSame($page1['data'][0]['id'] ?? null, $page2['data'][0]['id'] ?? null);

            // Range aliases
            $weekAlias = $service->listForClass((int) $teacher->id, [], $classId, [
                'range' => 'this_week',
            ]);
            $this->assertSame('week', $weekAlias['filters']['range']);
        } finally {
            if ($createdSubmissionIds !== []) {
                DB::table('assigns_students')->whereIn('id', $createdSubmissionIds)->delete();
            }
            if ($createdAssignIds !== []) {
                DB::table('assigns')->whereIn('id', $createdAssignIds)->delete();
            }
        }
    }

    public function test_large_dataset_stays_bounded_and_paginated(): void
    {
        $teacher = User::where('id', 179)->first();
        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $classId = 21;
        $student = Student::query()
            ->where('class_id', $classId)
            ->where('status', '1')
            ->first();

        if (! $student) {
            $this->markTestSkipped('Class 21 has no students.');
        }

        $template = DB::table('assigns')->where('created_by', 179)->first();
        $createdAssignIds = [];
        $createdSubmissionIds = [];
        $now = now();

        try {
            for ($i = 0; $i < 35; $i++) {
                $assignId = $this->seedAssign(
                    $template,
                    'F041E2 Large Dataset #'.$i,
                    $now->copy()->addDays(10),
                    $now->copy()->subMinutes(35 - $i),
                    $createdAssignIds
                );
                $createdSubmissionIds[] = $this->seedSubmission(
                    $assignId,
                    (int) $student->id,
                    $template,
                    null
                );
            }

            DB::flushQueryLog();
            DB::enableQueryLog();

            $page = app(AssignmentService::class)->listForClass((int) $teacher->id, [], $classId, [
                'range'    => 'all',
                'search'   => 'F041E2 Large Dataset',
                'per_page' => 10,
                'page'     => 2,
            ]);

            $queryCount = count(DB::getQueryLog());
            DB::disableQueryLog();

            $this->assertSame(10, count($page['data']));
            $this->assertSame(2, $page['current_page']);
            $this->assertGreaterThanOrEqual(35, $page['total']);
            $this->assertLessThanOrEqual(25, $queryCount, 'Expected bounded query count (no N+1).');
        } finally {
            DB::disableQueryLog();
            if ($createdSubmissionIds !== []) {
                DB::table('assigns_students')->whereIn('id', $createdSubmissionIds)->delete();
            }
            if ($createdAssignIds !== []) {
                DB::table('assigns')->whereIn('id', $createdAssignIds)->delete();
            }
        }
    }

    public function test_activities_tasks_contract_unchanged_after_list_for_class(): void
    {
        $report = app(ClassActivitiesTasksService::class)->buildList(179, [], 21, 'all', 'term');

        $this->assertSame('assigns_students', $report['source']);
        $this->assertArrayHasKey('tab_counts', $report);
        $this->assertArrayHasKey('items', $report);
        $this->assertArrayNotHasKey('completion_percentage', $report);
    }

    /**
     * @param  object|null  $template
     * @param  array<int, int>  $createdAssignIds
     */
    private function seedAssign(
        $template,
        string $name,
        $dueAt,
        $createdAt,
        array &$createdAssignIds
    ): int {
        $assignId = (int) DB::table('assigns')->insertGetId([
            'type'          => 'units',
            'type_id'       => 1,
            'school_id'     => $template->school_id ?? 1,
            'status'        => 1,
            'created_by'    => 179,
            'assigned_name' => $name,
            'assigned_path' => null,
            'grade_id'      => $template->grade_id ?? null,
            'subject_id'    => $template->subject_id ?? 10,
            'due_at'        => $dueAt,
            'created_at'    => $createdAt,
            'updated_at'    => $createdAt,
        ]);

        $createdAssignIds[] = $assignId;

        return $assignId;
    }

    /**
     * @param  object|null  $template
     */
    private function seedSubmission(
        int $assignId,
        int $studentId,
        $template,
        $openedAt
    ): int {
        return (int) DB::table('assigns_students')->insertGetId([
            'assign_id'  => $assignId,
            'student_id' => $studentId,
            'school_id'  => $template->school_id ?? 1,
            'status'     => 1,
            'type'       => 'units',
            'type_id'    => 1,
            'opened_at'  => $openedAt,
            'created_by' => 179,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
