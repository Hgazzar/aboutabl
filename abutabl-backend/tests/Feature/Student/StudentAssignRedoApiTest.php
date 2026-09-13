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
 * Activity-level REDO + Assignment-level REDO (distinct operations).
 */
class StudentAssignRedoApiTest extends TestCase
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
     * @param  array<int, array{type: string, status: string}>  $activitySpecs
     * @return array<string, mixed>|null
     */
    private function seedFixture(
        array $activitySpecs,
        string $parentStatus = 'active',
        ?\Carbon\Carbon $dueAt = null
    ): ?array {
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

        $suffix = 'rd'.substr((string) microtime(true), -6);
        $activityIds = [];

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "Redo Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => (int) ($owner->school_id ?? 1),
                'grade_id' => (int) ($owner->grade_id ?? 1),
                'subject_id' => 1,
                'status' => 1,
                'created_by' => 1,
                'due_at' => $dueAt ?? now()->addDays(3),
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
                'submission_status' => $parentStatus,
                'submitted_at' => $parentStatus === 'submitted' || $parentStatus === 'graded'
                    ? now()->subHour()
                    : null,
                'graded_at' => $parentStatus === 'graded' ? now()->subMinutes(30) : null,
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $sort = 0;
            foreach ($activitySpecs as $spec) {
                $type = $spec['type'];
                $status = $spec['status'];
                $source = LearningActivityMap::SOURCE_TABLE[$type] ?? 'work_sheets';
                $grading = LearningActivityMap::GRADING_MODE[$type] ?? LearningActivityMap::GRADING_MANUAL;

                $activityId = (int) DB::table('assign_activities')->insertGetId([
                    'assign_id' => $assignId,
                    'activity_type' => $type,
                    'activity_id' => 1 + $sort,
                    'source_table' => $source,
                    'grading_mode' => $grading,
                    'title_snapshot' => strtoupper($type).' '.$suffix,
                    'sort_order' => $sort,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                if ($status !== 'none') {
                    DB::table('assign_activity_submissions')->insert([
                        'assign_id' => $assignId,
                        'assign_activity_id' => $activityId,
                        'assign_student_id' => $assignStudentId,
                        'student_id' => $owner->id,
                        'status' => $status,
                        'completeness' => $status === AssignActivitySubmission::STATUS_COMPLETED ? 100 : null,
                        'percent' => $status === AssignActivitySubmission::STATUS_COMPLETED ? 100 : null,
                        'submitted_at' => now(),
                        'graded_at' => in_array($status, [
                            AssignActivitySubmission::STATUS_COMPLETED,
                            AssignActivitySubmission::STATUS_GRADED,
                        ], true) ? now() : null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $activityIds[$type] = $activityId;
                $sort++;
            }
        } catch (Throwable $e) {
            return null;
        }

        $this->fixture = [
            'owner' => $owner,
            'outsider' => $outsider,
            'assign_id' => $assignId,
            'assign_student_id' => $assignStudentId,
            'activities' => $activityIds,
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
                if (Schema::hasTable('assignment_grades')) {
                    $gradeIds = DB::table('assignment_grades')
                        ->where('assign_id', $fx['assign_id'])
                        ->pluck('id');
                    if (Schema::hasTable('assignment_grade_criteria') && $gradeIds->isNotEmpty()) {
                        DB::table('assignment_grade_criteria')
                            ->whereIn('assignment_grade_id', $gradeIds)
                            ->delete();
                    }
                    DB::table('assignment_grades')->where('assign_id', $fx['assign_id'])->delete();
                }
                DB::table('assigns_students')->where('assign_id', $fx['assign_id'])->delete();
                DB::table('assigns')->where('id', $fx['assign_id'])->delete();
            }
        } catch (Throwable $e) {
            // ignore
        }
        $this->fixture = null;
    }

    public function test_completed_ebook_can_activity_redo_and_incomplete_cannot(): void
    {
        $fx = $this->seedFixture([
            ['type' => LearningActivityMap::TYPE_EBOOK, 'status' => AssignActivitySubmission::STATUS_COMPLETED],
            ['type' => LearningActivityMap::TYPE_WORKSHEET, 'status' => 'none'],
        ]);
        if ($fx === null) {
            $this->markTestSkipped('Redo fixtures unavailable.');
        }

        $headers = $this->studentHeaders($fx['owner']);
        $detail = $this->withHeaders($headers)
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');
        $detail->assertStatus(200);
        $rows = collect($detail->json('data.activities'));
        $ebook = $rows->firstWhere('activity_type', LearningActivityMap::TYPE_EBOOK);
        $ws = $rows->firstWhere('activity_type', LearningActivityMap::TYPE_WORKSHEET);
        $this->assertTrue($ebook['redo_allowed']);
        $this->assertFalse($ws['redo_allowed']);

        $redo = $this->withHeaders($headers)
            ->postJson('/api/student/assign-activities/'.$fx['activities'][LearningActivityMap::TYPE_EBOOK].'/redo');
        $redo->assertStatus(200)->assertJsonPath('status', true);

        $submission = AssignActivitySubmission::query()
            ->where('assign_activity_id', $fx['activities'][LearningActivityMap::TYPE_EBOOK])
            ->where('student_id', $fx['owner']->id)
            ->first();
        $this->assertSame(AssignActivitySubmission::STATUS_PENDING, $submission->status);

        // Incomplete worksheet still cannot redo.
        $bad = $this->withHeaders($headers)
            ->postJson('/api/student/assign-activities/'.$fx['activities'][LearningActivityMap::TYPE_WORKSHEET].'/redo');
        $this->assertFalse((bool) $bad->json('status'));
        $this->assertStringContainsString('activity_redo_not_allowed', (string) $bad->json('msg'));
    }

    public function test_activity_redo_forbidden_for_outsider_and_after_parent_submit(): void
    {
        $fx = $this->seedFixture([
            ['type' => LearningActivityMap::TYPE_GAME, 'status' => AssignActivitySubmission::STATUS_COMPLETED],
        ], 'submitted');
        if ($fx === null) {
            $this->markTestSkipped('Redo fixtures unavailable.');
        }

        $outsider = $this->withHeaders($this->studentHeaders($fx['outsider']))
            ->postJson('/api/student/assign-activities/'.$fx['activities'][LearningActivityMap::TYPE_GAME].'/redo');
        $this->assertFalse((bool) $outsider->json('status'));

        $owner = $this->withHeaders($this->studentHeaders($fx['owner']))
            ->postJson('/api/student/assign-activities/'.$fx['activities'][LearningActivityMap::TYPE_GAME].'/redo');
        $this->assertFalse((bool) $owner->json('status'));
        $this->assertStringContainsString('assignment_locked', (string) $owner->json('msg'));
    }

    public function test_assignment_redo_before_deadline_then_resubmit(): void
    {
        $fx = $this->seedFixture([
            ['type' => LearningActivityMap::TYPE_QUIZ, 'status' => AssignActivitySubmission::STATUS_COMPLETED],
        ], 'submitted', now()->addDay());
        if ($fx === null) {
            $this->markTestSkipped('Redo fixtures unavailable.');
        }

        $headers = $this->studentHeaders($fx['owner']);
        $detail = $this->withHeaders($headers)
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');
        $this->assertTrue($detail->json('data.redo_allowed'));
        $this->assertTrue($detail->json('data.lifecycle.redo_allowed'));

        $redo = $this->withHeaders($headers)
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/redo');
        $redo->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame('homework_hero', $redo->json('data.lifecycle.mode'));
        $this->assertSame('active', $redo->json('data.lifecycle.status'));
        $this->assertFalse($redo->json('data.redo_allowed'));

        $row = AssignsStudents::query()->find($fx['assign_student_id']);
        $this->assertSame('active', $row->submission_status);
        $this->assertNull($row->submitted_at);

        // Activity still complete → can parent submit again.
        $submit = $this->withHeaders($headers)
            ->postJson('/api/student/assigns/'.$fx['assign_id'].'/submit');
        $submit->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame('waiting_on_teacher', $submit->json('data.lifecycle.mode'));
        $this->assertSame('submitted', $submit->json('data.lifecycle.status'));
    }

    public function test_assignment_redo_forbidden_after_deadline_and_when_graded(): void
    {
        $past = $this->seedFixture([
            ['type' => LearningActivityMap::TYPE_EBOOK, 'status' => AssignActivitySubmission::STATUS_COMPLETED],
        ], 'submitted', now()->subDay());
        if ($past === null) {
            $this->markTestSkipped('Redo fixtures unavailable.');
        }

        $denied = $this->withHeaders($this->studentHeaders($past['owner']))
            ->postJson('/api/student/assigns/'.$past['assign_id'].'/redo');
        $this->assertFalse((bool) $denied->json('status'));
        $this->assertStringContainsString('assignment_deadline_passed', (string) $denied->json('msg'));
        $this->destroyFixture();

        $graded = $this->seedFixture([
            ['type' => LearningActivityMap::TYPE_EBOOK, 'status' => AssignActivitySubmission::STATUS_COMPLETED],
        ], 'graded', now()->addDay());
        if ($graded === null) {
            $this->markTestSkipped('Redo fixtures unavailable.');
        }

        $deniedGraded = $this->withHeaders($this->studentHeaders($graded['owner']))
            ->postJson('/api/student/assigns/'.$graded['assign_id'].'/redo');
        $this->assertFalse((bool) $deniedGraded->json('status'));
        $this->assertStringContainsString('assignment_graded_locked', (string) $deniedGraded->json('msg'));
    }

    public function test_worksheet_and_quiz_activity_redo_preserve_unrelated_rows(): void
    {
        $fx = $this->seedFixture([
            ['type' => LearningActivityMap::TYPE_WORKSHEET, 'status' => AssignActivitySubmission::STATUS_SUBMITTED],
            ['type' => LearningActivityMap::TYPE_QUIZ, 'status' => AssignActivitySubmission::STATUS_COMPLETED],
        ]);
        if ($fx === null) {
            $this->markTestSkipped('Redo fixtures unavailable.');
        }

        $headers = $this->studentHeaders($fx['owner']);
        $this->withHeaders($headers)
            ->postJson('/api/student/assign-activities/'.$fx['activities'][LearningActivityMap::TYPE_WORKSHEET].'/redo')
            ->assertJsonPath('status', true);

        $ws = AssignActivitySubmission::query()
            ->where('assign_activity_id', $fx['activities'][LearningActivityMap::TYPE_WORKSHEET])
            ->first();
        $quiz = AssignActivitySubmission::query()
            ->where('assign_activity_id', $fx['activities'][LearningActivityMap::TYPE_QUIZ])
            ->first();

        $this->assertSame(AssignActivitySubmission::STATUS_PENDING, $ws->status);
        $this->assertSame(AssignActivitySubmission::STATUS_COMPLETED, $quiz->status);
    }

    public function test_teacher_graded_activity_cannot_be_redone(): void
    {
        $fx = $this->seedFixture([
            ['type' => LearningActivityMap::TYPE_WORKSHEET, 'status' => AssignActivitySubmission::STATUS_GRADED],
        ]);
        if ($fx === null) {
            $this->markTestSkipped('Redo fixtures unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['owner']))
            ->postJson('/api/student/assign-activities/'.$fx['activities'][LearningActivityMap::TYPE_WORKSHEET].'/redo');
        $this->assertFalse((bool) $response->json('status'));
        $this->assertStringContainsString('activity_redo_not_allowed', (string) $response->json('msg'));
    }
}
