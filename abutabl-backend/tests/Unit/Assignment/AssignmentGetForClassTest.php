<?php

namespace Tests\Unit\Assignment;

use App\Models\User;
use App\Services\Assignment\AssignmentService;
use Tests\TestCase;

/**
 * F-043 — AssignmentService::getForClass (Screen #6 details read).
 */
class AssignmentGetForClassTest extends TestCase
{
    public function test_get_for_class_lives_on_assignment_service_only(): void
    {
        $this->assertTrue(method_exists(AssignmentService::class, 'getForClass'));
        $this->assertFalse(class_exists('App\\Services\\Assignment\\AssignmentReadService'));
        $this->assertFileDoesNotExist(app_path('Services/Assignment/AssignmentReadService.php'));
    }

    public function test_get_for_class_rejects_inaccessible_class(): void
    {
        $teacher = User::where('id', 179)->first();
        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        try {
            app(AssignmentService::class)->getForClass((int) $teacher->id, [], 999999, 1);
            $this->fail('Expected InvalidArgumentException for inaccessible class.');
        } catch (\InvalidArgumentException $ex) {
            $this->assertStringContainsString('not assigned', $ex->getMessage());
        }
    }

    public function test_get_for_class_returns_detail_shape_when_assign_exists(): void
    {
        $teacher = User::where('id', 179)->first();
        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $classId = 21;
        $list = app(AssignmentService::class)->listForClass((int) $teacher->id, [], $classId, [
            'range' => 'all',
            'per_page' => 1,
        ]);

        $first = $list['data'][0] ?? null;
        if ($first === null) {
            $this->markTestSkipped('No assignments for class 21 to assert detail shape.');
        }

        $payload = app(AssignmentService::class)->getForClass(
            (int) $teacher->id,
            [],
            $classId,
            (int) $first['id']
        );

        $this->assertSame($classId, $payload['class_id']);
        $this->assertSame('assigns', $payload['source']);
        $this->assertArrayHasKey('assignment', $payload);
        $this->assertArrayHasKey('statistics', $payload);
        $this->assertArrayHasKey('students', $payload);
        $this->assertArrayHasKey('materials', $payload);
        $this->assertIsArray($payload['students']);

        $assignment = $payload['assignment'];
        foreach ([
            'id', 'title', 'subject', 'module', 'module_type',
            'assignment_type', 'due_date', 'created_at', 'status',
        ] as $key) {
            $this->assertArrayHasKey($key, $assignment);
        }

        $stats = $payload['statistics'];
        foreach ([
            'target_students', 'completed_students', 'pending_students',
            'overdue_students', 'completion_percentage', 'average_score',
        ] as $key) {
            $this->assertArrayHasKey($key, $stats);
        }

        if ($assignment['assignment_type'] !== 'quiz'
            && ($assignment['module'] ?? '') !== 'learning_activities'
        ) {
            $this->assertNull($stats['average_score']);
        }

        foreach ($payload['students'] as $row) {
            foreach ([
                'student_id', 'name', 'status', 'opened_at', 'score_percent',
                'tasks_total', 'tasks_completed', 'completion_percent', 'accuracy_percent',
            ] as $key) {
                $this->assertArrayHasKey($key, $row);
            }
            $this->assertContains($row['status'], ['submitted', 'late', 'missing', 'graded']);
            if ($assignment['assignment_type'] !== 'quiz'
                && ($assignment['module'] ?? '') !== 'learning_activities'
            ) {
                $this->assertNull($row['score_percent']);
                $this->assertNull($row['accuracy_percent']);
            }
            if (($assignment['module'] ?? '') === 'learning_activities') {
                $this->assertArrayHasKey('submission_status', $row);
                $this->assertArrayHasKey('submitted_at', $row);
                $this->assertArrayHasKey('graded_at', $row);
                $this->assertGreaterThanOrEqual(0, (int) $row['tasks_total']);
                $this->assertGreaterThanOrEqual(0, (int) $row['tasks_completed']);
                $this->assertLessThanOrEqual(
                    (int) $row['tasks_total'],
                    (int) $row['tasks_completed']
                );
            } else {
                $this->assertSame(1, $row['tasks_total']);
            }
        }

        $this->assertSame([], $payload['materials']['files']);
        $this->assertSame([], $payload['materials']['voice_recordings']);
        $this->assertSame([], $payload['materials']['links']);
    }
}
