<?php

namespace Tests\Feature\Student;

use App\Models\AssignActivitySubmission;
use App\Models\AssignmentGrade;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Models\StudentXpEvent;
use App\Models\User;
use App\Services\Assignment\AssignmentGradeService;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * Phase 3C — Finalize / Return Assignment (badge, XP, feedback, student result).
 */
class TeacherAssignFinalizePhase3CApiTest extends TestCase
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
    private function seedFixture(?int $possibleXp = 100, bool $completeActivities = true): ?array
    {
        if (
            ! Schema::hasTable('assignment_grades')
            || ! Schema::hasColumn('assignment_grades', 'badge_key')
            || ! Schema::hasColumn('assignment_grades', 'earned_xp')
            || ! Schema::hasColumn('assignment_grades', 'teacher_feedback')
            || ! Schema::hasColumn('assigns', 'possible_xp')
            || ! Schema::hasTable('student_xp_events')
        ) {
            return null;
        }

        $owner = User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        $student = Student::query()->orderBy('id')->first();
        $outsider = Student::query()->where('id', '!=', $student?->id)->orderBy('id')->first();
        if (! $owner || ! $student || ! $outsider) {
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
                    'name' => 'Finalize3C Other',
                    'username' => 'fin3c_other_'.$suffix,
                    'email' => 'fin3c-other-'.$suffix.'@test.local',
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

        $suffix = 'f3c'.substr((string) microtime(true), -6);

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Finalize 3C {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $owner->id,
                'due_at' => now()->addDay(),
                'possible_xp' => $possibleXp,
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

            $rubricId = (int) DB::table('assignment_rubrics')->insertGetId([
                'assign_id' => $assignId,
                'title' => '3C Rubric',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $criterionIds = [];
            foreach (
                [
                    ['label' => 'Understanding', 'weight' => 33.33],
                    ['label' => 'Accuracy', 'weight' => 33.33],
                    ['label' => 'Participation', 'weight' => 33.34],
                ] as $index => $row
            ) {
                $criterionIds[] = (int) DB::table('assignment_rubric_criteria')->insertGetId([
                    'assignment_rubric_id' => $rubricId,
                    'label' => $row['label'],
                    'weight' => $row['weight'],
                    'max_points' => 4,
                    'sort_order' => $index,
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
            'outsider' => $outsider,
            'assign_id' => $assignId,
            'assign_student_id' => $assignStudentId,
            'ebook_activity_id' => $ebookId,
            'rubric_id' => $rubricId,
            'criterion_ids' => $criterionIds,
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
            if (! empty($fx['assign_student_id']) && Schema::hasTable('student_xp_events')) {
                DB::table('student_xp_events')
                    ->where('source_type', 'assignment')
                    ->where('source_id', $fx['assign_student_id'])
                    ->delete();
            }
            if (! empty($fx['student']) && Schema::hasTable('student_xp_events')) {
                DB::table('student_xp_events')
                    ->where('source_type', 'assignment')
                    ->where('student_id', (int) $fx['student']->id)
                    ->delete();
            }
            if (! empty($fx['assign_id'])) {
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
            if (! empty($fx['created_other_id'])) {
                DB::table('users')->where('id', $fx['created_other_id'])->delete();
            }
        } catch (Throwable $e) {
            // ignore
        }
        $this->fixture = null;
    }

    /**
     * @param  array<int, int>  $pointsByIndex
     * @return array{criteria: array<int, array{criterion_id: int, points: int}>, teacher_feedback?: string}
     */
    private function gradePayload(array $fx, array $pointsByIndex, ?string $feedback = null): array
    {
        $criteria = [];
        foreach ($fx['criterion_ids'] as $index => $criterionId) {
            $criteria[] = [
                'criterion_id' => (int) $criterionId,
                'points' => (int) $pointsByIndex[$index],
            ];
        }

        $payload = ['criteria' => $criteria];
        if ($feedback !== null) {
            $payload['teacher_feedback'] = $feedback;
        }

        return $payload;
    }

    private function submitParent(array $fx): void
    {
        $this->withHeaders($this->studentHeaders($fx['student']))
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit')
            ->assertStatus(200)
            ->assertJsonPath('status', true);
    }

    private function saveDraft(array $fx, array $points, ?string $feedback = null): void
    {
        $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson(
                '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
                $this->gradePayload($fx, $points, $feedback)
            )
            ->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_badge_boundary_keys(): void
    {
        $svc = app(AssignmentGradeService::class);
        $this->assertSame('excellent', $svc->resolveBadgeKey(100.00));
        $this->assertSame('excellent', $svc->resolveBadgeKey(90.00));
        $this->assertSame('good', $svc->resolveBadgeKey(89.99));
        $this->assertSame('good', $svc->resolveBadgeKey(75.00));
        $this->assertSame('fair', $svc->resolveBadgeKey(74.99));
        $this->assertSame('fair', $svc->resolveBadgeKey(50.00));
        $this->assertSame('needs_improvement', $svc->resolveBadgeKey(49.99));
        $this->assertSame('needs_improvement', $svc->resolveBadgeKey(0.00));
    }

    public function test_earned_xp_rounding_and_null_possible_xp(): void
    {
        $svc = app(AssignmentGradeService::class);
        $this->assertSame(100, $svc->calculateEarnedXp(100, 100.0));
        $this->assertSame(75, $svc->calculateEarnedXp(100, 75.0));
        $this->assertSame(92, $svc->calculateEarnedXp(100, 91.67));
        $this->assertNull($svc->calculateEarnedXp(null, 100.0));
    }

    public function test_full_e2e_create_submit_draft_finalize_student_result(): void
    {
        $fx = $this->seedFixture(100);
        if ($fx === null) {
            $this->markTestSkipped('Phase 3C fixtures unavailable.');
        }

        $this->submitParent($fx);
        $this->saveDraft($fx, [4, 4, 3], 'Draft note');

        $parent = AssignsStudents::query()->find($fx['assign_student_id']);
        $this->assertSame('submitted', $parent->submission_status);

        $draft = AssignmentGrade::query()->where('assign_student_id', $fx['assign_student_id'])->first();
        $this->assertNotNull($draft);
        $this->assertSame('draft', $draft->status);

        $finalize = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent', [
                'teacher_feedback' => 'Excellent work!',
            ]);

        $finalize->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame('graded', $finalize->json('data.submission_status'));
        $this->assertSame('finalized', $finalize->json('data.grade.status'));
        $this->assertNotNull($finalize->json('data.grade.finalized_at'));
        $this->assertSame((int) $fx['owner']->id, (int) $finalize->json('data.grade.graded_by'));
        $this->assertSame(100, (int) $finalize->json('data.grade.possible_xp'));
        $this->assertSame('Excellent work!', $finalize->json('data.grade.teacher_feedback'));

        $finalPercent = (float) $finalize->json('data.grade.final_percent');
        $this->assertGreaterThan(0, $finalPercent);
        $this->assertSame(
            app(AssignmentGradeService::class)->resolveBadgeKey($finalPercent),
            $finalize->json('data.grade.badge.key')
        );
        $expectedXp = app(AssignmentGradeService::class)->calculateEarnedXp(100, $finalPercent);
        $this->assertSame($expectedXp, (int) $finalize->json('data.grade.earned_xp'));

        $parent->refresh();
        $this->assertSame('graded', $parent->submission_status);
        $this->assertNotNull($parent->graded_at);

        $grade = AssignmentGrade::query()->find($draft->id);
        $this->assertSame('finalized', $grade->status);
        $this->assertNotNull($grade->finalized_at);
        $this->assertSame((int) $fx['owner']->id, (int) $grade->graded_by);

        $xpCount = StudentXpEvent::query()
            ->where('student_id', $fx['student']->id)
            ->where('source_type', 'assignment')
            ->where('source_id', $fx['assign_student_id'])
            ->count();
        $this->assertSame(1, $xpCount);
        $xpEvent = StudentXpEvent::query()
            ->where('student_id', $fx['student']->id)
            ->where('source_type', 'assignment')
            ->where('source_id', $fx['assign_student_id'])
            ->first();
        $this->assertSame($expectedXp, (int) $xpEvent->amount);

        $detail = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');
        $detail->assertStatus(200);
        $this->assertSame('assignment_graded', $detail->json('data.lifecycle.mode'));
        $this->assertSame('finalized', $detail->json('data.grade.status'));
        $this->assertSame($finalPercent, (float) $detail->json('data.grade.final_percent'));
        $this->assertSame($finalize->json('data.grade.badge.key'), $detail->json('data.grade.badge.key'));
        $this->assertSame($expectedXp, (int) $detail->json('data.grade.earned_xp'));
        $this->assertSame($expectedXp, (int) $detail->json('data.assignment_xp'));
        $this->assertSame('Excellent work!', $detail->json('data.grade.teacher_feedback'));
        $this->assertTrue((bool) $detail->json('data.rubric_available'));
        $this->assertNotEmpty($detail->json('data.grade.criteria'));
    }

    public function test_duplicate_finalize_rejects_and_no_second_xp(): void
    {
        $fx = $this->seedFixture(100);
        if ($fx === null) {
            $this->markTestSkipped('Phase 3C fixtures unavailable.');
        }

        $this->submitParent($fx);
        $this->saveDraft($fx, [4, 4, 4]);

        $headers = $this->teacherHeaders($fx['owner']);
        $this->withHeaders($headers)
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent')
            ->assertJsonPath('status', true);

        $second = $this->withHeaders($headers)
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent');
        $this->assertFalse((bool) $second->json('status'));
        $this->assertStringContainsString('assignment_already_graded', (string) $second->json('msg'));

        $this->assertSame(
            1,
            StudentXpEvent::query()
                ->where('student_id', $fx['student']->id)
                ->where('source_type', 'assignment')
                ->where('source_id', $fx['assign_student_id'])
                ->count()
        );
    }

    public function test_null_possible_xp_finalizes_without_xp_event(): void
    {
        $fx = $this->seedFixture(null);
        if ($fx === null) {
            $this->markTestSkipped('Phase 3C fixtures unavailable.');
        }

        $this->submitParent($fx);
        $this->saveDraft($fx, [4, 4, 4]);

        $finalize = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent');
        $finalize->assertJsonPath('status', true);
        $this->assertNull($finalize->json('data.grade.possible_xp'));
        $this->assertNull($finalize->json('data.grade.earned_xp'));

        $this->assertSame(
            0,
            StudentXpEvent::query()
                ->where('student_id', $fx['student']->id)
                ->where('source_type', 'assignment')
                ->where('source_id', $fx['assign_student_id'])
                ->count()
        );
    }

    public function test_student_cannot_read_other_student_grade(): void
    {
        $fx = $this->seedFixture(100);
        if ($fx === null) {
            $this->markTestSkipped('Phase 3C fixtures unavailable.');
        }

        $this->submitParent($fx);
        $this->saveDraft($fx, [4, 4, 4], 'Private feedback');
        $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent')
            ->assertJsonPath('status', true);

        $outsiderDetail = $this->withHeaders($this->studentHeaders($fx['outsider']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        // Outsider is not on the assign_students row — expect failure or empty grade.
        if ((bool) $outsiderDetail->json('status')) {
            $this->assertNull($outsiderDetail->json('data.grade'));
            $this->assertNotSame('Private feedback', $outsiderDetail->json('data.grade.teacher_feedback'));
        } else {
            $this->assertFalse((bool) $outsiderDetail->json('status'));
        }
    }

    public function test_student_cannot_finalize(): void
    {
        $fx = $this->seedFixture(100);
        if ($fx === null) {
            $this->markTestSkipped('Phase 3C fixtures unavailable.');
        }

        $this->submitParent($fx);
        $this->saveDraft($fx, [4, 4, 4]);

        // Student JWT on admin routes can collide with User IDs (shared numeric sub).
        $studentCaller = ((int) $fx['outsider']->id === (int) $fx['owner']->id)
            ? $fx['student']
            : $fx['outsider'];
        if ((int) $studentCaller->id === (int) $fx['owner']->id) {
            $this->markTestSkipped('Cannot isolate student JWT subject from teacher user id.');
        }

        Auth::guard('admin-api')->logout();
        auth()->setDefaultDriver('user-api');
        $response = $this->withHeaders($this->studentHeaders($studentCaller))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent');

        $this->assertContains($response->status(), [200, 401, 403], (string) $response->getContent());
        $this->assertFalse((bool) $response->json('status'));

        $parent = AssignsStudents::query()->find($fx['assign_student_id']);
        $this->assertSame('submitted', $parent->submission_status);
    }

    public function test_non_owner_teacher_cannot_finalize(): void
    {
        $fx = $this->seedFixture(100);
        if ($fx === null) {
            $this->markTestSkipped('Phase 3C fixtures unavailable.');
        }

        $this->submitParent($fx);
        $this->saveDraft($fx, [4, 4, 4]);

        auth()->setDefaultDriver('admin-api');
        $response = $this->actingAs($fx['other'], 'admin-api')
            ->withHeaders(['apiSecret' => $this->apiSecret()])
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent');

        $this->assertFalse((bool) $response->json('status'));
    }

    public function test_unauthenticated_finalize_returns_401(): void
    {
        $response = $this->withHeaders(['apiSecret' => $this->apiSecret()])
            ->postJson('/api/assigns/1/students/1/finalize_parent');
        $response->assertStatus(401);
    }

    public function test_activity_manual_grade_does_not_finalize_or_award_assignment_xp(): void
    {
        $fx = $this->seedFixture(100, false);
        if ($fx === null) {
            $this->markTestSkipped('Phase 3C fixtures unavailable.');
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

        $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/learning_activities/'.$worksheetId.'/manual_grade', [
                'student_id' => $fx['student']->id,
                'score' => 8,
                'max_score' => 10,
                'percent' => 80,
            ])
            ->assertJsonPath('status', true);

        $parent = AssignsStudents::query()->find($fx['assign_student_id']);
        $this->assertSame('active', $parent->submission_status);
        $this->assertSame(
            0,
            StudentXpEvent::query()
                ->where('source_type', 'assignment')
                ->where('source_id', $fx['assign_student_id'])
                ->count()
        );
        $this->assertSame(
            0,
            AssignmentGrade::query()->where('assign_student_id', $fx['assign_student_id'])->count()
        );
    }

    public function test_possible_xp_snapshot_is_historical_after_finalize(): void
    {
        $fx = $this->seedFixture(100);
        if ($fx === null) {
            $this->markTestSkipped('Phase 3C fixtures unavailable.');
        }

        $this->submitParent($fx);
        $this->saveDraft($fx, [4, 4, 4]);
        $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent')
            ->assertJsonPath('status', true);

        DB::table('assigns')->where('id', $fx['assign_id'])->update(['possible_xp' => 50]);

        $grade = AssignmentGrade::query()->where('assign_student_id', $fx['assign_student_id'])->first();
        $this->assertSame(100, (int) $grade->possible_xp);
        $this->assertSame(100, (int) $grade->earned_xp);
        $this->assertSame('excellent', $grade->badge_key);
        $this->assertSame('finalized', $grade->status);

        // Draft overwrite must be rejected after finalize.
        $overwrite = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson(
                '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
                $this->gradePayload($fx, [1, 1, 1])
            );
        $this->assertFalse((bool) $overwrite->json('status'));
        $this->assertStringContainsString('assignment_grade_already_finalized', (string) $overwrite->json('msg'));

        $grade->refresh();
        $this->assertSame(100.0, (float) $grade->final_percent);
        $this->assertSame('excellent', $grade->badge_key);
        $this->assertSame(100, (int) $grade->earned_xp);
    }

    public function test_teacher_review_exposes_finalized_fields(): void
    {
        $fx = $this->seedFixture(100);
        if ($fx === null) {
            $this->markTestSkipped('Phase 3C fixtures unavailable.');
        }

        $this->submitParent($fx);
        $this->saveDraft($fx, [3, 3, 3], 'Almost there');
        $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/finalize_parent')
            ->assertJsonPath('status', true);

        $review = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->getJson('/api/assigns/'.$fx['assign_id'].'/learning_activities/review');
        $review->assertJsonPath('status', true);

        $studentPayload = collect($review->json('data.students'))
            ->firstWhere('student_id', (int) $fx['student']->id);
        $this->assertSame('graded', $studentPayload['submission_status']);
        $this->assertNotNull($studentPayload['graded_at']);
        $this->assertSame('finalized', $studentPayload['grade']['status']);
        $this->assertArrayHasKey('badge', $studentPayload['grade']);
        $this->assertArrayHasKey('earned_xp', $studentPayload['grade']);
        $this->assertArrayHasKey('possible_xp', $studentPayload['grade']);
        $this->assertArrayHasKey('teacher_feedback', $studentPayload['grade']);
        $this->assertNotEmpty($studentPayload['grade']['criteria']);
    }
}
