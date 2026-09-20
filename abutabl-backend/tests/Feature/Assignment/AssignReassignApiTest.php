<?php

namespace Tests\Feature\Assignment;

use App\Models\Student;
use App\Models\User;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * ASSIGN-REASSIGN-001 — POST /api/assigns/{assignId}/reassign
 */
class AssignReassignApiTest extends TestCase
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
    private function teacherHeaders(User $teacher): array
    {
        auth()->setDefaultDriver('admin-api');
        $token = Auth::guard('admin-api')->login($teacher);

        return [
            'Authorization' => 'Bearer '.$token,
            'Authorizations' => 'Bearer '.$token,
            'apiSecret' => $this->apiSecret(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function seedFixture(string $submissionStatus = 'active'): ?array
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasColumn('assigns_students', 'submission_status')
        ) {
            return null;
        }

        $owner = User::query()->where('id', 179)->first()
            ?? User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        $student = Student::query()->orderBy('id')->first();
        if (! $owner || ! $student) {
            return null;
        }

        $other = User::query()
            ->where('type', '!=', 'admin')
            ->where('id', '!=', $owner->id)
            ->orderBy('id')
            ->first();

        $createdOtherId = null;
        if (! $other) {
            try {
                $suffix = substr((string) microtime(true), -6);
                $createdOtherId = (int) DB::table('users')->insertGetId([
                    'name' => 'Reassign Other Teacher',
                    'username' => 'reassign_other_'.$suffix,
                    'email' => 'reassign-other-'.$suffix.'@test.local',
                    'phone' => '0177'.$suffix,
                    'password' => bcrypt('secret'),
                    'type' => 'teacher',
                    'status' => '1',
                    'verify' => '1',
                    'school_id' => (int) ($owner->school_id ?? 1),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $other = User::query()->find($createdOtherId);
            } catch (Throwable $e) {
                return null;
            }
        }

        $suffix = 'ra'.substr((string) microtime(true), -6);

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Reassign Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $owner->id,
                'due_at' => now()->addDays(3),
                'possible_xp' => 40,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (Schema::hasTable('assign_activities')) {
                DB::table('assign_activities')->insert([
                    'assign_id' => $assignId,
                    'activity_type' => 'ebook',
                    'activity_id' => 1,
                    'source_table' => 'lessons_contents',
                    'grading_mode' => 'automatic_completeness',
                    'title_snapshot' => 'Sample ebook',
                    'sort_order' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $row = [
                'assign_id' => $assignId,
                'student_id' => $student->id,
                'school_id' => (int) ($owner->school_id ?? 1),
                'status' => 1,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'submission_status' => $submissionStatus,
                'created_by' => (int) $owner->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if ($submissionStatus === 'submitted' && Schema::hasColumn('assigns_students', 'submitted_at')) {
                $row['submitted_at'] = now()->subHour();
            }
            if ($submissionStatus === 'graded' && Schema::hasColumn('assigns_students', 'graded_at')) {
                $row['submitted_at'] = now()->subHours(2);
                $row['graded_at'] = now()->subHour();
            }

            $assignStudentId = (int) DB::table('assigns_students')->insertGetId($row);

            $secondStudent = Student::query()
                ->where('id', '!=', $student->id)
                ->orderBy('id')
                ->first();
            $assignStudentId2 = null;
            if ($secondStudent) {
                $row2 = [
                    'assign_id' => $assignId,
                    'student_id' => $secondStudent->id,
                    'school_id' => (int) ($owner->school_id ?? 1),
                    'status' => 1,
                    'type' => LearningActivityMap::ASSIGN_TYPE,
                    'type_id' => 0,
                    'submission_status' => 'active',
                    'created_by' => (int) $owner->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $assignStudentId2 = (int) DB::table('assigns_students')->insertGetId($row2);
            }
        } catch (Throwable $e) {
            if ($createdOtherId) {
                DB::table('users')->where('id', $createdOtherId)->delete();
            }

            return null;
        }

        $this->fixture = [
            'owner' => $owner,
            'other' => $other,
            'created_other_id' => $createdOtherId,
            'student' => $student,
            'student_2' => $secondStudent ?? null,
            'assign_id' => $assignId,
            'assign_student_id' => $assignStudentId,
            'assign_student_id_2' => $assignStudentId2,
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
                $assignId = (int) $fx['assign_id'];
                if (Schema::hasTable('assignment_grades')) {
                    $gradeIds = DB::table('assignment_grades')->where('assign_id', $assignId)->pluck('id');
                    if ($gradeIds->isNotEmpty() && Schema::hasTable('assignment_grade_criteria')) {
                        DB::table('assignment_grade_criteria')
                            ->whereIn('assignment_grade_id', $gradeIds)
                            ->delete();
                    }
                    DB::table('assignment_grades')->where('assign_id', $assignId)->delete();
                }
                if (Schema::hasTable('assign_activity_submissions')) {
                    DB::table('assign_activity_submissions')->where('assign_id', $assignId)->delete();
                }
                if (Schema::hasTable('assign_activities')) {
                    DB::table('assign_activities')->where('assign_id', $assignId)->delete();
                }
                DB::table('assigns_students')->where('assign_id', $assignId)->delete();
                DB::table('assigns')->where('id', $assignId)->delete();
                if (Schema::hasTable('notifications')) {
                    DB::table('notifications')
                        ->where('type', 'assign_reassigned')
                        ->where('type_id', $assignId)
                        ->delete();
                }
            }
            if (! empty($fx['created_other_id'])) {
                DB::table('users')->where('id', $fx['created_other_id'])->delete();
            }
        } catch (Throwable $e) {
            // ignore
        }
        $this->fixture = null;
    }

    public function test_owner_can_reassign_active_missing_student_and_notify(): void
    {
        $fx = $this->seedFixture('active');
        if ($fx === null || ! Schema::hasTable('notifications')) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $studentId = (int) $fx['student']->id;
        $assignId = (int) $fx['assign_id'];
        $before = (int) DB::table('notifications')
            ->where('type', 'assign_reassigned')
            ->where('type_id', $assignId)
            ->where('to_user_id', $studentId)
            ->count();

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$assignId.'/reassign', [
                'student_ids' => [$studentId],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.assign_id', $assignId);
        $this->assertContains($studentId, $response->json('data.reassigned_student_ids'));
        $this->assertSame(
            'active',
            (string) DB::table('assigns_students')->where('id', $fx['assign_student_id'])->value('submission_status')
        );

        $after = (int) DB::table('notifications')
            ->where('type', 'assign_reassigned')
            ->where('type_id', $assignId)
            ->where('to_user_id', $studentId)
            ->count();
        $this->assertGreaterThan($before, $after);

        $latest = DB::table('notifications')
            ->where('type', 'assign_reassigned')
            ->where('type_id', $assignId)
            ->where('to_user_id', $studentId)
            ->orderByDesc('id')
            ->first();
        $this->assertNotNull($latest);
        $this->assertSame('/todo/assign/'.$assignId, (string) $latest->url);
        $this->assertSame('student', (string) $latest->to_user_type);
        $this->assertGreaterThanOrEqual(1, (int) $response->json('data.notified'));
    }

    public function test_bulk_reassign_creates_one_notification_per_student(): void
    {
        $fx = $this->seedFixture('active');
        if ($fx === null || empty($fx['student_2']) || ! Schema::hasTable('notifications')) {
            $this->markTestSkipped('Need two students + notifications table');
        }

        $assignId = (int) $fx['assign_id'];
        $id1 = (int) $fx['student']->id;
        $id2 = (int) $fx['student_2']->id;

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$assignId.'/reassign', [
                'student_ids' => [$id1, $id2],
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertEqualsCanonicalizing(
            [$id1, $id2],
            array_map('intval', $response->json('data.reassigned_student_ids') ?? [])
        );
        $this->assertSame(2, (int) $response->json('data.notified'));

        foreach ([$id1, $id2] as $studentId) {
            $row = DB::table('notifications')
                ->where('type', 'assign_reassigned')
                ->where('type_id', $assignId)
                ->where('to_user_type', 'student')
                ->where('to_user_id', $studentId)
                ->orderByDesc('id')
                ->first();
            $this->assertNotNull($row, "Missing notification for student {$studentId}");
            $this->assertSame('/todo/assign/'.$assignId, (string) $row->url);
            $this->assertStringContainsString('Assignment reassigned', (string) $row->title);
            $this->assertSame((int) $fx['owner']->id, (int) $row->from_user_id);
        }

        $total = (int) DB::table('notifications')
            ->where('type', 'assign_reassigned')
            ->where('type_id', $assignId)
            ->whereIn('to_user_id', [$id1, $id2])
            ->count();
        $this->assertSame(2, $total);
    }

    public function test_owner_can_reassign_submitted_student_to_active(): void
    {
        $fx = $this->seedFixture('submitted');
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $studentId = (int) $fx['student']->id;
        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/reassign', [
                'student_ids' => [$studentId],
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $row = DB::table('assigns_students')->where('id', $fx['assign_student_id'])->first();
        $this->assertSame('active', (string) $row->submission_status);
        if (Schema::hasColumn('assigns_students', 'submitted_at')) {
            $this->assertNull($row->submitted_at);
        }
    }

    public function test_rejects_reassign_when_student_graded(): void
    {
        $fx = $this->seedFixture('graded');
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $beforeStatus = (string) DB::table('assigns_students')
            ->where('id', $fx['assign_student_id'])
            ->value('submission_status');

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/reassign', [
                'student_ids' => [(int) $fx['student']->id],
            ]);

        $response->assertStatus(409)->assertJsonPath('status', false);
        $this->assertSame(
            $beforeStatus,
            (string) DB::table('assigns_students')->where('id', $fx['assign_student_id'])->value('submission_status')
        );
    }

    public function test_rejects_unauthorized_teacher(): void
    {
        $fx = $this->seedFixture('active');
        if ($fx === null || empty($fx['other'])) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['other']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/reassign', [
                'student_ids' => [(int) $fx['student']->id],
            ]);

        $this->assertTrue(in_array($response->status(), [403, 400], true));
        $this->assertFalse((bool) $response->json('status'));
    }

    public function test_rejects_empty_student_ids(): void
    {
        $fx = $this->seedFixture('active');
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/reassign', [
                'student_ids' => [],
            ]);

        $response->assertStatus(400)->assertJsonPath('status', false);
    }

    public function test_rejects_student_not_on_roster(): void
    {
        $fx = $this->seedFixture('active');
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/reassign', [
                'student_ids' => [999999991],
            ]);

        $response->assertStatus(400)->assertJsonPath('status', false);
    }

    public function test_rejected_reassign_does_not_create_notification(): void
    {
        $fx = $this->seedFixture('graded');
        if ($fx === null || ! Schema::hasTable('notifications')) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $assignId = (int) $fx['assign_id'];
        $before = (int) DB::table('notifications')
            ->where('type', 'assign_reassigned')
            ->where('type_id', $assignId)
            ->count();

        $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$assignId.'/reassign', [
                'student_ids' => [(int) $fx['student']->id],
            ])
            ->assertStatus(409);

        $after = (int) DB::table('notifications')
            ->where('type', 'assign_reassigned')
            ->where('type_id', $assignId)
            ->count();
        $this->assertSame($before, $after);
    }
}
