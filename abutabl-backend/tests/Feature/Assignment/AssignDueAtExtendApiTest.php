<?php

namespace Tests\Feature\Assignment;

use App\Models\Student;
use App\Models\User;
use App\Support\Assignment\LearningActivityMap;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * ASSIGN-EXTEND-001 — PUT /api/assigns/{assignId}/due_at (extend deadline only).
 */
class AssignDueAtExtendApiTest extends TestCase
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
    private function seedFixture(?Carbon $dueAt = null): ?array
    {
        if (! Schema::hasTable('assigns') || ! Schema::hasTable('assigns_students')) {
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
                    'name' => 'Extend Due Other Teacher',
                    'username' => 'extend_due_other_'.$suffix,
                    'email' => 'extend-due-other-'.$suffix.'@test.local',
                    'phone' => '0199'.$suffix,
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

        $suffix = 'ed'.substr((string) microtime(true), -6);
        $initialDue = $dueAt ?? now()->addDay();

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Extend Due Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $owner->id,
                'due_at' => $initialDue,
                'possible_xp' => 40,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $activityId = null;
            if (Schema::hasTable('assign_activities')) {
                $activityId = (int) DB::table('assign_activities')->insertGetId([
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
                'created_by' => (int) $owner->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('assigns_students', 'submission_status')) {
                $row['submission_status'] = 'active';
            }

            $assignStudentId = (int) DB::table('assigns_students')->insertGetId($row);

            $materialId = null;
            if (Schema::hasTable('assignment_materials')) {
                $materialId = (int) DB::table('assignment_materials')->insertGetId([
                    'assign_id' => $assignId,
                    'kind' => 'link',
                    'label' => 'Resource',
                    'external_url' => 'https://example.com/resource',
                    'sort_order' => 0,
                    'created_by' => (int) $owner->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $rubricId = null;
            if (Schema::hasTable('assignment_rubrics') && Schema::hasTable('assignment_rubric_criteria')) {
                $rubricId = (int) DB::table('assignment_rubrics')->insertGetId([
                    'assign_id' => $assignId,
                    'title' => 'Rubric',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                DB::table('assignment_rubric_criteria')->insert([
                    'assignment_rubric_id' => $rubricId,
                    'label' => 'Effort',
                    'weight' => 100,
                    'max_points' => 4,
                    'sort_order' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
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
            'assign_id' => $assignId,
            'assign_student_id' => $assignStudentId,
            'activity_id' => $activityId,
            'material_id' => $materialId,
            'rubric_id' => $rubricId,
            'initial_due_at' => Carbon::parse($initialDue)->toDateTimeString(),
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
                if (Schema::hasTable('assignment_rubric_criteria') && ! empty($fx['rubric_id'])) {
                    DB::table('assignment_rubric_criteria')
                        ->where('assignment_rubric_id', $fx['rubric_id'])
                        ->delete();
                }
                if (Schema::hasTable('assignment_rubrics')) {
                    DB::table('assignment_rubrics')->where('assign_id', $assignId)->delete();
                }
                if (Schema::hasTable('assignment_materials')) {
                    DB::table('assignment_materials')->where('assign_id', $assignId)->delete();
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
                        ->where('type', 'assign_deadline_extended')
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

    private function snapshotIntegrity(int $assignId): array
    {
        return [
            'students' => DB::table('assigns_students')->where('assign_id', $assignId)->orderBy('id')->get()->toArray(),
            'activities' => Schema::hasTable('assign_activities')
                ? DB::table('assign_activities')->where('assign_id', $assignId)->orderBy('id')->get()->toArray()
                : [],
            'submissions' => Schema::hasTable('assign_activity_submissions')
                ? DB::table('assign_activity_submissions')->where('assign_id', $assignId)->orderBy('id')->get()->toArray()
                : [],
            'materials' => Schema::hasTable('assignment_materials')
                ? DB::table('assignment_materials')->where('assign_id', $assignId)->orderBy('id')->get()->toArray()
                : [],
            'rubrics' => Schema::hasTable('assignment_rubrics')
                ? DB::table('assignment_rubrics')->where('assign_id', $assignId)->orderBy('id')->get()->toArray()
                : [],
            'title' => (string) DB::table('assigns')->where('id', $assignId)->value('assigned_name'),
        ];
    }

    public function test_owner_can_extend_due_at_to_future_date(): void
    {
        $fx = $this->seedFixture(now()->addDay());
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $newDue = now()->addDays(5)->seconds(0);
        $before = $this->snapshotIntegrity((int) $fx['assign_id']);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/due_at', [
                'due_at' => $newDue->toIso8601String(),
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertNotEmpty($response->json('data.due_at'));

        $stored = Carbon::parse(
            (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('due_at')
        );
        $this->assertTrue($stored->equalTo($newDue) || abs($stored->diffInSeconds($newDue)) < 2);
        $this->assertEquals($before, $this->snapshotIntegrity((int) $fx['assign_id']));
    }

    public function test_owner_can_extend_past_due_assignment(): void
    {
        $fx = $this->seedFixture(now()->subDays(2));
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $newDue = now()->addDays(3)->seconds(0);
        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/due_at', [
                'due_at' => $newDue->toIso8601String(),
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $stored = Carbon::parse(
            (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('due_at')
        );
        $this->assertTrue($stored->greaterThan(now()));
    }

    public function test_rejects_past_due_at(): void
    {
        $fx = $this->seedFixture(now()->addDay());
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $beforeDue = (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('due_at');

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/due_at', [
                'due_at' => now()->subHour()->toIso8601String(),
            ]);

        $response->assertStatus(400)->assertJsonPath('status', false);
        $this->assertSame(
            $beforeDue,
            (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('due_at')
        );
    }

    public function test_allows_future_date_before_current_deadline(): void
    {
        // Product: any future date is allowed (including earlier than current deadline).
        $current = now()->addDays(4)->seconds(0);
        $fx = $this->seedFixture($current);
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $between = now()->addDay()->seconds(0);
        if (! $between->lessThan($current)) {
            $this->markTestSkipped('Clock skew');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/due_at', [
                'due_at' => $between->toIso8601String(),
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $stored = Carbon::parse(
            (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('due_at')
        );
        $this->assertTrue(
            $stored->equalTo($between) || abs($stored->diffInSeconds($between)) < 2
        );
    }

    public function test_rejects_unauthorized_teacher(): void
    {
        $fx = $this->seedFixture(now()->addDay());
        if ($fx === null || empty($fx['other'])) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $beforeDue = (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('due_at');

        $response = $this->withHeaders($this->teacherHeaders($fx['other']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/due_at', [
                'due_at' => now()->addDays(10)->toIso8601String(),
            ]);

        $this->assertTrue(in_array($response->status(), [403, 400], true));
        $this->assertFalse((bool) $response->json('status'));
        $this->assertSame(
            $beforeDue,
            (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('due_at')
        );
    }

    public function test_rejects_missing_due_at(): void
    {
        $fx = $this->seedFixture(now()->addDay());
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/due_at', []);

        $response->assertStatus(400)->assertJsonPath('status', false);
    }

    public function test_extend_allowed_after_student_submitted(): void
    {
        $fx = $this->seedFixture(now()->addDay());
        if ($fx === null || ! Schema::hasColumn('assigns_students', 'submission_status')) {
            $this->markTestSkipped('Fixture unavailable');
        }

        DB::table('assigns_students')->where('id', $fx['assign_student_id'])->update([
            'submission_status' => 'submitted',
        ]);

        $newDue = now()->addDays(7)->seconds(0);
        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/due_at', [
                'due_at' => $newDue->toIso8601String(),
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
    }

    public function test_extend_creates_notification_for_assigned_student(): void
    {
        $fx = $this->seedFixture(now()->addDay());
        if ($fx === null || ! Schema::hasTable('notifications')) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $assignId = (int) $fx['assign_id'];
        $studentId = (int) $fx['student']->id;
        $beforeCount = (int) DB::table('notifications')
            ->where('type', 'assign_deadline_extended')
            ->where('type_id', $assignId)
            ->where('to_user_type', 'student')
            ->where('to_user_id', $studentId)
            ->count();

        $newDue = now()->addDays(6)->seconds(0);
        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$assignId.'/due_at', [
                'due_at' => $newDue->toIso8601String(),
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);

        $rows = DB::table('notifications')
            ->where('type', 'assign_deadline_extended')
            ->where('type_id', $assignId)
            ->where('to_user_type', 'student')
            ->where('to_user_id', $studentId)
            ->orderByDesc('id')
            ->get();

        $this->assertGreaterThan($beforeCount, $rows->count());
        $latest = $rows->first();
        $this->assertNotNull($latest);
        $this->assertSame('/todo/assign/'.$assignId, (string) $latest->url);
        $this->assertStringContainsString('Deadline extended', (string) $latest->title);
        $this->assertSame('teacher', (string) $latest->from_user_type);
        $this->assertSame((int) $fx['owner']->id, (int) $latest->from_user_id);
        $this->assertTrue(in_array((int) $latest->is_read, [0, false], true) || (string) $latest->is_read === '0');
    }

    public function test_rejected_extend_does_not_create_notification(): void
    {
        $fx = $this->seedFixture(now()->addDay());
        if ($fx === null || ! Schema::hasTable('notifications')) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $assignId = (int) $fx['assign_id'];
        $beforeCount = (int) DB::table('notifications')
            ->where('type', 'assign_deadline_extended')
            ->where('type_id', $assignId)
            ->count();

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$assignId.'/due_at', [
                'due_at' => now()->subHour()->toIso8601String(),
            ]);

        $response->assertStatus(400)->assertJsonPath('status', false);
        $afterCount = (int) DB::table('notifications')
            ->where('type', 'assign_deadline_extended')
            ->where('type_id', $assignId)
            ->count();
        $this->assertSame($beforeCount, $afterCount);
    }
}
