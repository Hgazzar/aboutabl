<?php

namespace Tests\Feature\Student;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Models\User;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * Phase 3A — possible_xp + Assignment Rubric SSOT + lock.
 */
class TeacherAssignRubricApiTest extends TestCase
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
    private function seedFixture(): ?array
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasColumn('assigns', 'possible_xp')
            || ! Schema::hasTable('assignment_rubrics')
            || ! Schema::hasTable('assignment_rubric_criteria')
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
                    'name' => 'Rubric Other Teacher',
                    'username' => 'rubric_other_'.$suffix,
                    'email' => 'rubric-other-'.$suffix.'@test.local',
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

        $suffix = 'rb'.substr((string) microtime(true), -6);

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Rubric Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $owner->id,
                'due_at' => now()->addDay(),
                'possible_xp' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $assignStudentId = (int) DB::table('assigns_students')->insertGetId([
                'assign_id' => $assignId,
                'student_id' => $student->id,
                'school_id' => (int) ($owner->school_id ?? 1),
                'status' => 1,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'submission_status' => 'active',
                'created_by' => (int) $owner->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
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
                $rubricIds = DB::table('assignment_rubrics')
                    ->where('assign_id', $fx['assign_id'])
                    ->pluck('id');
                if ($rubricIds->isNotEmpty()) {
                    DB::table('assignment_rubric_criteria')
                        ->whereIn('assignment_rubric_id', $rubricIds)
                        ->delete();
                    DB::table('assignment_rubrics')->whereIn('id', $rubricIds)->delete();
                }
                DB::table('assigns_students')->where('assign_id', $fx['assign_id'])->delete();
                DB::table('assigns')->where('id', $fx['assign_id'])->delete();
            }
            if (! empty($fx['created_other_id'])) {
                DB::table('users')->where('id', $fx['created_other_id'])->delete();
            }
        } catch (Throwable $e) {
            // ignore
        }
        $this->fixture = null;
    }

    /**
     * @return array<string, mixed>
     */
    private function validRubricPayload(): array
    {
        return [
            'title' => 'Homework Rubric',
            'criteria' => [
                ['label' => 'Understanding', 'weight' => 33.33],
                ['label' => 'Accuracy', 'weight' => 33.33],
                ['label' => 'Participation', 'weight' => 33.34],
            ],
        ];
    }

    public function test_possible_xp_can_be_set_to_100(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/possible_xp', [
                'possible_xp' => 100,
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame(100, $response->json('data.possible_xp'));
        $this->assertSame(100, (int) Assigns::query()->find($fx['assign_id'])->possible_xp);
    }

    public function test_possible_xp_null_remains_valid(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/possible_xp', [
                'possible_xp' => null,
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertNull($response->json('data.possible_xp'));
        $this->assertNull(Assigns::query()->find($fx['assign_id'])->possible_xp);
    }

    public function test_negative_possible_xp_rejected(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/possible_xp', [
                'possible_xp' => -5,
            ]);

        $this->assertFalse((bool) $response->json('status'));
        $this->assertNull(Assigns::query()->find($fx['assign_id'])->possible_xp);
    }

    public function test_owner_can_create_rubric_with_criteria_order_and_max_points(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', $this->validRubricPayload());

        $response->assertStatus(200)->assertJsonPath('status', true);
        $criteria = $response->json('data.rubric.criteria');
        $this->assertCount(3, $criteria);
        $this->assertSame('Understanding', $criteria[0]['label']);
        $this->assertSame('Accuracy', $criteria[1]['label']);
        $this->assertSame('Participation', $criteria[2]['label']);
        $this->assertSame(0, $criteria[0]['sort_order']);
        $this->assertSame(1, $criteria[1]['sort_order']);
        $this->assertSame(2, $criteria[2]['sort_order']);
        foreach ($criteria as $row) {
            $this->assertSame(4, $row['max_points']);
        }
        $this->assertFalse((bool) $response->json('data.rubric_locked'));
    }

    public function test_weights_100_accepted_and_90_101_rejected(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $headers = $this->teacherHeaders($fx['owner']);

        $ok = $this->withHeaders($headers)
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', $this->validRubricPayload());
        $ok->assertJsonPath('status', true);

        $bad90 = $this->withHeaders($headers)
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', [
                'title' => 'Bad',
                'criteria' => [
                    ['label' => 'A', 'weight' => 30],
                    ['label' => 'B', 'weight' => 30],
                    ['label' => 'C', 'weight' => 30],
                ],
            ]);
        $this->assertFalse((bool) $bad90->json('status'));
        $this->assertStringContainsString('criteria_weights_must_sum_to_100', (string) $bad90->json('msg'));

        $bad101 = $this->withHeaders($headers)
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', [
                'title' => 'Bad',
                'criteria' => [
                    ['label' => 'A', 'weight' => 50],
                    ['label' => 'B', 'weight' => 51],
                ],
            ]);
        $this->assertFalse((bool) $bad101->json('status'));
        $this->assertStringContainsString('criteria_weights_must_sum_to_100', (string) $bad101->json('msg'));
    }

    public function test_non_owner_cannot_upsert_rubric(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        auth()->setDefaultDriver('admin-api');
        $response = $this->actingAs($fx['other'], 'admin-api')
            ->withHeaders(['apiSecret' => $this->apiSecret()])
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', $this->validRubricPayload());

        // 401/403 both mean non-owner cannot mutate; some auth stacks reject ephemeral users via JWT.
        $this->assertContains($response->status(), [200, 401, 403], (string) $response->getContent());
        if ($response->status() !== 401) {
            $this->assertFalse((bool) $response->json('status'));
        }
    }

    public function test_cross_tenant_school_access_rejected(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $foreignSchoolId = (int) (DB::table('schools')
            ->where('id', '!=', (int) ($fx['owner']->school_id ?? 1))
            ->orderBy('id')
            ->value('id') ?? 0);

        $createdSchoolId = null;
        if ($foreignSchoolId <= 0) {
            try {
                $createdSchoolId = (int) DB::table('schools')->insertGetId([
                    'name' => 'Rubric Foreign School',
                    'name_ar' => 'مدرسة',
                    'status' => '1',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $foreignSchoolId = $createdSchoolId;
            } catch (Throwable $e) {
                $this->markTestSkipped('Could not create foreign school for tenant test.');
            }
        }

        try {
            DB::table('assigns')->where('id', $fx['assign_id'])->update(['school_id' => $foreignSchoolId]);

            $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
                ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', $this->validRubricPayload());

            $this->assertContains($response->status(), [200, 403]);
            $this->assertFalse((bool) $response->json('status'));
        } finally {
            if ($createdSchoolId) {
                DB::table('assigns')->where('id', $fx['assign_id'])->update([
                    'school_id' => (int) ($fx['owner']->school_id ?? 1),
                ]);
                DB::table('schools')->where('id', $createdSchoolId)->delete();
            }
        }
    }

    public function test_unauthenticated_rubric_rejected(): void
    {
        $response = $this->withHeaders(['apiSecret' => $this->apiSecret()])
            ->putJson('/api/assigns/1/rubric', $this->validRubricPayload());

        $response->assertStatus(401);
    }

    public function test_rubric_editable_while_students_active(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $this->assertSame(
            'active',
            AssignsStudents::query()->find($fx['assign_student_id'])->submission_status
        );

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', $this->validRubricPayload());

        $response->assertJsonPath('status', true);
    }

    public function test_rubric_locked_after_submitted_or_graded_and_delete_blocked(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $headers = $this->teacherHeaders($fx['owner']);
        $this->withHeaders($headers)
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', $this->validRubricPayload())
            ->assertJsonPath('status', true);

        AssignsStudents::query()->where('id', $fx['assign_student_id'])->update([
            'submission_status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $locked = $this->withHeaders($headers)
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', $this->validRubricPayload());
        $this->assertFalse((bool) $locked->json('status'));
        $this->assertStringContainsString('rubric_locked', (string) $locked->json('msg'));

        $deleteLocked = $this->withHeaders($headers)
            ->deleteJson('/api/assigns/'.$fx['assign_id'].'/rubric');
        $this->assertFalse((bool) $deleteLocked->json('status'));
        $this->assertStringContainsString('rubric_locked', (string) $deleteLocked->json('msg'));

        AssignsStudents::query()->where('id', $fx['assign_student_id'])->update([
            'submission_status' => 'graded',
            'graded_at' => now(),
        ]);

        $gradedLock = $this->withHeaders($headers)
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', $this->validRubricPayload());
        $this->assertFalse((bool) $gradedLock->json('status'));
        $this->assertStringContainsString('rubric_locked', (string) $gradedLock->json('msg'));
    }

    public function test_show_rubric_returns_payload(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $headers = $this->teacherHeaders($fx['owner']);
        $this->withHeaders($headers)
            ->putJson('/api/assigns/'.$fx['assign_id'].'/rubric', $this->validRubricPayload())
            ->assertJsonPath('status', true);

        $show = $this->withHeaders($headers)
            ->getJson('/api/assigns/'.$fx['assign_id'].'/rubric');

        $show->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame('Homework Rubric', $show->json('data.rubric.title'));
        $this->assertCount(3, $show->json('data.rubric.criteria'));
    }
}
