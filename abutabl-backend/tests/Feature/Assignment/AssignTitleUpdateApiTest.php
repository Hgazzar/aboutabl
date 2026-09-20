<?php

namespace Tests\Feature\Assignment;

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
 * ASSIGN-EDIT-001 V1 — PUT /api/assigns/{assignId} title-only before parent submission.
 */
class AssignTitleUpdateApiTest extends TestCase
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
                    'name' => 'Edit Title Other Teacher',
                    'username' => 'edit_title_other_'.$suffix,
                    'email' => 'edit-title-other-'.$suffix.'@test.local',
                    'phone' => '0188'.$suffix,
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

        $suffix = 'et'.substr((string) microtime(true), -6);

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Edit Title Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $owner->id,
                'due_at' => now()->addDay(),
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
                'submission_status' => $submissionStatus,
                'created_by' => (int) $owner->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('assigns_students', 'opened_at') && $submissionStatus === 'active') {
                $row['opened_at'] = now()->subHour();
            }
            if ($submissionStatus === 'submitted' && Schema::hasColumn('assigns_students', 'submitted_at')) {
                $row['submitted_at'] = now();
            }
            if ($submissionStatus === 'graded' && Schema::hasColumn('assigns_students', 'graded_at')) {
                $row['submitted_at'] = now()->subHour();
                $row['graded_at'] = now();
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
            $criterionId = null;
            if (Schema::hasTable('assignment_rubrics') && Schema::hasTable('assignment_rubric_criteria')) {
                $rubricId = (int) DB::table('assignment_rubrics')->insertGetId([
                    'assign_id' => $assignId,
                    'title' => 'Rubric',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $criterionId = (int) DB::table('assignment_rubric_criteria')->insertGetId([
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
            'criterion_id' => $criterionId,
            'original_title' => "Edit Title Assign {$suffix}",
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
            'grades' => Schema::hasTable('assignment_grades')
                ? DB::table('assignment_grades')->where('assign_id', $assignId)->orderBy('id')->get()->toArray()
                : [],
        ];
    }

    public function test_owner_can_update_title_before_submission(): void
    {
        $fx = $this->seedFixture('active');
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $before = $this->snapshotIntegrity((int) $fx['assign_id']);
        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'], ['title' => 'Updated Homework Title']);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame('Updated Homework Title', $response->json('data.title'));
        $this->assertSame(
            'Updated Homework Title',
            (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('assigned_name')
        );
        $this->assertEquals($before, $this->snapshotIntegrity((int) $fx['assign_id']));
    }

    public function test_owner_can_update_title_when_student_opened_but_not_submitted(): void
    {
        $fx = $this->seedFixture('active');
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        if (Schema::hasColumn('assigns_students', 'opened_at')) {
            DB::table('assigns_students')->where('id', $fx['assign_student_id'])->update([
                'opened_at' => now()->subMinutes(30),
            ]);
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'], ['title' => 'Still Editable Title']);

        $response->assertStatus(200)->assertJsonPath('data.title', 'Still Editable Title');
    }

    public function test_rejects_update_after_student_submitted(): void
    {
        $fx = $this->seedFixture('submitted');
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $beforeTitle = (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('assigned_name');
        $before = $this->snapshotIntegrity((int) $fx['assign_id']);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'], ['title' => 'Should Fail']);

        $response->assertStatus(409)->assertJsonPath('status', false);
        $this->assertSame($beforeTitle, (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('assigned_name'));
        $this->assertEquals($before, $this->snapshotIntegrity((int) $fx['assign_id']));
    }

    public function test_rejects_update_after_student_graded(): void
    {
        $fx = $this->seedFixture('graded');
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $beforeTitle = (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('assigned_name');

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'], ['title' => 'Should Fail Graded']);

        $response->assertStatus(409)->assertJsonPath('status', false);
        $this->assertSame($beforeTitle, (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('assigned_name'));
    }

    public function test_rejects_unauthorized_teacher(): void
    {
        $fx = $this->seedFixture('active');
        if ($fx === null || empty($fx['other'])) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['other']))
            ->putJson('/api/assigns/'.$fx['assign_id'], ['title' => 'Hijack Title']);

        $this->assertTrue(in_array($response->status(), [403, 400], true));
        $this->assertFalse((bool) $response->json('status'));
        $this->assertSame(
            $fx['original_title'],
            (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('assigned_name')
        );
    }

    public function test_rejects_empty_title(): void
    {
        $fx = $this->seedFixture('active');
        if ($fx === null) {
            $this->markTestSkipped('Fixture unavailable');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'], ['title' => '   ']);

        $response->assertStatus(400)->assertJsonPath('status', false);
        $this->assertSame(
            $fx['original_title'],
            (string) DB::table('assigns')->where('id', $fx['assign_id'])->value('assigned_name')
        );
    }
}
