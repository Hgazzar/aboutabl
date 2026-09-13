<?php

namespace Tests\Feature\Student;

use App\Models\Student;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * Feature F — getSubjects.progress uses My Progress unit-based SSOT (not games_students).
 */
class StudentGetSubjectsProgressApiTest extends TestCase
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
     * Two countable units (each with one active lesson). Empty unit is ignored by My Progress SSOT.
     *
     * @return array<string,mixed>
     */
    private function seedFixture(): array
    {
        $this->requireDb();

        if (! Schema::hasTable('student_lesson_completions')) {
            $this->markTestSkipped('student_lesson_completions missing.');
        }

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

        $suffix = uniqid('gsp_', true);
        $schoolId = (int) $student->school_id;
        $gradeId = (int) $student->grade_id;

        $subjectId = (int) DB::table('subjects')->insertGetId([
            'name' => "GSP {$suffix}",
            'name_ar' => 'GSP',
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
            'name' => "GSP U1 {$suffix}",
            'name_ar' => 'U1',
            'subject_id' => $subjectId,
            'status' => '1',
            'for_teacher' => '0',
            'type' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $unit2Id = (int) DB::table('units')->insertGetId([
            'name' => "GSP U2 {$suffix}",
            'name_ar' => 'U2',
            'subject_id' => $subjectId,
            'status' => '1',
            'for_teacher' => '0',
            'type' => 'public',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $lesson1Id = (int) DB::table('lessons')->insertGetId([
            'name_en' => "GSP L1 {$suffix}",
            'name_ar' => 'L1',
            'subject_id' => $subjectId,
            'unit_id' => $unit1Id,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $lesson2aId = (int) DB::table('lessons')->insertGetId([
            'name_en' => "GSP L2a {$suffix}",
            'name_ar' => 'L2a',
            'subject_id' => $subjectId,
            'unit_id' => $unit2Id,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $lesson2bId = (int) DB::table('lessons')->insertGetId([
            'name_en' => "GSP L2b {$suffix}",
            'name_ar' => 'L2b',
            'subject_id' => $subjectId,
            'unit_id' => $unit2Id,
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $gameId = null;
        $gameStudentId = null;
        if (Schema::hasTable('games') && Schema::hasTable('games_students') && Schema::hasColumn('games', 'subject_id')) {
            $gameId = (int) DB::table('games')->insertGetId([
                'name_en' => "GSP Game {$suffix}",
                'name_ar' => 'Game',
                'subject_id' => $subjectId,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $gameStudentId = (int) DB::table('games_students')->insertGetId([
                'game_id' => $gameId,
                'student_id' => $student->id,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
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
            'lesson2a_id' => $lesson2aId,
            'lesson2b_id' => $lesson2bId,
            'game_id' => $gameId,
            'game_student_id' => $gameStudentId,
            'foreign_subject_id' => null,
            'foreign_ss_id' => null,
            'foreign_sg_id' => null,
            'completion_ids' => [],
            'suffix' => $suffix,
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
            if (! empty($fx['completion_ids']) && Schema::hasTable('student_lesson_completions')) {
                DB::table('student_lesson_completions')->whereIn('id', $fx['completion_ids'])->delete();
            }
            if (! empty($fx['game_student_id']) && Schema::hasTable('games_students')) {
                DB::table('games_students')->where('id', $fx['game_student_id'])->delete();
            }
            if (! empty($fx['game_id']) && Schema::hasTable('games')) {
                DB::table('games')->where('id', $fx['game_id'])->delete();
            }
            foreach (['lesson1_id', 'lesson2a_id', 'lesson2b_id'] as $key) {
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
            if (! empty($fx['foreign_sg_id'])) {
                DB::table('subjects_grades')->where('id', $fx['foreign_sg_id'])->delete();
            }
            if (! empty($fx['foreign_ss_id'])) {
                DB::table('subjects_schools')->where('id', $fx['foreign_ss_id'])->delete();
            }
            if (! empty($fx['foreign_subject_id'])) {
                DB::table('subjects')->where('id', $fx['foreign_subject_id'])->delete();
            }
            if (! empty($fx['created_grade_id'])) {
                DB::table('grades')->where('id', $fx['created_grade_id'])->delete();
            }
            if (! empty($fx['subject_id'])) {
                DB::table('subjects')->where('id', $fx['subject_id'])->delete();
            }
        } catch (Throwable $e) {
            // best-effort cleanup
        }

        $this->fixture = null;
    }

    private function completeLesson(int $studentId, int $lessonId, int $subjectId): void
    {
        $id = (int) DB::table('student_lesson_completions')->insertGetId([
            'student_id' => $studentId,
            'lesson_id' => $lessonId,
            'subject_id' => $subjectId,
            'completed_at' => now(),
            'completion_source' => 'test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->fixture['completion_ids'][] = $id;
    }

    /**
     * @return array<string,mixed>|null
     */
    private function findSubjectRow(array $subjects, int $subjectId): ?array
    {
        foreach ($subjects as $row) {
            if ((int) ($row['id'] ?? 0) === $subjectId) {
                return $row;
            }
        }

        return null;
    }

    public function test_get_subjects_progress_matches_unit_lesson_completion(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];

        // Complete unit 1 only → 1/2 units = 50%
        $this->completeLesson((int) $student->id, (int) $fx['lesson1_id'], $subjectId);

        $res = $this->withHeaders($this->studentHeaders($student))->getJson('/api/student/getSubjects');
        $res->assertStatus(200);
        $subjects = $res->json('subjects') ?? [];
        $this->assertIsArray($subjects);
        $row = $this->findSubjectRow($subjects, $subjectId);
        $this->assertNotNull($row);
        $this->assertEqualsWithDelta(50.0, (float) $row['progress'], 0.01);

        $mp = $this->withHeaders($this->studentHeaders($student))->getJson('/api/student/my-progress');
        $mp->assertStatus(200);
        $books = $mp->json('my_progress.books') ?? [];
        $book = null;
        foreach ($books as $b) {
            if ((int) ($b['subject_id'] ?? 0) === $subjectId) {
                $book = $b;
                break;
            }
        }
        $this->assertNotNull($book);
        $this->assertEqualsWithDelta((float) $book['progress_percent'], (float) $row['progress'], 0.01);
    }

    public function test_game_students_alone_does_not_increase_get_subjects_progress(): void
    {
        $fx = $this->seedFixture();
        if (empty($fx['game_student_id'])) {
            $this->markTestSkipped('games/games_students unavailable.');
        }

        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];

        $res = $this->withHeaders($this->studentHeaders($student))->getJson('/api/student/getSubjects');
        $res->assertStatus(200);
        $subjects = $res->json('subjects') ?? [];
        $row = $this->findSubjectRow($subjects, $subjectId);
        $this->assertNotNull($row);
        $this->assertEqualsWithDelta(0.0, (float) $row['progress'], 0.01);
    }

    public function test_partial_lesson_completion_does_not_complete_unit(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];

        // Unit 2 has two lessons; complete only one → unit 2 incomplete; unit 1 incomplete → 0%
        $this->completeLesson((int) $student->id, (int) $fx['lesson2a_id'], $subjectId);

        $res = $this->withHeaders($this->studentHeaders($student))->getJson('/api/student/getSubjects');
        $res->assertStatus(200);
        $subjects = $res->json('subjects') ?? [];
        $row = $this->findSubjectRow($subjects, $subjectId);
        $this->assertNotNull($row);
        $this->assertEqualsWithDelta(0.0, (float) $row['progress'], 0.01);
    }

    public function test_completing_all_lessons_in_unit_increases_subject_progress(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];

        $this->completeLesson((int) $student->id, (int) $fx['lesson1_id'], $subjectId);
        $this->completeLesson((int) $student->id, (int) $fx['lesson2a_id'], $subjectId);
        $this->completeLesson((int) $student->id, (int) $fx['lesson2b_id'], $subjectId);

        $res = $this->withHeaders($this->studentHeaders($student))->getJson('/api/student/getSubjects');
        $res->assertStatus(200);
        $subjects = $res->json('subjects') ?? [];
        $row = $this->findSubjectRow($subjects, $subjectId);
        $this->assertNotNull($row);
        $this->assertEqualsWithDelta(100.0, (float) $row['progress'], 0.01);
    }

    public function test_enrollment_filter_excludes_unenrolled_subject(): void
    {
        $fx = $this->seedFixture();
        $student = $fx['student'];

        $otherGrade = DB::table('grades')
            ->where('id', '!=', $fx['grade_id'])
            ->orderBy('id')
            ->value('id');
        if ($otherGrade === null) {
            // Create a disposable grade so enrollment filter can be asserted without a second seed school.
            $gradeRow = [
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('grades', 'name')) {
                $gradeRow['name'] = 'GSP Grade '.$fx['suffix'];
            }
            if (Schema::hasColumn('grades', 'name_ar')) {
                $gradeRow['name_ar'] = 'GSP';
            }
            if (Schema::hasColumn('grades', 'status')) {
                $gradeRow['status'] = '1';
            }
            $otherGrade = (int) DB::table('grades')->insertGetId($gradeRow);
            $this->fixture['created_grade_id'] = $otherGrade;
        }

        $foreignSubjectId = (int) DB::table('subjects')->insertGetId([
            'name' => 'GSP Foreign '.$fx['suffix'],
            'name_ar' => 'Foreign',
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $foreignSs = (int) DB::table('subjects_schools')->insertGetId([
            'subject_id' => $foreignSubjectId,
            'school_id' => $fx['school_id'],
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $foreignSg = (int) DB::table('subjects_grades')->insertGetId([
            'subjects_schools_id' => $foreignSs,
            'subject_id' => $foreignSubjectId,
            'grade_id' => (int) $otherGrade,
            'school_id' => $fx['school_id'],
            'status' => '1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->fixture['foreign_subject_id'] = $foreignSubjectId;
        $this->fixture['foreign_ss_id'] = $foreignSs;
        $this->fixture['foreign_sg_id'] = $foreignSg;

        $res = $this->withHeaders($this->studentHeaders($student))->getJson('/api/student/getSubjects');
        $res->assertStatus(200);
        $subjects = $res->json('subjects') ?? [];
        $this->assertNull($this->findSubjectRow($subjects, $foreignSubjectId));
        $this->assertNotNull($this->findSubjectRow($subjects, (int) $fx['subject_id']));
    }

    public function test_subject_games_and_certificates_still_use_games_students(): void
    {
        $fx = $this->seedFixture();
        if (empty($fx['game_id'])) {
            $this->markTestSkipped('games/games_students unavailable.');
        }

        $student = $fx['student'];
        $subjectId = (int) $fx['subject_id'];

        $gamesRes = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/subjectGames/'.$subjectId);
        $gamesRes->assertStatus(200);
        $games = $gamesRes->json('games') ?? [];
        $this->assertNotEmpty($games);
        $gameRow = null;
        foreach ($games as $g) {
            if ((int) ($g['id'] ?? 0) === (int) $fx['game_id']) {
                $gameRow = $g;
                break;
            }
        }
        $this->assertNotNull($gameRow);
        $this->assertEquals(100, (int) $gameRow['progress']);

        // Certificates: subject with 100% game assign progress may appear when all games done.
        $certRes = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/certificates');
        $certRes->assertStatus(200);
        $certs = $certRes->json('certificates') ?? [];
        $this->assertIsArray($certs);
        $found = false;
        foreach ($certs as $c) {
            if ((int) ($c['id'] ?? 0) === $subjectId) {
                $found = true;
                $this->assertEquals(100, (int) ($c['progress'] ?? 0));
                break;
            }
        }
        $this->assertTrue($found, 'earnedCertificates should still list subject when all games_students complete');
    }
}
