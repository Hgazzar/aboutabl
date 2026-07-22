<?php

namespace Tests\Support;

use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\Student;
use App\Models\StudentLessonCompletion;
use App\Models\StudentLessonContentCompletion;
use App\Models\StudentSubjectProgress;
use App\Models\subjectsSchools;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * F-031 — Live MySQL fixtures for Lesson Progress pipeline validation.
 */
trait LessonProgressFixtures
{
    /** @var array<string,mixed>|null */
    private $f031Fixture;

    /**
     * Isolated subject + two active lessons + one PDF content on lesson A.
     * Uses teacher 179 / class 21 / student in that class when available.
     *
     * @return array{
     *   student:Student,
     *   teacher_id:int,
     *   class_id:int,
     *   subject_id:int,
     *   school_id:int,
     *   grade_id:int,
     *   subjects_schools_id:int,
     *   subjects_grades_id:int,
     *   lesson_a:Lessons,
     *   lesson_b:Lessons,
     *   content_a:LessonsContents,
     *   suffix:string
     * }
     */
    protected function createF031Fixture(): array
    {
        $teacherId = 179;
        $classId = 21;

        $student = Student::query()
            ->where('class_id', $classId)
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy('id')
            ->first();

        if ($student === null || ! $student->school_id || ! $student->grade_id) {
            throw new RuntimeException('F-031 fixture requires an active student in class 21.');
        }

        if (! DB::table('subjects')->where('id', 10)->exists()) {
            throw new RuntimeException('F-031 fixture requires subject id 10.');
        }

        $suffix = uniqid('f031_', true);
        $schoolId = (int) $student->school_id;
        $gradeId = (int) $student->grade_id;

        // Dedicated subject so Progress denominator is controlled (not polluted by subject 10 curriculum).
        $subjectId = (int) DB::table('subjects')->insertGetId([
            'name' => "F031 {$suffix}",
            'name_ar' => 'F031',
            'slug' => 'f031-'.$suffix,
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

        // Ensure teacher assignment can see subject for dashboard scope.
        $tgExists = DB::table('teachers_grades')
            ->where('user_id', $teacherId)
            ->where('class_id', $classId)
            ->where('subject_id', $subjectId)
            ->exists();
        if (! $tgExists) {
            DB::table('teachers_grades')->insert([
                'user_id' => $teacherId,
                'grade_id' => $gradeId,
                'class_id' => $classId,
                'subject_id' => $subjectId,
                'school_id' => $schoolId,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $lessonA = Lessons::query()->create([
            'name_en' => "F031 A {$suffix}",
            'name_ar' => 'F031A',
            'subject_id' => $subjectId,
            'status' => '1',
        ]);
        $lessonB = Lessons::query()->create([
            'name_en' => "F031 B {$suffix}",
            'name_ar' => 'F031B',
            'subject_id' => $subjectId,
            'status' => '1',
        ]);

        $contentA = LessonsContents::query()->create([
            'name_en' => "F031 CA {$suffix}",
            'name_ar' => 'F031CA',
            'lesson_id' => $lessonA->id,
            'subject_id' => $subjectId,
            'type' => 'pdf',
            'status' => '1',
            'path' => 'storage/f031-placeholder.pdf',
        ]);

        $this->f031Fixture = [
            'student' => $student,
            'teacher_id' => $teacherId,
            'class_id' => $classId,
            'subject_id' => $subjectId,
            'school_id' => $schoolId,
            'grade_id' => $gradeId,
            'subjects_schools_id' => $subjectsSchoolsId,
            'subjects_grades_id' => $subjectsGradesId,
            'lesson_a' => $lessonA,
            'lesson_b' => $lessonB,
            'content_a' => $contentA,
            'suffix' => $suffix,
        ];

        return $this->f031Fixture;
    }

    protected function destroyF031Fixture(?array $fixture = null): void
    {
        $fixture = $fixture ?? $this->f031Fixture;
        if ($fixture === null) {
            return;
        }

        $studentId = (int) $fixture['student']->id;
        $subjectId = (int) $fixture['subject_id'];
        $lessonIds = [
            (int) $fixture['lesson_a']->id,
            (int) $fixture['lesson_b']->id,
        ];

        StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->whereIn('lesson_id', $lessonIds)
            ->delete();
        StudentLessonCompletion::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->delete();
        StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId) {
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->delete();
        });

        if (isset($fixture['content_a'])) {
            LessonsContents::query()->where('id', $fixture['content_a']->id)->delete();
        }
        LessonsContents::query()->whereIn('lesson_id', $lessonIds)->delete();
        Lessons::query()->whereIn('id', $lessonIds)->delete();
        Lessons::query()->where('subject_id', $subjectId)->where('name_en', 'like', 'F031%')->delete();

        DB::table('teachers_grades')
            ->where('user_id', $fixture['teacher_id'])
            ->where('subject_id', $subjectId)
            ->delete();
        DB::table('subjects_grades')->where('id', $fixture['subjects_grades_id'])->delete();
        DB::table('subjects_schools')->where('id', $fixture['subjects_schools_id'])->delete();
        DB::table('subjects')->where('id', $subjectId)->delete();

        if (\Illuminate\Support\Facades\Schema::hasTable('performance_facts')) {
            DB::table('performance_facts')
                ->where('student_id', $studentId)
                ->where('source', 'progress_updated')
                ->where('source_type', StudentSubjectProgress::class)
                ->delete();
        }

        $this->f031Fixture = null;
    }

    protected function explicitConfirmEvidence(): array
    {
        return [
            'kind' => 'explicit_confirm',
            'client_event_id' => (string) \Illuminate\Support\Str::uuid(),
            'occurred_at' => now()->toIso8601String(),
            'viewer' => ['loaded' => true],
        ];
    }
}
