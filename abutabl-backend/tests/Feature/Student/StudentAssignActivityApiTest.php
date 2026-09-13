<?php

namespace Tests\Feature\Student;

use App\Models\AssignActivity;
use App\Models\AssignActivitySubmission;
use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * Phase 1 — Student multi-activity assignment detail routes + ownership.
 */
class StudentAssignActivityApiTest extends TestCase
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
    private function seedFixture(): ?array
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasTable('assign_activities')
            || ! Schema::hasTable('assign_activity_submissions')
            || ! Schema::hasTable('students')
        ) {
            return null;
        }

        $owner = Student::query()->orderBy('id')->first();
        $outsider = Student::query()->where('id', '!=', $owner?->id)->orderBy('id')->first();
        if (! $owner || ! $outsider) {
            return null;
        }

        $subject = Schema::hasTable('subjects')
            ? DB::table('subjects')->orderBy('id')->first()
            : null;
        $subjectId = $subject ? (int) $subject->id : 1;
        $expectedSubjectName = null;
        if ($subject) {
            $en = trim((string) ($subject->name ?? ''));
            $ar = trim((string) ($subject->name_ar ?? ''));
            $expectedSubjectName = $en !== '' ? $en : ($ar !== '' ? $ar : null);
        }

        $suffix = 'sa'.substr((string) microtime(true), -6);

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Phase1 Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => (int) ($owner->grade_id ?? 1),
                'subject_id' => $subjectId,
                'status' => 1,
                'created_by' => 1,
                'due_at' => now()->addDays(3),
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
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $activityId = (int) DB::table('assign_activities')->insertGetId([
                'assign_id' => $assignId,
                'activity_type' => LearningActivityMap::TYPE_WORKSHEET,
                'activity_id' => 1,
                'source_table' => LearningActivityMap::SOURCE_TABLE[LearningActivityMap::TYPE_WORKSHEET] ?? 'work_sheets',
                'grading_mode' => LearningActivityMap::GRADING_MANUAL,
                'title_snapshot' => 'Worksheet Unit 1',
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $ebookId = (int) DB::table('assign_activities')->insertGetId([
                'assign_id' => $assignId,
                'activity_type' => LearningActivityMap::TYPE_EBOOK,
                'activity_id' => 1,
                'source_table' => LearningActivityMap::SOURCE_TABLE[LearningActivityMap::TYPE_EBOOK] ?? 'lessons_contents',
                'grading_mode' => LearningActivityMap::GRADING_AUTOMATIC_COMPLETENESS,
                'title_snapshot' => 'Book Unit 1',
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (Throwable $e) {
            return null;
        }

        $this->fixture = [
            'owner' => $owner,
            'outsider' => $outsider,
            'assign_id' => $assignId,
            'assign_student_id' => $assignStudentId,
            'worksheet_activity_id' => $activityId,
            'ebook_activity_id' => $ebookId,
            'subject_id' => $subjectId,
            'expected_subject_name' => $expectedSubjectName,
            'assigned_name' => "Phase1 Assign {$suffix}",
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
            // ignore cleanup
        }
        $this->fixture = null;
    }

    public function test_owner_can_load_assignment_detail_with_progress(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Assignment fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['owner']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $data = $response->json('data');
        $this->assertSame((int) $fx['assign_id'], (int) $data['assign_id']);
        $this->assertArrayHasKey('progress', $data);
        $this->assertSame(2, (int) $data['progress']['tasks_total']);
        $this->assertSame(0, (int) $data['progress']['tasks_completed']);
        $this->assertSame('homework_hero', $data['lifecycle']['mode']);
        $this->assertSame('assigns_students', $data['lifecycle']['source']);
        $this->assertArrayHasKey('is_overdue', $data['lifecycle']);
        $this->assertArrayHasKey('can_submit', $data['lifecycle']);
        $this->assertArrayHasKey('status', $data['lifecycle']);
        $this->assertFalse($data['rubric_available']);
        $this->assertNull($data['rubric'] ?? null);
        $this->assertNull($data['assignment_xp']);
        $this->assertFalse($data['redo_allowed']);
        $this->assertFalse($data['lifecycle']['redo_allowed']);
        $this->assertSame([], $data['materials']);
        $this->assertSame([], $data['my_work']);
        $this->assertCount(2, $data['activities']);
        $this->assertArrayHasKey('subject_name', $data);
        $this->assertSame((int) $fx['subject_id'], (int) $data['subject_id']);
        if ($fx['expected_subject_name'] !== null) {
            $this->assertSame($fx['expected_subject_name'], $data['subject_name']);
            $this->assertNotSame($fx['assigned_name'], $data['subject_name']);
        }
        // Worksheet has no Lesson/Unit FK → omit context even if ebook could resolve.
        $this->assertArrayHasKey('context_label', $data);
        $this->assertNull($data['context_label']);
        $this->assertNull($data['lesson_name'] ?? null);
        $this->assertNull($data['unit_name'] ?? null);
    }

    public function test_outsider_cannot_load_assignment_detail(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Assignment fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['outsider']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $this->assertContains($response->status(), [200, 400, 403, 404]);
        $this->assertFalse((bool) $response->json('status'));
    }

    public function test_outsider_cannot_submit_activity(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Assignment fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['outsider']))
            ->postJson('/api/student/assign-activities/'.$fx['worksheet_activity_id'].'/submit', []);

        $this->assertContains($response->status(), [200, 400, 403, 404]);
        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('assign_student_not_found', (string) $response->json('msg'));

        $this->assertSame(
            0,
            AssignActivitySubmission::query()
                ->where('assign_activity_id', $fx['worksheet_activity_id'])
                ->where('student_id', $fx['outsider']->id)
                ->count()
        );
    }

    public function test_completed_submission_cannot_be_silently_overwritten(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Assignment fixtures unavailable.');
        }

        $headers = $this->studentHeaders($fx['owner']);
        $first = $this->withHeaders($headers)
            ->postJson('/api/student/assign-activities/'.$fx['ebook_activity_id'].'/submit', []);
        $first->assertStatus(200)->assertJsonPath('status', true);

        $second = $this->withHeaders($headers)
            ->postJson('/api/student/assign-activities/'.$fx['ebook_activity_id'].'/submit', []);
        $this->assertContains($second->status(), [200, 400]);
        $this->assertFalse((bool) $second->json('status'));
        $this->assertStringContainsString('submission_locked', (string) $second->json('msg'));
    }

    /**
     * Regression: missing Lesson/Unit (worksheet has no FK) must not force can_submit=false.
     */
    public function test_worksheet_only_complete_allows_submit_without_context_label(): void
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasTable('assign_activities')
            || ! Schema::hasTable('assign_activity_submissions')
            || ! Schema::hasColumn('assigns_students', 'submission_status')
            || ! Schema::hasTable('subjects')
        ) {
            $this->markTestSkipped('Assignment fixtures unavailable.');
        }

        $owner = Student::query()->orderBy('id')->first();
        $subject = DB::table('subjects')->orderBy('id')->first();
        if (! $owner || ! $subject) {
            $this->markTestSkipped('Need student + subject.');
        }

        $suffix = 'ws'.substr((string) microtime(true), -6);
        $assignId = null;

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Worksheet Only {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => (int) ($owner->grade_id ?? 1),
                'subject_id' => (int) $subject->id,
                'status' => 1,
                'created_by' => 1,
                'due_at' => now()->addDays(2),
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

            $activityId = (int) DB::table('assign_activities')->insertGetId([
                'assign_id' => $assignId,
                'activity_type' => LearningActivityMap::TYPE_WORKSHEET,
                'activity_id' => 1,
                'source_table' => 'work_sheets',
                'grading_mode' => LearningActivityMap::GRADING_MANUAL,
                'title_snapshot' => 'Worksheet Only Snapshot',
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('assign_activity_submissions')->insert([
                'assign_id' => $assignId,
                'assign_activity_id' => $activityId,
                'assign_student_id' => $assignStudentId,
                'student_id' => $owner->id,
                'status' => AssignActivitySubmission::STATUS_SUBMITTED,
                'completeness' => 100,
                'percent' => 100,
                'submitted_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $response = $this->withHeaders($this->studentHeaders($owner))
                ->getJson('/api/student/assigns/'.$assignId.'/learning_activities');

            $response->assertStatus(200)->assertJsonPath('status', true);
            $data = $response->json('data');

            $this->assertNull($data['context_label']);
            $this->assertNull($data['lesson_name'] ?? null);
            $this->assertSame('homework_hero', $data['lifecycle']['mode']);
            $this->assertSame('active', $data['lifecycle']['status']);
            $this->assertTrue($data['lifecycle']['can_submit']);
            $this->assertNotSame($data['title'] ?? '', $data['subject_name']);
        } finally {
            if ($assignId) {
                try {
                    DB::table('assign_activity_submissions')->where('assign_id', $assignId)->delete();
                    DB::table('assign_activities')->where('assign_id', $assignId)->delete();
                    DB::table('assigns_students')->where('assign_id', $assignId)->delete();
                    DB::table('assigns')->where('id', $assignId)->delete();
                } catch (Throwable $e) {
                    // ignore
                }
            }
        }
    }
}