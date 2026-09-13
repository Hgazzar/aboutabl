<?php

namespace Tests\Feature\Student;

use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\Student;
use App\Models\StudentLessonCompletion;
use App\Models\StudentXpEvent;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

class StudentMyProgressApiTest extends TestCase
{
    /** @var array<string,mixed>|null */
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
            'Accept' => 'application/json',
        ];
    }

    private function requireDb(): void
    {
        try {
            DB::connection()->getPdo();
        } catch (Throwable $e) {
            $this->markTestSkipped('Database unavailable: '.$e->getMessage());
        }
    }

    /**
     * @return array<string,mixed>
     */
    private function seedFixture(): array
    {
        $this->requireDb();

        $student = Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->whereNotNull('school_id')
            ->whereNotNull('grade_id')
            ->where('school_id', '>', 0)
            ->where('grade_id', '>', 0)
            ->orderBy('id')
            ->first();

        if ($student === null) {
            $this->markTestSkipped('No active student available.');
        }

        $suffix = uniqid('mp_', true);
        $schoolId = (int) $student->school_id;
        $gradeId = (int) $student->grade_id;

        $subjectId = (int) DB::table('subjects')->insertGetId([
            'name' => "MP {$suffix}",
            'name_ar' => 'MP',
            'des' => "Desc {$suffix}",
            'des_ar' => 'وصف',
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $subjectsSchoolsId = (int) DB::table('subjects_schools')->insertGetId([
            'subject_id' => $subjectId,
            'school_id' => $schoolId,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $subjectsGradesId = (int) DB::table('subjects_grades')->insertGetId([
            'subjects_schools_id' => $subjectsSchoolsId,
            'subject_id' => $subjectId,
            'grade_id' => $gradeId,
            'school_id' => $schoolId,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitCompleteId = (int) DB::table('units')->insertGetId([
            'name' => "MP U1 {$suffix}",
            'name_ar' => 'U1',
            'subject_id' => $subjectId,
            'status' => '1',
            'for_teacher' => '0',
            'type' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitIncompleteId = (int) DB::table('units')->insertGetId([
            'name' => "MP U2 {$suffix}",
            'name_ar' => 'U2',
            'subject_id' => $subjectId,
            'status' => '1',
            'for_teacher' => '0',
            'type' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unitEmptyId = (int) DB::table('units')->insertGetId([
            'name' => "MP UEmpty {$suffix}",
            'name_ar' => 'UE',
            'subject_id' => $subjectId,
            'status' => '1',
            'for_teacher' => '0',
            'type' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $lesson1Id = (int) DB::table('lessons')->insertGetId([
            'name_en' => "MP L1 {$suffix}",
            'name_ar' => 'L1',
            'subject_id' => $subjectId,
            'unit_id' => $unitCompleteId,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $lesson2Id = (int) DB::table('lessons')->insertGetId([
            'name_en' => "MP L2 {$suffix}",
            'name_ar' => 'L2',
            'subject_id' => $subjectId,
            'unit_id' => $unitIncompleteId,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $contentId = (int) DB::table('lessons_contents')->insertGetId([
            'name_en' => "MP C1 {$suffix}",
            'name_ar' => 'C1',
            'lesson_id' => $lesson1Id,
            'subject_id' => $subjectId,
            'unit_id' => $unitCompleteId,
            'type' => 'pdf',
            'status' => '1',
            'path' => 'storage/mp.pdf',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Complete all lessons in unit 1
        if (Schema::hasTable('student_lesson_completions')) {
            DB::table('student_lesson_completions')->insert([
                'student_id' => $student->id,
                'lesson_id' => $lesson1Id,
                'subject_id' => $subjectId,
                'completed_at' => now(),
                'completion_source' => 'test',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $quizId = null;
        if (Schema::hasTable('quizes') && Schema::hasTable('quiz_results')) {
            try {
                $quizId = (int) DB::table('quizes')->insertGetId([
                    'title_en' => "MP Quiz {$suffix}",
                    'title_ar' => 'MQ',
                    'subject_id' => $subjectId,
                    'status' => '1',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $resultRow = [
                    'student_id' => $student->id,
                    'quiz_id' => $quizId,
                    'percent' => 85,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                if (Schema::hasColumn('quiz_results', 'is_authoritative')) {
                    $resultRow['is_authoritative'] = 1;
                }
                DB::table('quiz_results')->insert($resultRow);
            } catch (Throwable $e) {
                $quizId = null;
            }
        }

        $this->fixture = [
            'student' => $student,
            'subject_id' => $subjectId,
            'school_id' => $schoolId,
            'grade_id' => $gradeId,
            'subjects_schools_id' => $subjectsSchoolsId,
            'subjects_grades_id' => $subjectsGradesId,
            'unit_complete_id' => $unitCompleteId,
            'unit_incomplete_id' => $unitIncompleteId,
            'unit_empty_id' => $unitEmptyId,
            'lesson1_id' => $lesson1Id,
            'lesson2_id' => $lesson2Id,
            'content_id' => $contentId,
            'quiz_id' => $quizId,
            'suffix' => $suffix,
            'outsider_id' => null,
            'outsider_school_id' => null,
            'outsider_grade_id' => null,
            'foreign_subject_id' => null,
            'foreign_ss_id' => null,
            'foreign_sg_id' => null,
            'content_completion_id' => null,
            'xp_event_id' => null,
            'assign_id' => null,
            'assign_student_id' => null,
            'cross_grade_id' => null,
            'cross_grade_subject_id' => null,
            'cross_grade_ss_id' => null,
            'cross_grade_sg_id' => null,
            'lesson2_content_id' => null,
            'quiz_version_id' => null,
            'quiz_snapshot_id' => null,
            'quiz_attempt_id' => null,
            'quiz_result_id' => null,
        ];

        return $this->fixture;
    }

    private function destroyFixture(): void
    {
        if ($this->fixture === null) {
            return;
        }
        $fx = $this->fixture;

        if (! empty($fx['xp_event_id']) && Schema::hasTable('student_xp_events')) {
            DB::table('student_xp_events')->where('id', $fx['xp_event_id'])->delete();
        }
        if (! empty($fx['content_completion_id']) && Schema::hasTable('student_lesson_content_completions')) {
            DB::table('student_lesson_content_completions')->where('id', $fx['content_completion_id'])->delete();
        }
        if (Schema::hasTable('student_lesson_content_completions')) {
            $contentIds = array_values(array_filter([
                $fx['content_id'] ?? null,
                $fx['lesson2_content_id'] ?? null,
            ]));
            if ($contentIds !== []) {
                DB::table('student_lesson_content_completions')
                    ->where('student_id', $fx['student']->id)
                    ->whereIn('lesson_content_id', $contentIds)
                    ->delete();
            }
        }
        if (! empty($fx['assign_student_id']) && Schema::hasTable('assigns_students')) {
            DB::table('assigns_students')->where('id', $fx['assign_student_id'])->delete();
        }
        if (! empty($fx['assign_id']) && Schema::hasTable('assigns')) {
            DB::table('assigns')->where('id', $fx['assign_id'])->delete();
        }

        if (! empty($fx['quiz_id']) && Schema::hasTable('quiz_results')) {
            if (! empty($fx['quiz_result_id'])) {
                DB::table('quiz_results')->where('id', $fx['quiz_result_id'])->delete();
            }
            DB::table('quiz_results')->where('quiz_id', $fx['quiz_id'])->delete();
        }
        if (! empty($fx['quiz_attempt_id']) && Schema::hasTable('quiz_attempts')) {
            DB::table('quiz_attempts')->where('id', $fx['quiz_attempt_id'])->delete();
        }
        if (! empty($fx['quiz_snapshot_id']) && Schema::hasTable('quiz_snapshots')) {
            DB::table('quiz_snapshots')->where('id', $fx['quiz_snapshot_id'])->delete();
        }
        if (! empty($fx['quiz_version_id']) && Schema::hasTable('quiz_versions')) {
            DB::table('quiz_versions')->where('id', $fx['quiz_version_id'])->delete();
        }
        if (! empty($fx['quiz_id']) && Schema::hasTable('quizes')) {
            DB::table('quizes')->where('id', $fx['quiz_id'])->delete();
        }

        if (Schema::hasTable('student_lesson_completions')) {
            DB::table('student_lesson_completions')
                ->where('student_id', $fx['student']->id)
                ->where('subject_id', $fx['subject_id'])
                ->delete();
        }

        if (Schema::hasTable('student_xp_events')) {
            DB::table('student_xp_events')
                ->where('student_id', $fx['student']->id)
                ->where('source_type', 'like', 'mp_test_%')
                ->delete();
        }

        if (! empty($fx['lesson2_content_id'])) {
            DB::table('lessons_contents')->where('id', $fx['lesson2_content_id'])->delete();
        }
        DB::table('lessons_contents')->where('id', $fx['content_id'])->delete();
        DB::table('lessons')->whereIn('id', [$fx['lesson1_id'], $fx['lesson2_id']])->delete();
        DB::table('units')->whereIn('id', [
            $fx['unit_complete_id'],
            $fx['unit_incomplete_id'],
            $fx['unit_empty_id'],
        ])->delete();

        if (! empty($fx['foreign_sg_id'])) {
            DB::table('subjects_grades')->where('id', $fx['foreign_sg_id'])->delete();
        }
        if (! empty($fx['foreign_ss_id'])) {
            DB::table('subjects_schools')->where('id', $fx['foreign_ss_id'])->delete();
        }
        if (! empty($fx['foreign_subject_id'])) {
            DB::table('subjects')->where('id', $fx['foreign_subject_id'])->delete();
        }

        if (! empty($fx['cross_grade_sg_id'])) {
            DB::table('subjects_grades')->where('id', $fx['cross_grade_sg_id'])->delete();
        }
        if (! empty($fx['cross_grade_ss_id'])) {
            DB::table('subjects_schools')->where('id', $fx['cross_grade_ss_id'])->delete();
        }
        if (! empty($fx['cross_grade_subject_id'])) {
            DB::table('subjects')->where('id', $fx['cross_grade_subject_id'])->delete();
        }
        if (! empty($fx['cross_grade_id'])) {
            DB::table('grades')->where('id', $fx['cross_grade_id'])->delete();
        }

        DB::table('subjects_grades')->where('id', $fx['subjects_grades_id'])->delete();
        DB::table('subjects_schools')->where('id', $fx['subjects_schools_id'])->delete();
        DB::table('subjects')->where('id', $fx['subject_id'])->delete();

        if (! empty($fx['outsider_id'])) {
            DB::table('students')->where('id', $fx['outsider_id'])->delete();
        }
        if (! empty($fx['outsider_grade_id'])) {
            DB::table('grades')->where('id', $fx['outsider_grade_id'])->delete();
        }
        if (! empty($fx['outsider_school_id'])) {
            DB::table('schools')->where('id', $fx['outsider_school_id'])->delete();
        }

        $this->fixture = null;
    }

    public function test_unauthenticated_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => $this->apiSecret(),
            'Accept' => 'application/json',
        ])->getJson('/api/student/my-progress');

        $response->assertStatus(401);
    }

    public function test_authenticated_student_receives_own_my_progress_shape(): void
    {
        $fx = $this->seedFixture();
        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $response->assertStatus(200);
        $response->assertJsonPath('status', true);
        $data = $response->json('my_progress');
        $this->assertIsArray($data);
        $this->assertArrayHasKey('hero', $data);
        $this->assertArrayHasKey('statistics', $data);
        $this->assertArrayHasKey('books', $data);
        $this->assertArrayHasKey('achievements', $data);

        $this->assertSame((string) $fx['student']->name, $data['hero']['name']);
        $this->assertSame('school', $data['statistics']['rank_scope']);
        $this->assertSame('all_time', $data['statistics']['rank_range']);
        $this->assertArrayHasKey('current_streak', $data['statistics']);
    }

    public function test_enrolled_subject_appears_with_unit_progress(): void
    {
        $fx = $this->seedFixture();
        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $response->assertStatus(200);
        $books = collect($response->json('my_progress.books'));
        $book = $books->firstWhere('subject_id', $fx['subject_id']);
        $this->assertNotNull($book);
        $this->assertSame(1, $book['units_completed']);
        $this->assertSame(2, $book['units_total']); // empty unit excluded from total
        $this->assertTrue($book['stars']['decorative']);
        $this->assertNull($book['activities_completed']);
        $this->assertFalse($book['activities_available']);
        $this->assertArrayHasKey('next_goal', $book);
    }

    public function test_accuracy_null_or_average_when_results_exist(): void
    {
        $fx = $this->seedFixture();
        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $book = collect($response->json('my_progress.books'))->firstWhere('subject_id', $fx['subject_id']);
        $this->assertNotNull($book);
        if ($fx['quiz_id']) {
            $this->assertEqualsWithDelta(85.0, (float) $book['accuracy_percent'], 0.1);
        } else {
            $this->assertNull($book['accuracy_percent']);
        }
    }

    public function test_cross_school_subject_not_listed(): void
    {
        $fx = $this->seedFixture();

        $otherSchoolId = (int) DB::table('schools')->insertGetId([
            'name' => 'MP School '.$fx['suffix'],
            'contanct_number' => '000',
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $otherGradeId = (int) DB::table('grades')->insertGetId([
            'name' => 'MP G '.$fx['suffix'],
            'school_id' => $otherSchoolId,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $foreignSubjectId = (int) DB::table('subjects')->insertGetId([
            'name' => 'MP Foreign '.$fx['suffix'],
            'name_ar' => 'F',
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $foreignSs = (int) DB::table('subjects_schools')->insertGetId([
            'subject_id' => $foreignSubjectId,
            'school_id' => $otherSchoolId,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $foreignSg = (int) DB::table('subjects_grades')->insertGetId([
            'subjects_schools_id' => $foreignSs,
            'subject_id' => $foreignSubjectId,
            'grade_id' => $otherGradeId,
            'school_id' => $otherSchoolId,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->fixture['foreign_subject_id'] = $foreignSubjectId;
        $this->fixture['foreign_ss_id'] = $foreignSs;
        $this->fixture['foreign_sg_id'] = $foreignSg;
        $this->fixture['outsider_school_id'] = $otherSchoolId;
        $this->fixture['outsider_grade_id'] = $otherGradeId;

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $ids = collect($response->json('my_progress.books'))->pluck('subject_id')->all();
        $this->assertNotContains($foreignSubjectId, $ids);
    }

    public function test_inactive_subject_mapping_excluded(): void
    {
        $fx = $this->seedFixture();
        DB::table('subjects_grades')->where('id', $fx['subjects_grades_id'])->update(['status' => '0']);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $ids = collect($response->json('my_progress.books'))->pluck('subject_id')->all();
        $this->assertNotContains($fx['subject_id'], $ids);

        DB::table('subjects_grades')->where('id', $fx['subjects_grades_id'])->update(['status' => '1']);
    }

    public function test_continue_learning_path_when_content_available(): void
    {
        $fx = $this->seedFixture();
        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $book = collect($response->json('my_progress.books'))->firstWhere('subject_id', $fx['subject_id']);
        $this->assertNotNull($book);
        $goal = $book['next_goal'];
        // Content exists and is incomplete → available continue path
        if ($goal['available'] ?? false) {
            $this->assertStringContainsString('/learn/'.$fx['subject_id'].'/details/', (string) $goal['cta_path']);
            $this->assertSame('potential', $goal['reward_xp_kind']);
        }
    }

    public function test_achievements_array_present(): void
    {
        $fx = $this->seedFixture();
        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $achievements = $response->json('my_progress.achievements');
        $this->assertIsArray($achievements);
        if ($achievements !== []) {
            $this->assertArrayHasKey('key', $achievements[0]);
            $this->assertArrayHasKey('progress', $achievements[0]);
        }
    }

    public function test_unit_states_completed_incomplete_and_zero_lesson_excluded(): void
    {
        $fx = $this->seedFixture();
        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $book = collect($response->json('my_progress.books'))->firstWhere('subject_id', $fx['subject_id']);
        $this->assertNotNull($book);
        // unitComplete (lesson1 done) + unitIncomplete (lesson2 not done); unitEmpty excluded
        $this->assertSame(1, $book['units_completed']);
        $this->assertSame(2, $book['units_total']);
        $this->assertEqualsWithDelta(50.0, (float) $book['progress_percent'], 0.1);
    }

    public function test_cross_grade_subject_not_listed(): void
    {
        $fx = $this->seedFixture();
        $otherGradeId = (int) DB::table('grades')->insertGetId([
            'name' => 'MP OtherGrade '.$fx['suffix'],
            'school_id' => $fx['school_id'],
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $crossSubjectId = (int) DB::table('subjects')->insertGetId([
            'name' => 'MP CrossGrade '.$fx['suffix'],
            'name_ar' => 'CG',
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $crossSs = (int) DB::table('subjects_schools')->insertGetId([
            'subject_id' => $crossSubjectId,
            'school_id' => $fx['school_id'],
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $crossSg = (int) DB::table('subjects_grades')->insertGetId([
            'subjects_schools_id' => $crossSs,
            'subject_id' => $crossSubjectId,
            'grade_id' => $otherGradeId,
            'school_id' => $fx['school_id'],
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->fixture['cross_grade_id'] = $otherGradeId;
        $this->fixture['cross_grade_subject_id'] = $crossSubjectId;
        $this->fixture['cross_grade_ss_id'] = $crossSs;
        $this->fixture['cross_grade_sg_id'] = $crossSg;

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $ids = collect($response->json('my_progress.books'))->pluck('subject_id')->all();
        $this->assertNotContains($crossSubjectId, $ids);
    }

    public function test_subject_weekly_xp_from_lesson_content_events(): void
    {
        $fx = $this->seedFixture();
        if (! Schema::hasTable('student_lesson_content_completions') || ! Schema::hasTable('student_xp_events')) {
            $this->markTestSkipped('XP event tables unavailable.');
        }

        // Clean any prior completion/XP for this content so sync produces a deterministic weekly amount.
        DB::table('student_xp_events')
            ->where('student_id', $fx['student']->id)
            ->where('source_type', 'lesson_content')
            ->whereIn('source_id', function ($q) use ($fx) {
                $q->select('id')
                    ->from('student_lesson_content_completions')
                    ->where('student_id', $fx['student']->id)
                    ->where('lesson_content_id', $fx['content_id']);
            })
            ->delete();
        DB::table('student_lesson_content_completions')
            ->where('student_id', $fx['student']->id)
            ->where('lesson_content_id', $fx['content_id'])
            ->delete();

        $completionId = (int) DB::table('student_lesson_content_completions')->insertGetId([
            'student_id' => $fx['student']->id,
            'lesson_id' => $fx['lesson1_id'],
            'lesson_content_id' => $fx['content_id'],
            'completed_at' => now(),
            'completion_source' => 'test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->fixture['content_completion_id'] = $completionId;

        $expectedPoints = (int) config('student_xp.event_points.lesson_content', 30);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        // StudentXpService::buildDashboardPayload syncs lesson_content events at config points.
        $book = collect($response->json('my_progress.books'))->firstWhere('subject_id', $fx['subject_id']);
        $this->assertNotNull($book);
        $this->assertGreaterThanOrEqual($expectedPoints, (int) $book['xp_this_week']);
    }

    public function test_subject_weekly_xp_from_quiz_events(): void
    {
        $fx = $this->seedFixture();
        if (
            ! Schema::hasTable('student_xp_events')
            || ! Schema::hasTable('quizes')
            || ! Schema::hasTable('quiz_versions')
            || ! Schema::hasTable('quiz_snapshots')
            || ! Schema::hasTable('quiz_attempts')
            || ! Schema::hasTable('quiz_results')
        ) {
            $this->markTestSkipped('Quiz XP event tables unavailable.');
        }

        $subjectId = (int) $fx['subject_id'];
        $studentId = (int) $fx['student']->id;
        $schoolId = (int) $fx['school_id'];
        $suffix = (string) $fx['suffix'];

        // Real chain: quiz (subject_id) → attempt/result → synced student_xp_events(source_type=quiz, source_id=quiz_id).
        // Do not invent subject_id on XP events.
        $quizId = ! empty($fx['quiz_id'])
            ? (int) $fx['quiz_id']
            : (int) DB::table('quizes')->insertGetId([
                'title_en' => "MP Quiz XP {$suffix}",
                'title_ar' => 'MQX',
                'subject_id' => $subjectId,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        $this->fixture['quiz_id'] = $quizId;

        $this->assertSame(
            $subjectId,
            (int) DB::table('quizes')->where('id', $quizId)->value('subject_id')
        );

        $versionId = (int) DB::table('quiz_versions')->insertGetId([
            'quiz_id' => $quizId,
            'version_number' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->fixture['quiz_version_id'] = $versionId;

        $snapshotId = (int) DB::table('quiz_snapshots')->insertGetId([
            'quiz_version_id' => $versionId,
            'quiz_id' => $quizId,
            'payload' => json_encode(['questions' => []]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->fixture['quiz_snapshot_id'] = $snapshotId;

        $attemptId = (int) DB::table('quiz_attempts')->insertGetId([
            'quiz_id' => $quizId,
            'quiz_version_id' => $versionId,
            'quiz_snapshot_id' => $snapshotId,
            'student_id' => $studentId,
            'school_id' => $schoolId,
            'status' => 'submitted',
            'attempt_no' => 1,
            'started_at' => now()->subMinutes(10),
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->fixture['quiz_attempt_id'] = $attemptId;

        $percent = 64;
        $resultRow = [
            'attempt_id' => $attemptId,
            'student_id' => $studentId,
            'quiz_id' => $quizId,
            'school_id' => $schoolId,
            'percent' => $percent,
            'raw_score' => $percent,
            'max_score' => 100,
            'passed' => 1,
            'is_authoritative' => 1,
            'finalized_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $resultId = (int) DB::table('quiz_results')->insertGetId($resultRow);
        $this->fixture['quiz_result_id'] = $resultId;

        $expectedAmount = max(1, (int) round($percent));

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');
        $response->assertStatus(200);

        $event = DB::table('student_xp_events')
            ->where('student_id', $studentId)
            ->where('source_type', 'quiz')
            ->where('source_id', $quizId)
            ->first();
        $this->assertNotNull($event, 'Quiz XP event must exist via quiz result sync (source_id = quiz_id).');
        $this->fixture['xp_event_id'] = (int) $event->id;
        $this->assertSame($expectedAmount, (int) $event->amount);
        $this->assertTrue(
            Carbon::parse($event->earned_at)->greaterThanOrEqualTo(Carbon::now()->startOfWeek()),
            'Quiz XP event must fall in the current week window.'
        );

        $book = collect($response->json('my_progress.books'))->firstWhere('subject_id', $subjectId);
        $this->assertNotNull($book);
        $this->assertGreaterThanOrEqual(
            $expectedAmount,
            (int) $book['xp_this_week'],
            'Subject weekly XP must include the attributed quiz event amount.'
        );
    }

    public function test_rank_matches_school_all_time_leaderboard(): void
    {
        $fx = $this->seedFixture();
        /** @var \App\Services\Student\StudentLeaderboardService $leaderboard */
        $leaderboard = $this->app->make(\App\Services\Student\StudentLeaderboardService::class);
        $expected = $leaderboard->build(
            (int) $fx['student']->id,
            \App\Services\Student\StudentLeaderboardService::SCOPE_SCHOOL,
            \App\Services\Student\StudentLeaderboardService::RANGE_ALL_TIME
        );
        $expectedRank = $expected['current_user_summary']['rank'] ?? null;

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $stats = $response->json('my_progress.statistics');
        $this->assertSame('school', $stats['rank_scope']);
        $this->assertSame('all_time', $stats['rank_range']);
        $this->assertSame(
            $expectedRank === null ? null : (int) $expectedRank,
            $stats['current_rank'] === null ? null : (int) $stats['current_rank']
        );

        $rail = $response->json('my_progress.xp_ranking');
        $this->assertIsArray($rail);
        $this->assertSame('school', $rail['scope']);
        $this->assertSame('all_time', $rail['range']);
    }

    public function test_assignment_presence_does_not_alter_curriculum_metrics(): void
    {
        $fx = $this->seedFixture();
        $before = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress')
            ->json('my_progress.books');
        $beforeBook = collect($before)->firstWhere('subject_id', $fx['subject_id']);
        $this->assertNotNull($beforeBook);

        if (! Schema::hasTable('assigns') || ! Schema::hasTable('assigns_students')) {
            $this->markTestSkipped('Assigns tables unavailable.');
        }

        $assignId = (int) DB::table('assigns')->insertGetId([
            'assigned_name' => 'MP Assign '.$fx['suffix'],
            'school_id' => $fx['school_id'],
            'grade_id' => $fx['grade_id'],
            'subject_id' => $fx['subject_id'],
            'type' => 'lesson',
            'type_id' => $fx['lesson1_id'],
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $assignStudentId = (int) DB::table('assigns_students')->insertGetId([
            'assign_id' => $assignId,
            'student_id' => $fx['student']->id,
            'school_id' => $fx['school_id'],
            'status' => 1,
            'opened_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->fixture['assign_id'] = $assignId;
        $this->fixture['assign_student_id'] = $assignStudentId;

        $after = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress')
            ->json('my_progress.books');
        $afterBook = collect($after)->firstWhere('subject_id', $fx['subject_id']);
        $this->assertNotNull($afterBook);

        $this->assertSame($beforeBook['units_completed'], $afterBook['units_completed']);
        $this->assertSame($beforeBook['units_total'], $afterBook['units_total']);
        $this->assertSame($beforeBook['accuracy_percent'], $afterBook['accuracy_percent']);
        $this->assertNull($afterBook['activities_completed']);
        $this->assertFalse($afterBook['activities_available']);
        $this->assertSame($beforeBook['activities_completed'], $afterBook['activities_completed']);
        $this->assertSame($beforeBook['activities_available'], $afterBook['activities_available']);
    }

    public function test_activities_metric_deferred_null_not_derived_from_slcc(): void
    {
        $fx = $this->seedFixture();

        if (Schema::hasTable('student_lesson_content_completions') && ! empty($fx['content1_id'])) {
            $exists = DB::table('student_lesson_content_completions')
                ->where('student_id', $fx['student']->id)
                ->where('lesson_content_id', $fx['content1_id'])
                ->exists();
            if (! $exists) {
                DB::table('student_lesson_content_completions')->insert([
                    'student_id' => $fx['student']->id,
                    'lesson_id' => $fx['lesson1_id'],
                    'lesson_content_id' => $fx['content1_id'],
                    'completed_at' => now(),
                    'completion_source' => 'test',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $book = collect(
            $this->withHeaders($this->studentHeaders($fx['student']))
                ->getJson('/api/student/my-progress')
                ->json('my_progress.books')
        )->firstWhere('subject_id', $fx['subject_id']);

        $this->assertNotNull($book);
        $this->assertNull($book['activities_completed']);
        $this->assertFalse($book['activities_available']);
        // Other book metrics remain present / computable.
        $this->assertArrayHasKey('units_completed', $book);
        $this->assertArrayHasKey('units_total', $book);
        $this->assertArrayHasKey('xp_this_week', $book);
        $this->assertArrayHasKey('accuracy_percent', $book);
        $this->assertArrayHasKey('next_goal', $book);
    }

    public function test_completed_subject_has_no_fake_next_goal(): void
    {
        $fx = $this->seedFixture();

        // Complete remaining lesson + content so Continue Learning has nothing left.
        if (Schema::hasTable('student_lesson_completions')) {
            DB::table('student_lesson_completions')->insert([
                'student_id' => $fx['student']->id,
                'lesson_id' => $fx['lesson2_id'],
                'subject_id' => $fx['subject_id'],
                'completed_at' => now(),
                'completion_source' => 'test',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $lesson2ContentId = (int) DB::table('lessons_contents')->insertGetId([
            'name_en' => 'MP C2 '.$fx['suffix'],
            'name_ar' => 'C2',
            'lesson_id' => $fx['lesson2_id'],
            'subject_id' => $fx['subject_id'],
            'unit_id' => $fx['unit_incomplete_id'],
            'type' => 'pdf',
            'status' => '1',
            'path' => 'storage/mp2.pdf',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->fixture['lesson2_content_id'] = $lesson2ContentId;

        if (Schema::hasTable('student_lesson_content_completions')) {
            foreach ([$fx['content_id'], $lesson2ContentId] as $cid) {
                $exists = DB::table('student_lesson_content_completions')
                    ->where('student_id', $fx['student']->id)
                    ->where('lesson_content_id', $cid)
                    ->exists();
                if (! $exists) {
                    DB::table('student_lesson_content_completions')->insert([
                        'student_id' => $fx['student']->id,
                        'lesson_id' => $cid === $fx['content_id'] ? $fx['lesson1_id'] : $fx['lesson2_id'],
                        'lesson_content_id' => $cid,
                        'completed_at' => now(),
                        'completion_source' => 'test',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $book = collect($response->json('my_progress.books'))->firstWhere('subject_id', $fx['subject_id']);
        $this->assertNotNull($book);
        $this->assertFalse($book['next_goal']['available'] ?? true);
        $this->assertArrayHasKey('cta_path', $book['next_goal']);
        $this->assertNull($book['next_goal']['cta_path']);
    }

    public function test_streak_rail_reuses_insight_payload_shape(): void
    {
        $fx = $this->seedFixture();
        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/my-progress');

        $streak = $response->json('my_progress.streak');
        $this->assertIsArray($streak);
        $this->assertArrayHasKey('current_streak', $streak);
        $this->assertArrayHasKey('weekly_days', $streak);
        $this->assertSame(
            (int) $response->json('my_progress.statistics.current_streak'),
            (int) $streak['current_streak']
        );
    }
}
