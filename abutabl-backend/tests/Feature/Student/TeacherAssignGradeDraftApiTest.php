<?php

namespace Tests\Feature\Student;

use App\Models\AssignmentGrade;
use App\Models\AssignmentGradeCriterion;
use App\Models\AssignmentRubric;
use App\Models\AssignmentRubricCriterion;
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
 * Phase 3B — Assignment Grade Draft + score engine.
 */
class TeacherAssignGradeDraftApiTest extends TestCase
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
     * @param  array<int, array{label: string, weight: float}>  $criteria
     * @return array<string, mixed>|null
     */
    private function seedFixture(array $criteria = [], string $parentStatus = 'submitted'): ?array
    {
        if (
            ! Schema::hasTable('assignment_grades')
            || ! Schema::hasTable('assignment_grade_criteria')
            || ! Schema::hasTable('assignment_rubrics')
            || ! Schema::hasColumn('assigns_students', 'submission_status')
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
                    'name' => 'Grade Other Teacher',
                    'username' => 'grade_other_'.$suffix,
                    'email' => 'grade-other-'.$suffix.'@test.local',
                    'phone' => '0166'.$suffix,
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

        if ($criteria === []) {
            $criteria = [
                ['label' => 'Understanding', 'weight' => 33.33],
                ['label' => 'Accuracy', 'weight' => 33.33],
                ['label' => 'Participation', 'weight' => 33.34],
            ];
        }

        $suffix = 'gd'.substr((string) microtime(true), -6);

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Grade Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $owner->id,
                'due_at' => now()->addDay(),
                'possible_xp' => 50,
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
                'submission_status' => $parentStatus,
                'submitted_at' => $parentStatus === 'submitted' || $parentStatus === 'graded' ? now() : null,
                'graded_at' => $parentStatus === 'graded' ? now() : null,
                'created_by' => (int) $owner->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $rubricId = (int) DB::table('assignment_rubrics')->insertGetId([
                'assign_id' => $assignId,
                'title' => 'Homework Rubric',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $criterionIds = [];
            foreach ($criteria as $index => $row) {
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
     * @return array{criteria: array<int, array{criterion_id: int, points: int}>}
     */
    private function gradePayload(array $fx, array $pointsByIndex): array
    {
        $criteria = [];
        foreach ($fx['criterion_ids'] as $index => $criterionId) {
            $criteria[] = [
                'criterion_id' => (int) $criterionId,
                'points' => (int) $pointsByIndex[$index],
            ];
        }

        return ['criteria' => $criteria];
    }

    public function test_grade_draft_created_and_unique_per_assign_student(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Grade fixtures unavailable.');
        }

        $headers = $this->teacherHeaders($fx['owner']);
        $body = $this->gradePayload($fx, [4, 3, 4]);

        $first = $this->withHeaders($headers)
            ->putJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade', $body);
        $first->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame('draft', $first->json('data.status'));
        $this->assertSame(91.67, (float) $first->json('data.final_percent'));

        $gradeId = (int) $first->json('data.id');
        $this->assertSame(1, AssignmentGrade::query()->where('assign_student_id', $fx['assign_student_id'])->count());
        $this->assertSame(3, AssignmentGradeCriterion::query()->where('assignment_grade_id', $gradeId)->count());

        $second = $this->withHeaders($headers)
            ->putJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade', $this->gradePayload($fx, [4, 4, 4]));
        $second->assertJsonPath('status', true);
        $this->assertSame($gradeId, (int) $second->json('data.id'));
        $this->assertSame(100.0, (float) $second->json('data.final_percent'));
        $this->assertSame(1, AssignmentGrade::query()->where('assign_student_id', $fx['assign_student_id'])->count());
        $this->assertSame(3, AssignmentGradeCriterion::query()->where('assignment_grade_id', $gradeId)->count());

        $parent = AssignsStudents::query()->find($fx['assign_student_id']);
        $this->assertSame('submitted', $parent->submission_status);
    }

    public function test_no_rubric_rejected(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Grade fixtures unavailable.');
        }

        DB::table('assignment_grade_criteria')->whereIn(
            'assignment_grade_id',
            DB::table('assignment_grades')->where('assign_id', $fx['assign_id'])->pluck('id')
        )->delete();
        DB::table('assignment_grades')->where('assign_id', $fx['assign_id'])->delete();
        DB::table('assignment_rubric_criteria')->where('assignment_rubric_id', $fx['rubric_id'])->delete();
        DB::table('assignment_rubrics')->where('id', $fx['rubric_id'])->delete();

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade', [
                'criteria' => [['criterion_id' => 1, 'points' => 4]],
            ]);

        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('assignment_rubric_required', (string) $response->json('msg'));
    }

    public function test_foreign_unknown_duplicate_missing_criteria_rejected(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Grade fixtures unavailable.');
        }

        $otherAssignId = (int) DB::table('assigns')->insertGetId([
            'type' => LearningActivityMap::ASSIGN_TYPE,
            'type_id' => 0,
            'assigned_name' => 'Foreign Assign',
            'assigned_path' => '/todo',
            'school_id' => (int) ($fx['owner']->school_id ?? 1),
            'status' => 1,
            'created_by' => (int) $fx['owner']->id,
            'due_at' => now()->addDay(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $foreignRubricId = (int) DB::table('assignment_rubrics')->insertGetId([
            'assign_id' => $otherAssignId,
            'title' => 'Foreign',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $foreignCriterionId = (int) DB::table('assignment_rubric_criteria')->insertGetId([
            'assignment_rubric_id' => $foreignRubricId,
            'label' => 'Foreign Crit',
            'weight' => 100,
            'max_points' => 4,
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $headers = $this->teacherHeaders($fx['owner']);
        $ids = $fx['criterion_ids'];

        $foreign = $this->withHeaders($headers)->putJson(
            '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
            ['criteria' => [
                ['criterion_id' => $foreignCriterionId, 'points' => 4],
                ['criterion_id' => $ids[1], 'points' => 4],
                ['criterion_id' => $ids[2], 'points' => 4],
            ]]
        );
        $this->assertFalse((bool) $foreign->json('status'));
        $this->assertStringContainsString('criteria_unknown_or_foreign', (string) $foreign->json('msg'));

        $unknown = $this->withHeaders($headers)->putJson(
            '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
            ['criteria' => [
                ['criterion_id' => 99999999, 'points' => 4],
                ['criterion_id' => $ids[1], 'points' => 4],
                ['criterion_id' => $ids[2], 'points' => 4],
            ]]
        );
        $this->assertFalse((bool) $unknown->json('status'));

        $dup = $this->withHeaders($headers)->putJson(
            '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
            ['criteria' => [
                ['criterion_id' => $ids[0], 'points' => 4],
                ['criterion_id' => $ids[0], 'points' => 3],
                ['criterion_id' => $ids[1], 'points' => 4],
                ['criterion_id' => $ids[2], 'points' => 4],
            ]]
        );
        $this->assertFalse((bool) $dup->json('status'));
        $this->assertStringContainsString('criteria_duplicate', (string) $dup->json('msg'));

        $missing = $this->withHeaders($headers)->putJson(
            '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
            ['criteria' => [
                ['criterion_id' => $ids[0], 'points' => 4],
                ['criterion_id' => $ids[1], 'points' => 4],
            ]]
        );
        $this->assertFalse((bool) $missing->json('status'));
        $this->assertStringContainsString('criteria_incomplete', (string) $missing->json('msg'));

        DB::table('assignment_rubric_criteria')->where('id', $foreignCriterionId)->delete();
        DB::table('assignment_rubrics')->where('id', $foreignRubricId)->delete();
        DB::table('assigns')->where('id', $otherAssignId)->delete();
    }

    public function test_valid_and_invalid_points(): void
    {
        $fx = $this->seedFixture([
            ['label' => 'A', 'weight' => 100],
        ]);
        if ($fx === null) {
            $this->markTestSkipped('Grade fixtures unavailable.');
        }

        $headers = $this->teacherHeaders($fx['owner']);
        $cid = $fx['criterion_ids'][0];

        foreach ([1, 2, 3, 4] as $points) {
            $ok = $this->withHeaders($headers)->putJson(
                '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
                ['criteria' => [['criterion_id' => $cid, 'points' => $points]]]
            );
            $ok->assertJsonPath('status', true);
        }

        foreach ([0, 5] as $bad) {
            $res = $this->withHeaders($headers)->putJson(
                '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
                ['criteria' => [['criterion_id' => $cid, 'points' => $bad]]]
            );
            $this->assertFalse((bool) $res->json('status'));
        }

        try {
            app(AssignmentGradeService::class)->upsertDraft((int) $fx['assign_id'], (int) $fx['student']->id, [
                'criteria' => [['criterion_id' => $cid, 'points' => 2.5]],
            ]);
            $this->fail('Expected InvalidArgumentException for points 2.5');
        } catch (\InvalidArgumentException $ex) {
            $this->assertStringContainsString('criteria_points_invalid', $ex->getMessage());
        }
    }

    public function test_score_engine_deterministic_cases(): void
    {
        $service = app(AssignmentGradeService::class);

        $cases = [
            [
                'criteria' => [
                    ['label' => 'U', 'weight' => 50],
                    ['label' => 'A', 'weight' => 50],
                ],
                'points' => [4, 4],
                'expected' => 100.0,
            ],
            [
                'criteria' => [
                    ['label' => 'U', 'weight' => 50],
                    ['label' => 'A', 'weight' => 50],
                ],
                'points' => [4, 2],
                'expected' => 75.0,
            ],
            [
                'criteria' => [
                    ['label' => 'U', 'weight' => 33.33],
                    ['label' => 'A', 'weight' => 33.33],
                    ['label' => 'P', 'weight' => 33.34],
                ],
                'points' => [4, 3, 4],
                'expected' => 91.67,
            ],
            [
                'criteria' => [
                    ['label' => 'U', 'weight' => 33.33],
                    ['label' => 'A', 'weight' => 33.33],
                    ['label' => 'P', 'weight' => 33.34],
                ],
                'points' => [1, 1, 1],
                'expected' => 25.0,
            ],
            [
                'criteria' => [
                    ['label' => 'U', 'weight' => 33.33],
                    ['label' => 'A', 'weight' => 33.33],
                    ['label' => 'P', 'weight' => 33.34],
                ],
                'points' => [4, 4, 4],
                'expected' => 100.0,
            ],
        ];

        foreach ($cases as $case) {
            $fx = $this->seedFixture($case['criteria']);
            $this->assertNotNull($fx);
            $scores = [];
            foreach ($fx['criterion_ids'] as $i => $id) {
                $scores[(int) $id] = (int) $case['points'][$i];
            }
            $rubric = AssignmentRubric::query()->with('criteria')->find($fx['rubric_id']);
            $percent = $service->calculateFinalPercent($rubric->criteria, $scores);
            $this->assertSame($case['expected'], $percent);
            $this->destroyFixture();
        }
    }

    public function test_active_parent_cannot_be_graded(): void
    {
        $fx = $this->seedFixture([], 'active');
        if ($fx === null) {
            $this->markTestSkipped('Grade fixtures unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson(
                '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
                $this->gradePayload($fx, [4, 4, 4])
            );

        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('assignment_not_submitted', (string) $response->json('msg'));
    }

    public function test_security_non_owner_cross_tenant_student_unauth(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Grade fixtures unavailable.');
        }

        $body = $this->gradePayload($fx, [4, 4, 4]);

        auth()->setDefaultDriver('admin-api');
        $nonOwner = $this->actingAs($fx['other'], 'admin-api')
            ->withHeaders(['apiSecret' => $this->apiSecret()])
            ->putJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade', $body);
        $this->assertContains($nonOwner->status(), [200, 401, 403]);
        if ($nonOwner->status() !== 401) {
            $this->assertFalse((bool) $nonOwner->json('status'));
        }

        $createdSchoolId = null;
        try {
            $createdSchoolId = (int) DB::table('schools')->insertGetId([
                'name' => 'Grade Foreign School',
                'name_ar' => 'مدرسة',
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('assigns')->where('id', $fx['assign_id'])->update(['school_id' => $createdSchoolId]);
            $cross = $this->withHeaders($this->teacherHeaders($fx['owner']))
                ->putJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade', $body);
            $this->assertFalse((bool) $cross->json('status'));
        } finally {
            if ($createdSchoolId) {
                DB::table('assigns')->where('id', $fx['assign_id'])->update([
                    'school_id' => (int) ($fx['owner']->school_id ?? 1),
                ]);
                DB::table('schools')->where('id', $createdSchoolId)->delete();
            }
        }

        // Student JWT on admin guard can collide with User IDs (shared numeric sub).
        // Use an outsider student whose id does not match the owning teacher user id.
        $studentCaller = ((int) $fx['outsider']->id === (int) $fx['owner']->id)
            ? $fx['student']
            : $fx['outsider'];
        if ((int) $studentCaller->id === (int) $fx['owner']->id) {
            $this->markTestSkipped('Cannot isolate student JWT subject from teacher user id.');
        }

        Auth::guard('admin-api')->logout();
        auth()->setDefaultDriver('user-api');
        $studentCall = $this->withHeaders($this->studentHeaders($studentCaller))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade', $body);
        $this->assertContains($studentCall->status(), [200, 401, 403]);
        $this->assertFalse((bool) $studentCall->json('status'));

        $unauth = $this->withHeaders(['apiSecret' => $this->apiSecret()])
            ->putJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade', $body);
        $unauth->assertStatus(401);

        $wrongStudent = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->putJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['outsider']->id.'/grade', $body);
        $this->assertFalse((bool) $wrongStudent->json('status'));
        $this->assertStringContainsString('assign_student_not_found', (string) $wrongStudent->json('msg'));
    }

    public function test_show_grade_and_review_include_grade(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Grade fixtures unavailable.');
        }

        $headers = $this->teacherHeaders($fx['owner']);
        $this->withHeaders($headers)
            ->putJson(
                '/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade',
                $this->gradePayload($fx, [4, 3, 4])
            )
            ->assertJsonPath('status', true);

        $show = $this->withHeaders($headers)
            ->getJson('/api/assigns/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/grade');
        $show->assertJsonPath('status', true);
        $this->assertSame(91.67, (float) $show->json('data.grade.final_percent'));

        $review = $this->withHeaders($headers)
            ->getJson('/api/assigns/'.$fx['assign_id'].'/learning_activities/review');
        $review->assertJsonPath('status', true);
        $row = collect($review->json('data.students'))->firstWhere('student_id', (int) $fx['student']->id);
        $this->assertNotNull($row['grade']);
        $this->assertSame('draft', $row['grade']['status']);
        $this->assertSame('submitted', $row['submission_status']);
    }
}
