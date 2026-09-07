<?php

namespace Tests\Feature\Student;

use App\Models\AssignActivitySubmission;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Models\User;
use App\Services\Assignment\AssignmentGradeService;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * Teacher parent visibility + finalize (submitted → graded via Phase 3C grade finalize).
 */
class TeacherAssignParentFinalizeApiTest extends TestCase
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
    private function seedFixture(bool $completeActivities = true): ?array
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasTable('assign_activities')
            || ! Schema::hasColumn('assigns_students', 'submission_status')
            || ! Schema::hasTable('users')
            || ! Schema::hasTable('assignment_grades')
            || ! Schema::hasTable('assignment_rubrics')
            || ! Schema::hasTable('assignment_rubric_criteria')
            || ! Schema::hasTable('assignment_grade_criteria')
        ) {
            return null;
        }

        $ownerTeacher = User::query()->where('id', 179)->first()
            ?? User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        $student = Student::query()->orderBy('id')->first();
        $outsider = Student::query()->where('id', '!=', $student?->id)->orderBy('id')->first();

        if (! $ownerTeacher || ! $student || ! $outsider) {
            return null;
        }

        $otherTeacher = User::query()
            ->where('type', '!=', 'admin')
            ->where('id', '!=', $ownerTeacher->id)
            ->orderBy('id')
            ->first();

        $createdOtherTeacherId = null;
        if (! $otherTeacher) {
            try {
                $suffixUser = substr((string) microtime(true), -6);
                $createdOtherTeacherId = (int) DB::table('users')->insertGetId([
                    'name' => 'Finalize Other Teacher',
                    'username' => 'finalize_other_'.$suffixUser,
                    'email' => 'finalize-other-'.$suffixUser.'@test.local',
                    'phone' => '0199'.$suffixUser,
                    'password' => bcrypt('secret'),
                    'type' => 'teacher',
                    'status' => '1',
                    'verify' => '1',
                    'school_id' => (int) ($ownerTeacher->school_id ?? 1),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $otherTeacher = User::query()->find($createdOtherTeacherId);
            } catch (Throwable $e) {
                $otherTeacher = null;
            }
        }

        if (! $otherTeacher) {
            return null;
        }

        $suffix = 'tf'.substr((string) microtime(true), -6);

        try {
            $assignRow = [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Teacher Finalize {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($student->school_id ?? 1),
                'grade_id' => (int) ($student->grade_id ?? 1),
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $ownerTeacher->id,
                'due_at' => now()->addDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('assigns', 'possible_xp')) {
                $assignRow['possible_xp'] = 100;
            }
            $assignId = (int) DB::table('assigns')->insertGetId($assignRow);

            $assignStudentId = (int) DB::table('assigns_students')->insertGetId([
                'assign_id' => $assignId,
                'student_id' => $student->id,
                'school_id' => (int) ($student->school_id ?? 1),
                'status' => 1,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'submission_status' => 'active',
                'created_by' => (int) $ownerTeacher->id,
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
                    'student_id' => $student->id,
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
            if ($createdOtherTeacherId) {
                try {
                    DB::table('users')->where('id', $createdOtherTeacherId)->delete();
                } catch (Throwable $ignored) {
                    // ignore
                }
            }

            return null;
        }

        $this->fixture = [
            'owner_teacher' => $ownerTeacher,
            'other_teacher' => $otherTeacher,
            'created_other_teacher_id' => $createdOtherTeacherId,
            'student' => $student,
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
                if (Schema::hasTable('student_xp_events') && ! empty($fx['assign_student_id'])) {
                    DB::table('student_xp_events')
                        ->where('source_type', 'assignment')
                        ->where('source_id', $fx['assign_student_id'])
                        ->delete();
                }
                if (Schema::hasTable('student_xp_events') && ! empty($fx['student'])) {
                    DB::table('student_xp_events')
                        ->where('source_type', 'assignment')
                        ->where('student_id', (int) $fx['student']->id)
                        ->delete();
                }
                $gradeIds = DB::table('assignment_grades')->where('assign_id', $fx['assign_id'])->pluck('id');
                if ($gradeIds->isNotEmpty()) {
                    DB::table('assignment_grade_criteria')->whereIn('assignment_grade_id', $gradeIds)->delete();
                    DB::table('assignment_grades')->whereIn('id', $gradeIds)->delete();
                }
                $rubricIds = DB::table('assignment_rubrics')->where('assign_id', $fx['assign_id'])->pluck('id');
                if ($rubricIds->isNotEmpty()) {
                    DB::table('assignment_rubric_criteria')->whereIn('assignment_rubric_id', $rubricIds)->delete();
                    DB::table('assignment_rubrics')->whereIn('id', $rubricIds)->delete();
                }
                DB::table('assign_activity_submissions')->where('assign_id', $fx['assign_id'])->delete();
                DB::table('assign_activities')->where('assign_id', $fx['assign_id'])->delete();
                DB::table('assigns_students')->where('assign_id', $fx['assign_id'])->delete();
                DB::table('assigns')->where('id', $fx['assign_id'])->delete();
            }
            if (! empty($fx['created_other_teacher_id'])) {
                DB::table('users')->where('id', $fx['created_other_teacher_id'])->delete();
            }
        } catch (Throwable $e) {
            // ignore
        }
        $this->fixture = null;
    }

    /**
     * Phase 3C precondition: rubric + draft grade before finalize_parent.
     *
     * @return array<int, int> criterion ids
     */
    private function seedRubricAndDraft(array $fx, array $points = [4, 4, 4], ?string $feedback = null): array
    {
        $rubricId = (int) DB::table('assignment_rubrics')->insertGetId([
            'assign_id' => $fx['assign_id'],
            'title' => 'Finalize Rubric',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $weights = [33.33, 33.33, 33.34];
        $criterionIds = [];
        foreach ($weights as $index => $weight) {
            $criterionIds[] = (int) DB::table('assignment_rubric_criteria')->insertGetId([
                'assignment_rubric_id' => $rubricId,
                'label' => 'C'.($index + 1),
                'weight' => $weight,
                'max_points' => 4,
                'sort_order' => $index,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $criteria = [];
        foreach ($criterionIds as $index => $criterionId) {
            $criteria[] = [
                'criterion_id' => $criterionId,
                'points' => (int) ($points[$index] ?? 4),
            ];
        }

        $input = ['criteria' => $criteria];
        if ($feedback !== null) {
            $input['teacher_feedback'] = $feedback;
        }

        app(AssignmentGradeService::class)->upsertDraft(
            (int) $fx['assign_id'],
            (int) $fx['student']->id,
            $input
        );

        return $criterionIds;
    }

    public function test_end_to_end_submit_teacher_sees_finalize_student_graded(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Teacher finalize fixtures unavailable.');
        }

        // Step 1 — active → homework_hero
        $detail = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');
        $detail->assertStatus(200);
        $this->assertSame('homework_hero', $detail->json('data.lifecycle.mode'));
        $this->assertSame('active', $detail->json('data.lifecycle.status'));

        $row = AssignsStudents::query()->find($fx['assign_student_id']);
        $this->assertSame('active', $row->submission_status);
        $this->assertNull($row->submitted_at);
        $this->assertNull($row->graded_at);

        // Step 2–3 — activities already completed in fixture; student SUBMIT
        $submit = $this->withHeaders($this->studentHeaders($fx['student']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit');
        $submit->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame('waiting_on_teacher', $submit->json('data.lifecycle.mode'));

        $row->refresh();
        $this->assertSame('submitted', $row->submission_status);
        $this->assertNotNull($row->submitted_at);
        $this->assertNull($row->graded_at);

        // Step 4 — Teacher review reads parent SSOT
        $review = $this->withHeaders($this->teacherHeaders($fx['owner_teacher']))
            ->getJson('/api/assigns/'.$fx['assign_id'].'/learning_activities/review');
        $review->assertStatus(200)->assertJsonPath('status', true);

        $studentPayload = collect($review->json('data.students'))
            ->firstWhere('student_id', (int) $fx['student']->id);
        $this->assertNotNull($studentPayload);
        $this->assertSame('submitted', $studentPayload['submission_status']);
        $this->assertNotNull($studentPayload['submitted_at']);
        $this->assertNull($studentPayload['graded_at']);
        $this->assertArrayHasKey('activities', $studentPayload);

        // Activity complete alone must not equal parent submitted before submit —
        // after submit, parent status is authoritative and distinct from activities[].
        $activityStatuses = collect($studentPayload['activities'])
            ->pluck('submission.status')
            ->filter()
            ->values()
            ->all();
        $this->assertNotEmpty($activityStatuses);
        $this->assertSame('submitted', $studentPayload['submission_status']);

        // Step 5 — Rubric + draft grade required (Phase 3C), then finalize
        $this->seedRubricAndDraft($fx, [4, 4, 4], 'Great effort!');
        $finalize = $this->withHeaders($this->teacherHeaders($fx['owner_teacher']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent', [
                'teacher_feedback' => 'Excellent work!',
            ]);
        $finalize->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame('graded', $finalize->json('data.submission_status'));
        $this->assertNotNull($finalize->json('data.graded_at'));
        $this->assertSame('assignment_graded', $finalize->json('data.lifecycle.mode'));
        $this->assertSame('finalized', $finalize->json('data.grade.status'));
        $this->assertSame('excellent', $finalize->json('data.grade.badge.key'));
        $this->assertSame(100, (int) $finalize->json('data.grade.earned_xp'));
        $this->assertSame('Excellent work!', $finalize->json('data.grade.teacher_feedback'));

        $row->refresh();
        $this->assertSame('graded', $row->submission_status);
        $this->assertNotNull($row->graded_at);

        // Step 6 — Student detail → assignment_graded + real grade payload
        $gradedDetail = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');
        $gradedDetail->assertStatus(200);
        $this->assertSame('assignment_graded', $gradedDetail->json('data.lifecycle.mode'));
        $this->assertSame('graded', $gradedDetail->json('data.lifecycle.status'));
        $this->assertSame('finalized', $gradedDetail->json('data.grade.status'));
        $this->assertSame(100, (int) $gradedDetail->json('data.assignment_xp'));
        $this->assertTrue((bool) $gradedDetail->json('data.rubric_available'));
    }

    public function test_teacher_review_shows_active_when_activities_complete_but_not_parent_submitted(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Teacher finalize fixtures unavailable.');
        }

        $review = $this->withHeaders($this->teacherHeaders($fx['owner_teacher']))
            ->getJson('/api/assigns/'.$fx['assign_id'].'/learning_activities/review');
        $review->assertStatus(200);

        $studentPayload = collect($review->json('data.students'))
            ->firstWhere('student_id', (int) $fx['student']->id);
        $this->assertSame('active', $studentPayload['submission_status']);
        $this->assertNull($studentPayload['submitted_at']);

        $activityDone = collect($studentPayload['activities'])->contains(
            static fn ($row) => in_array($row['submission']['status'] ?? '', ['completed', 'graded', 'submitted'], true)
        );
        $this->assertTrue($activityDone);
    }

    public function test_unauthenticated_cannot_finalize(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => $this->apiSecret(),
        ])->postJson('/api/assigns/1/students/1/finalize_parent');

        $response->assertStatus(401);
    }

    public function test_other_teacher_cannot_finalize(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Teacher finalize fixtures unavailable.');
        }

        $this->withHeaders($this->studentHeaders($fx['student']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit')
            ->assertJsonPath('status', true);

        auth()->setDefaultDriver('admin-api');
        $response = $this->actingAs($fx['other_teacher'], 'admin-api')
            ->withHeaders(['apiSecret' => $this->apiSecret()])
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent');

        $this->assertContains($response->status(), [200, 403], (string) $response->getContent());
        $this->assertFalse((bool) $response->json('status'));
    }

    public function test_cannot_finalize_unrelated_student(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Teacher finalize fixtures unavailable.');
        }

        $this->withHeaders($this->studentHeaders($fx['student']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit')
            ->assertJsonPath('status', true);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner_teacher']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['outsider']->id.'/finalize_parent');

        $this->assertContains($response->status(), [200, 400]);
        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('assign_student_not_found', (string) $response->json('msg'));
    }

    public function test_cannot_finalize_active_parent_submission(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Teacher finalize fixtures unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner_teacher']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent');

        $this->assertContains($response->status(), [200, 400]);
        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('assignment_not_submitted', (string) $response->json('msg'));
    }

    public function test_cannot_finalize_already_graded(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Teacher finalize fixtures unavailable.');
        }

        $this->withHeaders($this->studentHeaders($fx['student']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit')
            ->assertJsonPath('status', true);

        $this->seedRubricAndDraft($fx);

        $headers = $this->teacherHeaders($fx['owner_teacher']);
        $this->withHeaders($headers)
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent')
            ->assertJsonPath('status', true);

        $second = $this->withHeaders($headers)
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent');

        $this->assertContains($second->status(), [200, 400]);
        $this->assertFalse((bool) $second->json('status'));
        $this->assertStringContainsString('assignment_already_graded', (string) $second->json('msg'));
    }

    public function test_submitted_without_grade_cannot_finalize(): void
    {
        $fx = $this->seedFixture(true);
        if ($fx === null) {
            $this->markTestSkipped('Teacher finalize fixtures unavailable.');
        }

        $this->withHeaders($this->studentHeaders($fx['student']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit')
            ->assertJsonPath('status', true);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner_teacher']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent');

        $this->assertContains($response->status(), [200, 400]);
        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('assignment_grade_required', (string) $response->json('msg'));
    }

    public function test_manual_activity_grade_does_not_set_parent_graded(): void
    {
        $fx = $this->seedFixture(false);
        if ($fx === null) {
            $this->markTestSkipped('Teacher finalize fixtures unavailable.');
        }

        $worksheetId = (int) DB::table('assign_activities')->insertGetId([
            'assign_id' => $fx['assign_id'],
            'activity_type' => LearningActivityMap::TYPE_WORKSHEET,
            'activity_id' => 1,
            'source_table' => 'work_sheets',
            'grading_mode' => LearningActivityMap::GRADING_MANUAL,
            'title_snapshot' => 'WS',
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('assign_activity_submissions')->insert([
            'assign_id' => $fx['assign_id'],
            'assign_activity_id' => $worksheetId,
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'status' => AssignActivitySubmission::STATUS_SUBMITTED,
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner_teacher']))
            ->postJson('/api/assigns/learning_activities/'.$worksheetId.'/manual_grade', [
                'student_id' => $fx['student']->id,
                'score' => 80,
                'max_score' => 100,
                'percent' => 80,
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);

        $row = AssignsStudents::query()->find($fx['assign_student_id']);
        $this->assertSame('active', $row->submission_status);
        $this->assertNull($row->graded_at);
    }
}
