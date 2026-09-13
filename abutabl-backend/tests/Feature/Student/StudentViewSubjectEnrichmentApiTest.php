<?php

namespace Tests\Feature\Student;

use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\Student;
use App\Services\Student\StudentViewSubjectEnrichmentService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * Phase 1 — additive viewSubject / subjectGames enrichment (non-breaking).
 */
class StudentViewSubjectEnrichmentApiTest extends TestCase
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
     * @return array<string, mixed>
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
            $this->markTestSkipped('No active enrolled student available.');
        }

        $suffix = uniqid('vse_', true);
        $schoolId = (int) $student->school_id;
        $gradeId = (int) $student->grade_id;

        $subjectId = (int) DB::table('subjects')->insertGetId([
            'name' => "VSE {$suffix}",
            'name_ar' => 'VSE',
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

        $unit1Id = (int) DB::table('units')->insertGetId([
            'name' => "VSE Unit1 {$suffix}",
            'name_ar' => 'وحدة1',
            'subject_id' => $subjectId,
            'status' => '1',
            'for_teacher' => '0',
            'type' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $unit2Id = (int) DB::table('units')->insertGetId([
            'name' => "VSE Unit2 {$suffix}",
            'name_ar' => 'وحدة2',
            'subject_id' => $subjectId,
            'status' => '1',
            'for_teacher' => '0',
            'type' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $lesson1Id = (int) DB::table('lessons')->insertGetId([
            'name_en' => "VSE L1 {$suffix}",
            'name_ar' => 'درس1',
            'subject_id' => $subjectId,
            'unit_id' => $unit1Id,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $lesson2Id = (int) DB::table('lessons')->insertGetId([
            'name_en' => "VSE L2 {$suffix}",
            'name_ar' => 'درس2',
            'subject_id' => $subjectId,
            'unit_id' => $unit1Id,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $lesson3Id = (int) DB::table('lessons')->insertGetId([
            'name_en' => "VSE L3 {$suffix}",
            'name_ar' => 'درس3',
            'subject_id' => $subjectId,
            'unit_id' => $unit2Id,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $content1Id = (int) DB::table('lessons_contents')->insertGetId([
            'name_en' => "VSE C1 {$suffix}",
            'name_ar' => 'محتوى1',
            'lesson_id' => $lesson1Id,
            'subject_id' => $subjectId,
            'unit_id' => $unit1Id,
            'type' => 'pdf',
            'status' => '1',
            'path' => 'storage/vse-placeholder.pdf',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $quizId = null;
        try {
            $quizId = (int) DB::table('quizes')->insertGetId([
                'title_en' => "VSE Quiz {$suffix}",
                'title_ar' => 'اختبار',
                'subject_id' => $subjectId,
                'unit_id' => $unit1Id,
                'lesson_id' => $lesson1Id,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (Throwable $e) {
            try {
                $quizId = (int) DB::table('quizes')->insertGetId([
                    'title_en' => "VSE Quiz {$suffix}",
                    'title_ar' => 'اختبار',
                    'subject_id' => $subjectId,
                    'status' => '1',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (Throwable $e2) {
                $quizId = null;
            }
        }

        $gameId = null;
        try {
            $gameId = (int) DB::table('games')->insertGetId([
                'name_en' => "VSE Game {$suffix}",
                'name_ar' => 'لعبة',
                'subject_id' => $subjectId,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (Throwable $e) {
            $gameId = null;
        }

        $this->fixture = [
            'student' => $student,
            'subject_id' => $subjectId,
            'school_id' => $schoolId,
            'grade_id' => $gradeId,
            'subjects_schools_id' => $subjectsSchoolsId,
            'subjects_grades_id' => $subjectsGradesId,
            'unit1_id' => $unit1Id,
            'unit2_id' => $unit2Id,
            'lesson1_id' => $lesson1Id,
            'lesson2_id' => $lesson2Id,
            'lesson3_id' => $lesson3Id,
            'content1_id' => $content1Id,
            'quiz_id' => $quizId,
            'game_id' => $gameId,
            'suffix' => $suffix,
            'lesson_completion_ids' => [],
            'content_completion_ids' => [],
            'quiz_result_ids' => [],
            'game_student_ids' => [],
            'outsider_id' => null,
            'outsider_school_id' => null,
            'outsider_grade_id' => null,
        ];

        return $this->fixture;
    }

    private function destroyFixture(): void
    {
        if ($this->fixture === null) {
            return;
        }

        $fx = $this->fixture;

        if (! empty($fx['game_student_ids']) && Schema::hasTable('games_students')) {
            DB::table('games_students')->whereIn('id', $fx['game_student_ids'])->delete();
        }
        if (! empty($fx['quiz_result_ids']) && Schema::hasTable('quiz_results')) {
            DB::table('quiz_results')->whereIn('id', $fx['quiz_result_ids'])->delete();
        }
        if (! empty($fx['content_completion_ids']) && Schema::hasTable('student_lesson_content_completions')) {
            DB::table('student_lesson_content_completions')->whereIn('id', $fx['content_completion_ids'])->delete();
        }
        if (! empty($fx['lesson_completion_ids']) && Schema::hasTable('student_lesson_completions')) {
            DB::table('student_lesson_completions')->whereIn('id', $fx['lesson_completion_ids'])->delete();
        }
        if (! empty($fx['game_id'])) {
            DB::table('games')->where('id', $fx['game_id'])->delete();
        }
        if (! empty($fx['quiz_id'])) {
            DB::table('quizes')->where('id', $fx['quiz_id'])->delete();
        }
        if (! empty($fx['content1_id'])) {
            DB::table('lessons_contents')->where('id', $fx['content1_id'])->delete();
        }
        foreach (['lesson1_id', 'lesson2_id', 'lesson3_id'] as $key) {
            if (! empty($fx[$key])) {
                DB::table('lessons')->where('id', $fx[$key])->delete();
            }
        }
        foreach (['unit1_id', 'unit2_id'] as $key) {
            if (! empty($fx[$key])) {
                DB::table('units')->where('id', $fx[$key])->delete();
            }
        }
        if (! empty($fx['subjects_grades_id'])) {
            DB::table('subjects_grades')->where('id', $fx['subjects_grades_id'])->delete();
        }
        if (! empty($fx['subjects_schools_id'])) {
            DB::table('subjects_schools')->where('id', $fx['subjects_schools_id'])->delete();
        }
        if (! empty($fx['subject_id'])) {
            DB::table('subjects')->where('id', $fx['subject_id'])->delete();
        }
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

    private function markLessonComplete(array &$fx, int $lessonId): void
    {
        if (! Schema::hasTable('student_lesson_completions')) {
            $this->markTestSkipped('student_lesson_completions missing.');
        }

        $id = (int) DB::table('student_lesson_completions')->insertGetId([
            'student_id' => (int) $fx['student']->id,
            'lesson_id' => $lessonId,
            'subject_id' => (int) $fx['subject_id'],
            'completed_at' => now(),
            'completion_source' => 'test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $fx['lesson_completion_ids'][] = $id;
        $this->fixture = $fx;
    }

    public function test_unit_progress_map_zero_partial_and_complete(): void
    {
        $fx = $this->seedFixture();
        $service = app(StudentViewSubjectEnrichmentService::class);
        $studentId = (int) $fx['student']->id;

        $zero = $service->unitProgressMapForUnitIds($studentId, [(int) $fx['unit1_id'], (int) $fx['unit2_id']]);
        $this->assertSame(0.0, $zero[(int) $fx['unit1_id']]['progress_percent']);
        $this->assertFalse($zero[(int) $fx['unit1_id']]['completed']);
        $this->assertSame(0.0, $zero[(int) $fx['unit2_id']]['progress_percent']);

        $this->markLessonComplete($fx, (int) $fx['lesson1_id']);
        $partial = $service->unitProgressMapForUnitIds($studentId, [(int) $fx['unit1_id']]);
        $this->assertSame(50.0, $partial[(int) $fx['unit1_id']]['progress_percent']);
        $this->assertFalse($partial[(int) $fx['unit1_id']]['completed']);

        $this->markLessonComplete($fx, (int) $fx['lesson2_id']);
        $done = $service->unitProgressMapForUnitIds($studentId, [(int) $fx['unit1_id']]);
        $this->assertSame(100.0, $done[(int) $fx['unit1_id']]['progress_percent']);
        $this->assertTrue($done[(int) $fx['unit1_id']]['completed']);
    }

    public function test_view_subject_preserves_legacy_shape_and_adds_enrichment(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];

        $this->markLessonComplete($fx, (int) $fx['lesson1_id']);

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/viewSubject/'.$subjectId);

        $response->assertStatus(200);
        $response->assertJsonPath('status', true);
        $response->assertJsonPath('basic_info.id', $subjectId);
        $this->assertArrayHasKey('units', $response->json());
        $this->assertArrayHasKey('quizesSubject', $response->json());
        $this->assertArrayHasKey('worksheetsSubject', $response->json());

        $units = $response->json('units');
        $this->assertIsArray($units);
        $this->assertGreaterThanOrEqual(2, count($units));

        $ids = array_map(static fn ($u) => (int) ($u['id'] ?? 0), $units);
        $sorted = $ids;
        sort($sorted);
        $this->assertSame($sorted, $ids, 'units must be ordered by id ASC');

        $unit1 = null;
        foreach ($units as $unit) {
            $this->assertArrayHasKey('id', $unit);
            $this->assertArrayHasKey('name', $unit);
            $this->assertArrayHasKey('lessons', $unit);
            $this->assertArrayHasKey('quizesUnit', $unit);
            $this->assertArrayHasKey('progress_percent', $unit);
            $this->assertArrayHasKey('completed', $unit);
            if ((int) $unit['id'] === (int) $fx['unit1_id']) {
                $unit1 = $unit;
            }
        }

        $this->assertNotNull($unit1);
        $this->assertSame(50.0, (float) $unit1['progress_percent']);
        $this->assertFalse((bool) $unit1['completed']);

        $foundContent = null;
        $foundQuiz = null;
        foreach ($unit1['lessons'] as $lesson) {
            $this->assertArrayHasKey('id', $lesson);
            $this->assertArrayHasKey('name', $lesson);
            $this->assertArrayHasKey('contents', $lesson);
            $this->assertArrayHasKey('quizesLesson', $lesson);
            foreach ($lesson['contents'] as $content) {
                $this->assertArrayHasKey('completed', $content);
                $this->assertArrayHasKey('reward_xp', $content);
                if ((int) $content['id'] === (int) $fx['content1_id']) {
                    $foundContent = $content;
                }
            }
            foreach ($lesson['quizesLesson'] as $quiz) {
                $this->assertArrayHasKey('completed', $quiz);
                $this->assertArrayHasKey('reward_xp', $quiz);
                $this->assertNull($quiz['reward_xp']);
                if ((int) $quiz['id'] === (int) $fx['quiz_id']) {
                    $foundQuiz = $quiz;
                }
            }
        }

        $this->assertNotNull($foundContent);
        $this->assertFalse((bool) $foundContent['completed']);
        $expectedXp = (int) config('student_xp.event_points.lesson_content', 30);
        $this->assertSame($expectedXp, (int) $foundContent['reward_xp']);
        if (! empty($fx['quiz_id'])) {
            $this->assertNotNull($foundQuiz);
            $this->assertFalse((bool) $foundQuiz['completed']);
        }
    }

    public function test_subject_games_adds_completed_without_dropping_progress(): void
    {
        $fx = $this->seedFixture();
        if (empty($fx['game_id']) || ! Schema::hasTable('games_students')) {
            $this->markTestSkipped('games / games_students unavailable.');
        }

        $gsId = (int) DB::table('games_students')->insertGetId([
            'game_id' => (int) $fx['game_id'],
            'student_id' => (int) $fx['student']->id,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $fx['game_student_ids'][] = $gsId;
        $this->fixture = $fx;

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/subjectGames/'.(int) $fx['subject_id']);

        $response->assertStatus(200);
        $response->assertJsonPath('status', true);
        $games = $response->json('games');
        $this->assertIsArray($games);
        $match = null;
        foreach ($games as $game) {
            if ((int) ($game['id'] ?? 0) === (int) $fx['game_id']) {
                $match = $game;
            }
        }
        $this->assertNotNull($match);
        $this->assertSame(100, (int) $match['progress']);
        $this->assertTrue((bool) $match['completed']);
        $this->assertNull($match['reward_xp']);
    }

    public function test_unauthorized_student_cannot_view_enriched_subject(): void
    {
        $fx = $this->seedFixture();
        $base = $fx['student'];
        $suffix = $fx['suffix'];

        $otherSchoolId = (int) DB::table('schools')->insertGetId([
            'name' => 'VSE School '.$suffix,
            'name_ar' => 'VSE',
            'contanct_number' => '000',
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $otherGradeId = (int) DB::table('grades')->insertGetId([
            'name' => 'VSE Grade '.$suffix,
            'school_id' => $otherSchoolId,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $outsiderId = (int) DB::table('students')->insertGetId([
            'name' => 'VSE Outsider '.$suffix,
            'username' => 'vse_out_'.substr(md5($suffix), 0, 12),
            'email' => 'vse-outsider-'.$suffix.'@example.test',
            'password' => $base->password ?? bcrypt('secret'),
            'school_id' => $otherSchoolId,
            'grade_id' => $otherGradeId,
            'class_id' => $base->class_id,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $fx['outsider_id'] = $outsiderId;
        $fx['outsider_school_id'] = $otherSchoolId;
        $fx['outsider_grade_id'] = $otherGradeId;
        $this->fixture = $fx;

        $outsider = Student::query()->findOrFail($outsiderId);
        $response = $this->withHeaders($this->studentHeaders($outsider))
            ->getJson('/api/student/viewSubject/'.(int) $fx['subject_id']);

        $this->assertTrue(in_array($response->status(), [403, 400], true));
    }
}
