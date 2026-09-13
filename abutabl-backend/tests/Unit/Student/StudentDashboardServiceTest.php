<?php

namespace Tests\Unit\Student;

use App\Models\AssignsStudents;
use App\Models\Student;
use App\Services\Student\StudentDashboardService;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

class StudentDashboardServiceTest extends TestCase
{
    /** @var array<int, int> */
    private $cleanupAssignIds = [];

    protected function tearDown(): void
    {
        foreach ($this->cleanupAssignIds as $assignId) {
            try {
                DB::table('assign_activity_submissions')->where('assign_id', $assignId)->delete();
                DB::table('assign_activities')->where('assign_id', $assignId)->delete();
                DB::table('assigns_students')->where('assign_id', $assignId)->delete();
                DB::table('assigns')->where('id', $assignId)->delete();
            } catch (Throwable $e) {
                // ignore cleanup
            }
        }
        $this->cleanupAssignIds = [];
        parent::tearDown();
    }

    public function test_build_assignments_tabs_structure(): void
    {
        /** @var StudentDashboardService $service */
        $service = $this->app->make(StudentDashboardService::class);

        $method = new \ReflectionMethod(StudentDashboardService::class, 'buildAssignments');
        $method->setAccessible(true);

        $result = $method->invoke($service, -999999);

        $this->assertSame(0, $result['new_count']);
        $this->assertArrayHasKey('todo', $result['tabs']);
        $this->assertArrayHasKey('past_due', $result['tabs']);
        $this->assertArrayHasKey('completed', $result['tabs']);
    }

    public function test_build_assignments_completed_uses_parent_submission_ssot_not_opened_at(): void
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasColumn('assigns_students', 'submission_status')
        ) {
            $this->markTestSkipped('Assignment tables unavailable.');
        }

        $student = Student::query()->orderBy('id')->first();
        if (! $student) {
            $this->markTestSkipped('No student seed data.');
        }

        $suffix = 'dash'.substr((string) microtime(true), -6);
        $schoolId = (int) ($student->school_id ?? 1);

        // Classification: COMPLETE = graded only; submitted/waiting stays in TO DO.
        $cases = [
            // 1) active + no parent submission + future → To Do
            'active_future' => [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'due_at' => now()->addDays(3),
                'opened_at' => null,
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'expect' => 'todo',
            ],
            // 2) active + no parent submission + overdue → Past Due
            'active_overdue' => [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'due_at' => now()->subDays(2),
                'opened_at' => null,
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'expect' => 'past_due',
            ],
            // 3) submitted + overdue → To Do (waiting; not PAST DUE / not COMPLETE)
            'submitted_overdue' => [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'due_at' => now()->subDays(2),
                'opened_at' => null,
                'submission_status' => AssignsStudents::SUBMISSION_SUBMITTED,
                'submitted_at' => now()->subDay(),
                'graded_at' => null,
                'expect' => 'todo',
            ],
            // 4) graded + overdue → Completed
            'graded_overdue' => [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'due_at' => now()->subDays(2),
                'opened_at' => null,
                'submission_status' => AssignsStudents::SUBMISSION_GRADED,
                'submitted_at' => now()->subDays(2),
                'graded_at' => now()->subDay(),
                'expect' => 'completed',
            ],
            // 5) active + opened_at only + overdue → Past Due (opened_at ≠ Completed)
            'active_opened_overdue' => [
                'type' => 'subjects',
                'due_at' => now()->subDays(5),
                'opened_at' => now()->subDays(1),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'expect' => 'past_due',
            ],
            // 6) active + opened_at only + future → To Do
            'active_opened_future' => [
                'type' => 'subjects',
                'due_at' => now()->addDays(4),
                'opened_at' => now()->subDay(),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'expect' => 'todo',
            ],
            // 7) submitted + opened_at → To Do (waiting on teacher)
            'submitted_with_opened_at' => [
                'type' => 'subjects',
                'due_at' => now()->addDays(2),
                'opened_at' => now()->subDays(2),
                'submission_status' => AssignsStudents::SUBMISSION_SUBMITTED,
                'submitted_at' => now()->subDay(),
                'graded_at' => null,
                'expect' => 'todo',
            ],
            // 8) active + no due_at → To Do
            'active_no_due' => [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'due_at' => null,
                'opened_at' => null,
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'expect' => 'todo',
            ],
            // 9) REDO-shaped: was submitted, now active again + future due → To Do
            'redo_active_future' => [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'due_at' => now()->addDays(1),
                'opened_at' => now()->subDay(),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'expect' => 'todo',
            ],
            // 10) REDO-shaped: active again + overdue → Past Due
            'redo_active_overdue' => [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'due_at' => now()->subDays(1),
                'opened_at' => now()->subDays(3),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'expect' => 'past_due',
            ],
            // 11) submitted + future due (waiting on teacher) → To Do
            'submitted_future_waiting' => [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'due_at' => now()->addDays(5),
                'opened_at' => now()->subDay(),
                'submission_status' => AssignsStudents::SUBMISSION_SUBMITTED,
                'submitted_at' => now()->subHour(),
                'graded_at' => null,
                'expect' => 'todo',
            ],
        ];

        $this->assertCount(11, $cases);

        $expectedByAssignId = [];

        foreach ($cases as $key => $case) {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => $case['type'],
                'type_id' => $case['type'] === LearningActivityMap::ASSIGN_TYPE ? 0 : 1,
                'assigned_name' => "Dash classify {$key} {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => $schoolId,
                'grade_id' => (int) ($student->grade_id ?? 1),
                'subject_id' => 1,
                'status' => 1,
                'created_by' => 1,
                'due_at' => $case['due_at'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->cleanupAssignIds[] = $assignId;

            DB::table('assigns_students')->insert([
                'assign_id' => $assignId,
                'student_id' => $student->id,
                'school_id' => $schoolId,
                'status' => 1,
                'type' => $case['type'],
                'type_id' => $case['type'] === LearningActivityMap::ASSIGN_TYPE ? 0 : 1,
                'opened_at' => $case['opened_at'],
                'submission_status' => $case['submission_status'],
                'submitted_at' => $case['submitted_at'],
                'graded_at' => $case['graded_at'],
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $expectedByAssignId[$assignId] = $case['expect'];
        }

        /** @var StudentDashboardService $service */
        $service = $this->app->make(StudentDashboardService::class);
        $method = new \ReflectionMethod(StudentDashboardService::class, 'buildAssignments');
        $method->setAccessible(true);
        $result = $method->invoke($service, (int) $student->id);

        $actualByAssignId = [];
        foreach (['todo', 'past_due', 'completed'] as $tab) {
            foreach ($result['tabs'][$tab] as $item) {
                $id = (int) ($item['assign_id'] ?? 0);
                if (isset($expectedByAssignId[$id])) {
                    $actualByAssignId[$id] = $tab;
                }
            }
        }

        foreach ($expectedByAssignId as $assignId => $expectTab) {
            $this->assertSame(
                $expectTab,
                $actualByAssignId[$assignId] ?? null,
                "assign {$assignId} should be in {$expectTab}"
            );
        }
    }

    public function test_build_includes_quests_payload_shape(): void
    {
        /** @var StudentDashboardService $service */
        $service = $this->app->make(StudentDashboardService::class);

        $student = \App\Models\Student::query()->first();
        if (! $student) {
            $this->markTestSkipped('No student seed data.');
        }

        $payload = $service->build($student->id, 'week');

        $this->assertArrayHasKey('quests', $payload);
        $this->assertArrayHasKey('available', $payload['quests']);
        $this->assertArrayHasKey('items', $payload['quests']);
        $this->assertArrayHasKey('limit', $payload['quests']);
        $this->assertIsArray($payload['quests']['items']);
        $this->assertSame(2, $payload['quests']['limit']);
        $this->assertLessThanOrEqual(2, count($payload['quests']['items']));

        $this->assertArrayHasKey('recommended_activities', $payload);
        $this->assertArrayHasKey('items', $payload['recommended_activities']);
        $this->assertIsArray($payload['recommended_activities']['items']);

        $this->assertArrayHasKey('recent_activities', $payload);
        $this->assertArrayHasKey('items', $payload['recent_activities']);
        $this->assertArrayHasKey('has_more', $payload['recent_activities']);
    }

    public function test_rankings_items_include_weekly_xp_without_changing_rank_order(): void
    {
        /** @var StudentDashboardService $service */
        $service = $this->app->make(StudentDashboardService::class);

        $student = \App\Models\Student::query()->first();
        if (! $student) {
            $this->markTestSkipped('No student seed data.');
        }

        $payload = $service->build($student->id, 'week');
        $rankings = $payload['rankings'] ?? [];

        if (($rankings['available'] ?? false) !== true || empty($rankings['items'])) {
            $this->markTestSkipped('No ranking data for seeded student.');
        }

        $previousRank = 0;
        foreach ($rankings['items'] as $item) {
            $this->assertArrayHasKey('weekly_xp', $item);
            $this->assertIsInt($item['weekly_xp']);
            $this->assertGreaterThanOrEqual(0, $item['weekly_xp']);
            $this->assertArrayHasKey('rank', $item);
            $this->assertArrayHasKey('score_percent', $item);
            $this->assertGreaterThan($previousRank, (int) $item['rank']);
            $previousRank = (int) $item['rank'];
        }

        $this->assertLessThanOrEqual(3, count($rankings['items']));
    }

    public function test_build_assignments_exposes_authoritative_list_actions(): void
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasTable('assign_activities')
            || ! Schema::hasTable('assign_activity_submissions')
            || ! Schema::hasColumn('assigns_students', 'submission_status')
        ) {
            $this->markTestSkipped('Assignment tables unavailable.');
        }

        $student = Student::query()->orderBy('id')->first();
        if (! $student) {
            $this->markTestSkipped('No student seed data.');
        }

        $suffix = 'act'.substr((string) microtime(true), -6);
        $schoolId = (int) ($student->school_id ?? 1);
        $studentId = (int) $student->id;

        $cases = [
            // 1) TO DO incomplete
            'todo_incomplete' => [
                'due_at' => now()->addDays(2),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'complete' => false,
                'expect_tab' => 'todo',
                'expect_can_submit' => false,
                'expect_redo' => false,
            ],
            // 2) TO DO fully complete
            'todo_complete' => [
                'due_at' => now()->addDays(2),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'complete' => true,
                'expect_tab' => 'todo',
                'expect_can_submit' => true,
                'expect_redo' => false,
            ],
            // 3) PAST DUE incomplete
            'past_due_incomplete' => [
                'due_at' => now()->subDays(2),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'complete' => false,
                'expect_tab' => 'past_due',
                'expect_can_submit' => false,
                'expect_redo' => false,
            ],
            // 4) PAST DUE fully complete → late Submit
            'past_due_complete' => [
                'due_at' => now()->subDays(2),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'complete' => true,
                'expect_tab' => 'past_due',
                'expect_can_submit' => true,
                'expect_redo' => false,
            ],
            // 6) TO DO submitted + before deadline → waiting + redo_allowed
            'todo_submitted_redo' => [
                'due_at' => now()->addDays(3),
                'submission_status' => AssignsStudents::SUBMISSION_SUBMITTED,
                'submitted_at' => now()->subHour(),
                'graded_at' => null,
                'complete' => true,
                'expect_tab' => 'todo',
                'expect_can_submit' => false,
                'expect_redo' => true,
            ],
            // 7) TO DO submitted + after deadline → waiting, no REDO
            'todo_submitted_past_deadline' => [
                'due_at' => now()->subDay(),
                'submission_status' => AssignsStudents::SUBMISSION_SUBMITTED,
                'submitted_at' => now()->subDays(2),
                'graded_at' => null,
                'complete' => true,
                'expect_tab' => 'todo',
                'expect_can_submit' => false,
                'expect_redo' => false,
            ],
            // 8) COMPLETE graded → no REDO
            'completed_graded' => [
                'due_at' => now()->addDays(2),
                'submission_status' => AssignsStudents::SUBMISSION_GRADED,
                'submitted_at' => now()->subDay(),
                'graded_at' => now()->subHour(),
                'complete' => true,
                'expect_tab' => 'completed',
                'expect_can_submit' => false,
                'expect_redo' => false,
            ],
        ];

        $expectedByAssignId = [];

        foreach ($cases as $key => $case) {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Dash action {$key} {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => $schoolId,
                'grade_id' => (int) ($student->grade_id ?? 1),
                'subject_id' => 1,
                'status' => 1,
                'created_by' => 1,
                'due_at' => $case['due_at'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->cleanupAssignIds[] = $assignId;

            $assignStudentId = (int) DB::table('assigns_students')->insertGetId([
                'assign_id' => $assignId,
                'student_id' => $studentId,
                'school_id' => $schoolId,
                'status' => 1,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'opened_at' => now()->subDay(),
                'submission_status' => $case['submission_status'],
                'submitted_at' => $case['submitted_at'],
                'graded_at' => $case['graded_at'],
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $activityId = (int) DB::table('assign_activities')->insertGetId([
                'assign_id' => $assignId,
                'activity_type' => LearningActivityMap::TYPE_EBOOK,
                'activity_id' => 1,
                'source_table' => 'lessons_contents',
                'grading_mode' => LearningActivityMap::GRADING_AUTOMATIC_COMPLETENESS,
                'title_snapshot' => 'Book',
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($case['complete']) {
                DB::table('assign_activity_submissions')->insert([
                    'assign_id' => $assignId,
                    'assign_activity_id' => $activityId,
                    'assign_student_id' => $assignStudentId,
                    'student_id' => $studentId,
                    'status' => \App\Models\AssignActivitySubmission::STATUS_COMPLETED,
                    'completeness' => 100,
                    'percent' => 100,
                    'submitted_at' => now(),
                    'graded_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $expectedByAssignId[$assignId] = $case;
        }

        /** @var StudentDashboardService $service */
        $service = $this->app->make(StudentDashboardService::class);
        $method = new \ReflectionMethod(StudentDashboardService::class, 'buildAssignments');
        $method->setAccessible(true);
        $result = $method->invoke($service, $studentId);

        $found = [];
        foreach (['todo', 'past_due', 'completed'] as $tab) {
            foreach ($result['tabs'][$tab] as $item) {
                $id = (int) ($item['assign_id'] ?? 0);
                if (! isset($expectedByAssignId[$id])) {
                    continue;
                }
                $found[$id] = array_merge($item, ['_tab' => $tab]);
            }
        }

        foreach ($expectedByAssignId as $assignId => $case) {
            $this->assertArrayHasKey($assignId, $found, "missing assign {$assignId}");
            $item = $found[$assignId];
            $this->assertSame($case['expect_tab'], $item['_tab'], "tab for {$assignId}");
            $this->assertArrayHasKey('can_submit', $item);
            $this->assertArrayHasKey('redo_allowed', $item);
            $this->assertArrayHasKey('submission_status', $item);
            $this->assertSame(
                $case['expect_can_submit'],
                (bool) $item['can_submit'],
                "can_submit for {$assignId}"
            );
            $this->assertSame(
                $case['expect_redo'],
                (bool) $item['redo_allowed'],
                "redo_allowed for {$assignId}"
            );
            // 11) never both
            $this->assertFalse(
                (bool) $item['can_submit'] && (bool) $item['redo_allowed'],
                "both actions for {$assignId}"
            );
        }
    }
}
