<?php

namespace Tests\Feature\Student;

use App\Models\AssignActivitySubmission;
use App\Models\AssignmentGrade;
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
 * Phase 4D — Student Assignment Detail rubric definition (generic levels).
 */
class StudentAssignRubricDetailApiTest extends TestCase
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
    private function studentHeaders(Student $student, string $lang = 'en'): array
    {
        auth()->setDefaultDriver('user-api');
        $token = Auth::guard('user-api')->login($student);

        return [
            'Authorization' => 'Bearer '.$token,
            'Authorizations' => 'Bearer '.$token,
            'apiSecret' => $this->apiSecret(),
            'lang' => $lang,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function seedFixture(bool $withRubric = true, ?int $possibleXp = 50): ?array
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasTable('assign_activities')
            || ! Schema::hasTable('students')
            || ! Schema::hasTable('users')
        ) {
            return null;
        }

        if ($withRubric && (
            ! Schema::hasTable('assignment_rubrics')
            || ! Schema::hasTable('assignment_rubric_criteria')
        )) {
            return null;
        }

        $student = Student::query()->orderBy('id')->first();
        $outsider = Student::query()->where('id', '!=', $student?->id)->orderBy('id')->first();
        $owner = User::query()->orderBy('id')->first();
        if (! $student || ! $outsider || ! $owner) {
            return null;
        }

        $suffix = 'r4d'.substr((string) microtime(true), -6);

        try {
            $assignPayload = [
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Phase4D Rubric {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($student->school_id ?? 1),
                'grade_id' => (int) ($student->grade_id ?? 1),
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $owner->id,
                'due_at' => now()->addDays(5),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('assigns', 'possible_xp')) {
                $assignPayload['possible_xp'] = $possibleXp;
            }

            $assignId = (int) DB::table('assigns')->insertGetId($assignPayload);

            $assignStudentId = (int) DB::table('assigns_students')->insertGetId([
                'assign_id' => $assignId,
                'student_id' => $student->id,
                'school_id' => (int) ($student->school_id ?? 1),
                'status' => 1,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
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

            $rubricId = null;
            $criterionIds = [];
            if ($withRubric) {
                $rubricId = (int) DB::table('assignment_rubrics')->insertGetId([
                    'assign_id' => $assignId,
                    'title' => 'Your First Video',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                foreach (
                    [
                        ['label' => '2 min long', 'weight' => 33.33],
                        ['label' => 'Clear audio', 'weight' => 33.33],
                        ['label' => 'On topic', 'weight' => 33.34],
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
            }
        } catch (Throwable $e) {
            return null;
        }

        $this->fixture = [
            'owner' => $owner,
            'student' => $student,
            'outsider' => $outsider,
            'assign_id' => $assignId,
            'assign_student_id' => $assignStudentId,
            'ebook_activity_id' => $ebookId,
            'rubric_id' => $rubricId,
            'criterion_ids' => $criterionIds,
            'possible_xp' => $possibleXp,
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
                if (Schema::hasTable('assignment_grades')) {
                    $gradeIds = DB::table('assignment_grades')->where('assign_id', $fx['assign_id'])->pluck('id');
                    if ($gradeIds->isNotEmpty() && Schema::hasTable('assignment_grade_criteria')) {
                        DB::table('assignment_grade_criteria')->whereIn('assignment_grade_id', $gradeIds)->delete();
                    }
                    DB::table('assignment_grades')->where('assign_id', $fx['assign_id'])->delete();
                }
                if (! empty($fx['rubric_id']) && Schema::hasTable('assignment_rubric_criteria')) {
                    DB::table('assignment_rubric_criteria')->where('assignment_rubric_id', $fx['rubric_id'])->delete();
                    DB::table('assignment_rubrics')->where('id', $fx['rubric_id'])->delete();
                }
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

    public function test_owned_student_with_rubric_gets_definition(): void
    {
        $fx = $this->seedFixture(true, 50);
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['student'], 'en'))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $data = $response->json('data');
        $this->assertTrue((bool) $data['rubric_available']);
        $this->assertIsArray($data['rubric']);
        $this->assertSame((int) $fx['rubric_id'], (int) $data['rubric']['id']);
        $this->assertSame('Your First Video', $data['rubric']['title']);
        $this->assertSame(50, (int) $data['rubric']['points_possible']);
        $this->assertCount(3, $data['rubric']['criteria']);
        $this->assertSame('2 min long', $data['rubric']['criteria'][0]['label']);
        $this->assertEqualsWithDelta(33.33, (float) $data['rubric']['criteria'][0]['weight'], 0.001);
        $this->assertSame(4, (int) $data['rubric']['criteria'][0]['max_points']);
        $this->assertSame(0, (int) $data['rubric']['criteria'][0]['sort_order']);

        $levels = $data['rubric']['levels'];
        $this->assertCount(4, $levels);
        $this->assertSame(
            [4, 3, 2, 1],
            array_map(static fn ($row) => (int) $row['points'], $levels)
        );
        $this->assertSame(
            ['excellent', 'good', 'fair', 'poor'],
            array_map(static fn ($row) => (string) $row['key'], $levels)
        );
        $this->assertSame('Excellent', $levels[0]['label']);
        $this->assertSame('Good', $levels[1]['label']);
        $this->assertSame('Fair', $levels[2]['label']);
        $this->assertSame('Poor', $levels[3]['label']);
        foreach ($levels as $level) {
            $this->assertNull($level['descriptor']);
        }

        $this->assertSame('active', $data['lifecycle']['status']);
        $this->assertNull($data['grade']);
    }

    public function test_owned_student_without_rubric_gets_null_definition(): void
    {
        $fx = $this->seedFixture(false, 50);
        if ($fx === null) {
            $this->markTestSkipped('Assignment fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertFalse((bool) $response->json('data.rubric_available'));
        $this->assertNull($response->json('data.rubric'));
    }

    public function test_rubric_available_when_submitted_and_graded(): void
    {
        $fx = $this->seedFixture(true, 50);
        if ($fx === null || ! Schema::hasTable('assignment_grades')) {
            $this->markTestSkipped('Rubric/grade fixtures unavailable.');
        }

        DB::table('assign_activity_submissions')->insert([
            'assign_id' => $fx['assign_id'],
            'assign_activity_id' => $fx['ebook_activity_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'status' => AssignActivitySubmission::STATUS_COMPLETED,
            'completeness' => 100,
            'percent' => 100,
            'submitted_at' => now(),
            'graded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('assigns_students')->where('id', $fx['assign_student_id'])->update([
            'submission_status' => AssignsStudents::SUBMISSION_SUBMITTED,
            'submitted_at' => now(),
            'updated_at' => now(),
        ]);

        $submitted = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');
        $submitted->assertStatus(200)->assertJsonPath('status', true);
        $this->assertTrue((bool) $submitted->json('data.rubric_available'));
        $this->assertSame('Your First Video', $submitted->json('data.rubric.title'));
        $this->assertSame('submitted', $submitted->json('data.lifecycle.status'));
        $this->assertNull($submitted->json('data.grade'));

        $gradeId = (int) DB::table('assignment_grades')->insertGetId([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'final_percent' => 100,
            'status' => AssignmentGrade::STATUS_DRAFT,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        if (Schema::hasTable('assignment_grade_criteria')) {
            foreach ($fx['criterion_ids'] as $criterionId) {
                DB::table('assignment_grade_criteria')->insert([
                    'assignment_grade_id' => $gradeId,
                    'assignment_rubric_criterion_id' => $criterionId,
                    'points' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $withDraft = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');
        $this->assertTrue((bool) $withDraft->json('data.rubric_available'));
        $this->assertNull($withDraft->json('data.grade'));

        DB::table('assignment_grades')->where('id', $gradeId)->update([
            'status' => AssignmentGrade::STATUS_FINALIZED,
            'badge_key' => 'excellent',
            'teacher_feedback' => 'Great',
            'finalized_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('assigns_students')->where('id', $fx['assign_student_id'])->update([
            'submission_status' => AssignsStudents::SUBMISSION_GRADED,
            'graded_at' => now(),
            'updated_at' => now(),
        ]);

        $graded = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');
        $graded->assertStatus(200)->assertJsonPath('status', true);
        $this->assertTrue((bool) $graded->json('data.rubric_available'));
        $this->assertSame('Your First Video', $graded->json('data.rubric.title'));
        $this->assertSame('graded', $graded->json('data.lifecycle.status'));
        $this->assertSame(AssignmentGrade::STATUS_FINALIZED, $graded->json('data.grade.status'));
        $this->assertSame('excellent', $graded->json('data.grade.badge.key'));
        $this->assertSame('Great', $graded->json('data.grade.teacher_feedback'));
    }

    public function test_arabic_level_labels_via_lang_header(): void
    {
        $fx = $this->seedFixture(true, 50);
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['student'], 'ar'))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $levels = $response->json('data.rubric.levels');
        $this->assertSame('ممتاز', $levels[0]['label']);
        $this->assertSame('جيد', $levels[1]['label']);
        $this->assertSame('مقبول', $levels[2]['label']);
        $this->assertSame('ضعيف', $levels[3]['label']);
        $this->assertSame(
            ['excellent', 'good', 'fair', 'poor'],
            array_map(static fn ($row) => (string) $row['key'], $levels)
        );
    }

    public function test_outsider_cannot_load_rubric_via_detail(): void
    {
        $fx = $this->seedFixture(true, 50);
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['outsider']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $this->assertContains($response->status(), [200, 400, 403, 404]);
        $this->assertFalse((bool) $response->json('status'));
    }

    public function test_points_possible_null_when_possible_xp_unset(): void
    {
        if (! Schema::hasColumn('assigns', 'possible_xp')) {
            $this->markTestSkipped('possible_xp column unavailable.');
        }

        $fx = $this->seedFixture(true, null);
        if ($fx === null) {
            $this->markTestSkipped('Rubric fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertTrue((bool) $response->json('data.rubric_available'));
        $this->assertNull($response->json('data.rubric.points_possible'));
    }
}
