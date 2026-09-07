<?php

namespace Tests\Feature\Student;

use App\Models\AssignActivitySubmission;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * Phase 2 — Parent Assignment SUBMIT + lifecycle.
 */
class StudentAssignParentSubmitApiTest extends TestCase
{
    /** @var array<string, mixed>|null */
    private $fixture;

    protected function tearDown(): void
    {
        $this->destroyFixture();
        parent::tearDown();
    }

    private function apiSecret(): string
    {
        return (string) env('API_SECRET', 'OASzRok654E0AJ20KH');
    }

    /**
     * @return array<string, string>
     */
    private function studentHeaders(Student $student): array
    {
        auth()->setDefaultDriver('user-api');
        $token = Auth::guard('user-api')->login($student);

        return [
            'Authorization' => 'Bearer '.$token,
            'Authorizations' => 'Bearer '.$token,
            'apiSecret' => $this->apiSecret(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function seedFixture(bool $completeActivities = true): ?array
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasTable('assign_activities')
            || ! Schema::hasColumn('assigns_students', 'submission_status')
        ) {
            return null;
        }

        $owner = Student::query()->orderBy('id')->first();
        $outsider = Student::query()->where('id', '!=', $owner?->id)->orderBy('id')->first();
        if (! $owner || ! $outsider) {
            return null;
        }

        $suffix = 'ps'.substr((string) microtime(true), -6);

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Phase2 Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => (int) ($owner->grade_id ?? 1),
                'subject_id' => 1,
                'status' => 1,
                'created_by' => 1,
                'due_at' => now()->subDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $assignStudentId = (int) DB::table('assigns_students')->insertGetId([
                'assign_id' => $assignId,
                'student_id' => $owner->id,
                'school_id' => (int) ($owner->school_id ?? 1),
                'status' => 1,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'submission_status' => 'active',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $ebookId = (int) DB::table('assign_activities')->insertGetId([
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

            if ($completeActivities) {
                DB::table('assign_activity_submissions')->insert([
                    'assign_id' => $assignId,
                    'assign_activity_id' => $ebookId,
                    'assign_student_id' => $assignStudentId,
                    'student_id' => $owner->id,
                    'status' => AssignActivitySubmission::STATUS_COMPLETED,
                    'completeness' => 100,
                    'percent' => 100,
                    'submitted_at' => now(),
                    'graded_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (Throwable $e) {
            return null;
        }

        $this->fixture = [
            'owner' => $owner,
            'outsider' => $outsider,
            'assign_id' => $assignId,
            'assign_student_id' => $assignStudentId,
            'ebook_activity_id' => $ebookId,
        ];

        return $this->fixture;
    }

    private function destroyFixture(): void
    {
        if ($this->fixture === null) {
            return;
        }
        $fx = $this->fixture;
        try {
            if (! empty($fx['assign_id'])) {
                DB::table('assign_activity_submissions')->where('assign_id', $fx['assign_id'])->delete();
                DB::table('assign_activities')->where('assign_id', $fx['assign_id'])->delete();
                DB::table('assigns_students')->where('assign_id', $fx['assign_id'])->delete();
                DB::table('assigns')->where('id', $fx['assign_id'])->delete();
            }
        } catch (Throwable $e) {
            // ignore
        }
        $this->fixture = null;
    }

    public function test_unauthenticated_cannot_submit_assignment(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => $this->apiSecret(),
        ])->postJson('/api/student/assigns/1/submit');

        $response->assertStatus(401);
    }

    public function test_owner_can_submit_when_activities_complete(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Parent submit fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['owner']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $data = $response->json('data');
        $this->assertSame('waiting_on_teacher', $data['lifecycle']['mode']);
        $this->assertSame('submitted', $data['lifecycle']['status']);
        $this->assertNotNull($data['lifecycle']['submitted_at']);
        $this->assertTrue($data['lifecycle']['is_late']);
        $this->assertFalse($data['lifecycle']['can_submit']);
        $this->assertSame('assigns_students', $data['lifecycle']['source']);

        $row = AssignsStudents::query()->find($fx['assign_student_id']);
        $this->assertSame('submitted', $row->submission_status);
        $this->assertNotNull($row->submitted_at);
    }

    public function test_incomplete_activities_block_parent_submit(): void
    {
        $fx = $this->seedFixture(false);
        if ($fx === null) {
            $this->markTestSkipped('Parent submit fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['owner']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit');

        $this->assertContains($response->status(), [200, 400]);
        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('activities_incomplete', (string) $response->json('msg'));
    }

    public function test_outsider_cannot_submit_assignment(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Parent submit fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['outsider']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit');

        $this->assertContains($response->status(), [200, 400, 403, 404]);
        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('assign_student_not_found', (string) $response->json('msg'));
    }

    public function test_duplicate_submit_rejected(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Parent submit fixtures unavailable.');
        }

        $headers = $this->studentHeaders($fx['owner']);
        $this->withHeaders($headers)->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit')
            ->assertJsonPath('status', true);

        $second = $this->withHeaders($headers)
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit');
        $this->assertContains($second->status(), [200, 400]);
        $this->assertFalse((bool) $second->json('status'));
        $this->assertStringContainsString('assignment_already_submitted', (string) $second->json('msg'));

        $this->assertSame(
            1,
            AssignsStudents::query()
                ->where('assign_id', $fx['assign_id'])
                ->where('student_id', $fx['owner']->id)
                ->where('submission_status', 'submitted')
                ->count()
        );
    }

    public function test_detail_shows_homework_hero_when_active_even_if_overdue(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Parent submit fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['owner']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertSame('homework_hero', $data['lifecycle']['mode']);
        $this->assertSame('active', $data['lifecycle']['status']);
        $this->assertTrue($data['lifecycle']['is_overdue']);
        $this->assertTrue($data['lifecycle']['can_submit']);
        $this->assertNull($data['lifecycle']['submitted_at']);
    }

    public function test_graded_parent_cannot_be_resubmitted(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Parent submit fixtures unavailable.');
        }

        AssignsStudents::query()->where('id', $fx['assign_student_id'])->update([
            'submission_status' => 'graded',
            'submitted_at' => now()->subHour(),
            'graded_at' => now(),
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['owner']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit');

        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('assignment_graded_locked', (string) $response->json('msg'));
    }
}
