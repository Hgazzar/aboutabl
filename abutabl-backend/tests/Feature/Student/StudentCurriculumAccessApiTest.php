<?php

namespace Tests\Feature\Student;

use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\Student;
use App\Services\Student\StudentCurriculumAccessService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Throwable;

/**
 * Free Curriculum Learning — view endpoints require enrollment, not assignments.
 */
class StudentCurriculumAccessApiTest extends TestCase
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
            $this->markTestSkipped('No active enrolled student available.');
        }

        $suffix = uniqid('acl_', true);
        $schoolId = (int) $student->school_id;
        $gradeId = (int) $student->grade_id;

        $subjectId = (int) DB::table('subjects')->insertGetId([
            'name' => "ACL {$suffix}",
            'name_ar' => 'ACL',
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

        $unitId = null;
        try {
            $unitId = (int) DB::table('units')->insertGetId([
                'name' => "ACL Unit {$suffix}",
                'name_ar' => 'ACL',
                'subject_id' => $subjectId,
                'status' => '1',
                'for_teacher' => '0',
                'type' => 'public',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (Throwable $e) {
            $unitId = null;
        }

        $lessonId = (int) DB::table('lessons')->insertGetId([
            'name_en' => "ACL A {$suffix}",
            'name_ar' => 'ACLA',
            'subject_id' => $subjectId,
            'unit_id' => $unitId,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $lessonA = Lessons::query()->findOrFail($lessonId);

        $contentId = (int) DB::table('lessons_contents')->insertGetId([
            'name_en' => "ACL CA {$suffix}",
            'name_ar' => 'ACLCA',
            'lesson_id' => $lessonId,
            'subject_id' => $subjectId,
            'unit_id' => $unitId,
            'type' => 'pdf',
            'status' => '1',
            'path' => 'storage/acl-placeholder.pdf',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $contentA = LessonsContents::query()->findOrFail($contentId);

        $this->fixture = [
            'student' => $student,
            'subject_id' => $subjectId,
            'school_id' => $schoolId,
            'grade_id' => $gradeId,
            'subjects_schools_id' => $subjectsSchoolsId,
            'subjects_grades_id' => $subjectsGradesId,
            'unit_id' => $unitId,
            'lesson_a' => $lessonA,
            'content_a' => $contentA,
            'suffix' => $suffix,
            'game_id' => null,
            'quiz_id' => null,
        ];

        return $this->fixture;
    }

    /**
     * Temporary student with different school/grade for cross-tenant checks.
     */
    private function makeOutsider(array $fx): Student
    {
        $base = $fx['student'];

        $otherSchoolId = (int) DB::table('schools')->insertGetId([
            'name' => 'ACL School '.$fx['suffix'],
            'name_ar' => 'ACL',
            'contanct_number' => '000',
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $otherGradeId = (int) DB::table('grades')->insertGetId([
            'name' => 'ACL Grade '.$fx['suffix'],
            'school_id' => $otherSchoolId,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $outsiderId = (int) DB::table('students')->insertGetId([
            'name' => 'ACL Outsider '.$fx['suffix'],
            'username' => 'acl_out_'.substr(md5($fx['suffix']), 0, 12),
            'email' => 'acl-outsider-'.$fx['suffix'].'@example.test',
            'password' => $base->password ?? bcrypt('secret'),
            'school_id' => $otherSchoolId,
            'grade_id' => $otherGradeId,
            'class_id' => $base->class_id,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->fixture['outsider_id'] = $outsiderId;
        $this->fixture['outsider_grade_id'] = $otherGradeId;
        $this->fixture['outsider_school_id'] = $otherSchoolId;

        return Student::query()->findOrFail($outsiderId);
    }

    private function destroyFixture(): void
    {
        if ($this->fixture === null) {
            return;
        }

        $fx = $this->fixture;
        $subjectId = (int) $fx['subject_id'];
        $lessonId = (int) $fx['lesson_a']->id;

        if (! empty($fx['game_id'])) {
            DB::table('games')->where('id', $fx['game_id'])->delete();
        }
        if (! empty($fx['quiz_id'])) {
            DB::table('quizes')->where('id', $fx['quiz_id'])->delete();
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

        DB::table('lessons_contents')->where('id', $fx['content_a']->id)->delete();
        DB::table('lessons_contents')->where('lesson_id', $lessonId)->delete();
        DB::table('lessons')->where('id', $lessonId)->delete();

        if (! empty($fx['unit_id'])) {
            DB::table('units')->where('id', $fx['unit_id'])->delete();
        }

        DB::table('subjects_grades')->where('id', $fx['subjects_grades_id'])->delete();
        DB::table('subjects_schools')->where('id', $fx['subjects_schools_id'])->delete();
        DB::table('subjects')->where('id', $subjectId)->delete();

        $this->fixture = null;
    }

    public function test_shared_enrollment_helper_matches_completion_rule(): void
    {
        $fx = $this->seedFixture();
        $access = app(StudentCurriculumAccessService::class);

        $this->assertTrue(
            $access->studentCanAccessSubject($fx['student'], (int) $fx['subject_id'])
        );

        $other = Student::query()
            ->where('id', '!=', $fx['student']->id)
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->where(function ($q) use ($fx) {
                $q->where('school_id', '!=', $fx['school_id'])
                    ->orWhere('grade_id', '!=', $fx['grade_id']);
            })
            ->first();

        if ($other !== null) {
            $this->assertFalse(
                $access->studentCanAccessSubject($other, (int) $fx['subject_id'])
            );
        }
    }

    public function test_enrolled_student_can_view_subject_without_assignment(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];

        $assignCount = (int) DB::table('assigns_students')
            ->join('assigns', 'assigns.id', '=', 'assigns_students.assign_id')
            ->where('assigns_students.student_id', $student->id)
            ->where('assigns.subject_id', $subjectId)
            ->count();
        $this->assertSame(0, $assignCount);

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/viewSubject/'.$subjectId);

        $response->assertStatus(200);
        $response->assertJsonPath('status', true);
        $response->assertJsonPath('basic_info.id', $subjectId);
    }

    public function test_enrolled_student_can_view_units_lessons_and_content_context(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];
        $lessonId = (int) $fx['lesson_a']->id;

        $units = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/subjectUnits/'.$subjectId);
        $units->assertStatus(200);
        $units->assertJsonPath('status', true);

        $lesson = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/lessons/show/'.$lessonId);
        $lesson->assertStatus(200);
        $lesson->assertJsonPath('status', true);
        $lesson->assertJsonPath('lesson.id', $lessonId);

        $view = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/viewSubject/'.$subjectId);
        $view->assertStatus(200);
        $payload = $view->json();
        $foundContent = false;
        foreach ($payload['units'] ?? [] as $unit) {
            foreach ($unit['lessons'] ?? [] as $lessonRow) {
                foreach ($lessonRow['contents'] ?? [] as $content) {
                    if ((int) ($content['id'] ?? 0) === (int) $fx['content_a']->id) {
                        $foundContent = true;
                    }
                }
            }
        }
        $this->assertTrue($foundContent, 'Continue Learning content must be visible via viewSubject');
    }

    public function test_enrolled_student_can_view_games_and_quizzes_lists(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];

        try {
            $gameId = (int) DB::table('games')->insertGetId([
                'name_en' => 'ACL Game '.$fx['suffix'],
                'name_ar' => 'ACL',
                'subject_id' => $subjectId,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $quizId = (int) DB::table('quizes')->insertGetId([
                'title_en' => 'ACL Quiz '.$fx['suffix'],
                'title_ar' => 'ACL',
                'subject_id' => $subjectId,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (Throwable $e) {
            $this->markTestSkipped('Unable to seed game/quiz rows: '.$e->getMessage());
        }

        $this->fixture['game_id'] = $gameId;
        $this->fixture['quiz_id'] = $quizId;

        $games = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/subjectGames/'.$subjectId);
        $games->assertStatus(200);
        $games->assertJsonPath('status', true);
        $this->assertTrue(collect($games->json('games'))->contains('id', $gameId));

        $gameView = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/games/show/'.$gameId);
        $gameView->assertStatus(200);
        $gameView->assertJsonPath('status', true);

        $quizes = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/quizesList/'.$subjectId);
        $quizes->assertStatus(200);
        $quizes->assertJsonPath('status', true);

        $quizView = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/quizes/show/'.$quizId);
        $quizView->assertStatus(200);
        $quizView->assertJsonPath('status', true);
    }

    public function test_other_school_or_grade_student_cannot_view_subject(): void
    {
        $fx = $this->seedFixture();
        $subjectId = (int) $fx['subject_id'];
        $outsider = $this->makeOutsider($fx);

        $response = $this->withHeaders($this->studentHeaders($outsider))
            ->getJson('/api/student/viewSubject/'.$subjectId);

        $response->assertStatus(403);
        $response->assertJsonPath('status', false);
        $this->assertArrayNotHasKey('basic_info', $response->json());
        $this->assertArrayNotHasKey('units', $response->json());
    }

    public function test_inactive_subject_mapping_is_rejected(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];

        DB::table('subjects_grades')
            ->where('id', $fx['subjects_grades_id'])
            ->update(['status' => '0']);

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/viewSubject/'.$subjectId);

        $response->assertStatus(403);
        $response->assertJsonPath('status', false);
    }

    public function test_inactive_lesson_is_rejected(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];
        $lesson = $fx['lesson_a'];
        DB::table('lessons')->where('id', $lesson->id)->update(['status' => '0']);

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/lessons/show/'.$lesson->id);

        $response->assertStatus(400);
        $response->assertJsonPath('status', false);
    }

    public function test_lesson_from_other_subject_is_rejected_for_unenrolled_student(): void
    {
        $fx = $this->seedFixture();
        $outsider = $this->makeOutsider($fx);

        $response = $this->withHeaders($this->studentHeaders($outsider))
            ->getJson('/api/student/lessons/show/'.$fx['lesson_a']->id);

        $response->assertStatus(403);
        $response->assertJsonPath('status', false);
        $this->assertArrayNotHasKey('contents', $response->json());
    }

    public function test_assignment_todo_endpoint_still_works(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/todaoList');

        $response->assertStatus(200);
        $response->assertJsonPath('status', true);
        $this->assertArrayHasKey('allAssigns', $response->json());
    }
}
