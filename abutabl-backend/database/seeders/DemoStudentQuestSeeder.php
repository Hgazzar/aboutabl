<?php

namespace Database\Seeders;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use App\Services\Student\StudentDashboardService;
use App\Services\Student\StudentQuestService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds unit lessons + partial completion so Widget 7 (Your Quests) shows real quest data.
 *
 * Run:
 *   php artisan db:seed --class=DemoStudentQuestSeeder
 */
class DemoStudentQuestSeeder extends Seeder
{
    private const STUDENT_USERNAME = 'AKAIS1119';

    private const UNIT_NAME_EN = 'Demo Unit — Quest QA';

    private const UNIT_NAME_AR = 'وحدة تجريبية — مهام';

    private const COMPLETION_SOURCE = 'demo_quest_seed';

    public function run(): void
    {
        $student = Student::query()->where('username', self::STUDENT_USERNAME)->first();
        if (! $student) {
            $this->command->error('Student '.self::STUDENT_USERNAME.' not found.');

            return;
        }

        /** @var StudentDashboardService $dashboard */
        $dashboard = app(StudentDashboardService::class);
        $subjectIds = $dashboard->subjectIdsForStudent($student);
        if ($subjectIds === []) {
            $this->command->error('Student has no scoped subjects; cannot seed quest data.');

            return;
        }

        $subjectId = (int) $subjectIds[0];
        $subject = Subject::query()->find($subjectId);
        if (! $subject) {
            $this->command->error('Subject #'.$subjectId.' not found.');

            return;
        }

        DB::transaction(function () use ($student, $subject, $subjectId) {
            $unitId = $this->ensureDemoUnit($subjectId, (int) $student->school_id);
            $lessonIds = $this->ensureUnitLessons($subjectId, $unitId);
            $this->seedPartialLessonCompletion((int) $student->id, $subjectId, $lessonIds);
            $this->seedDemoAssignment($student, $subject);
        });

        /** @var StudentQuestService $quests */
        $quests = app(StudentQuestService::class);
        $payload = $quests->buildDashboardPayload(
            (int) $student->id,
            (int) $student->school_id,
            $subjectIds
        );

        $this->command->info(
            'Seeded quest demo data for '.self::STUDENT_USERNAME.' (student #'.$student->id.').'
        );
        $this->command->info('Quest payload: '.json_encode($payload));
        $this->command->info('Refresh http://127.0.0.1:5173/learn (hard refresh if cached).');
    }

    private function ensureDemoUnit(int $subjectId, int $schoolId): int
    {
        $existing = DB::table('units')
            ->where('subject_id', $subjectId)
            ->where('name', self::UNIT_NAME_EN)
            ->value('id');

        if ($existing) {
            return (int) $existing;
        }

        return (int) DB::table('units')->insertGetId([
            'name' => self::UNIT_NAME_EN,
            'name_ar' => self::UNIT_NAME_AR,
            'status' => '1',
            'type' => 'public',
            'subject_id' => $subjectId,
            'school_id' => $schoolId,
            'created_by' => null,
            'for_teacher' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return int[]
     */
    private function ensureUnitLessons(int $subjectId, int $unitId): array
    {
        $lessonIds = DB::table('lessons')
            ->where('subject_id', $subjectId)
            ->where(function ($query) use ($unitId) {
                $query->where('unit_id', $unitId)
                    ->orWhereNull('unit_id');
            })
            ->where(function ($query) {
                $query->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy('id')
            ->limit(3)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        DB::table('lessons')
            ->whereIn('id', $lessonIds)
            ->update([
                'unit_id' => $unitId,
                'updated_at' => now(),
            ]);

        while (count($lessonIds) < 3) {
            $index = count($lessonIds) + 1;
            $lessonIds[] = (int) DB::table('lessons')->insertGetId([
                'name_en' => 'Demo Quest Lesson '.$index,
                'name_ar' => 'درس مهمة تجريبي '.$index,
                'subject_id' => $subjectId,
                'unit_id' => $unitId,
                'created_by' => null,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return array_values(array_unique($lessonIds));
    }

    /**
     * @param  int[]  $lessonIds
     */
    private function seedPartialLessonCompletion(int $studentId, int $subjectId, array $lessonIds): void
    {
        if ($lessonIds === []) {
            return;
        }

        $completedLessonId = $lessonIds[0];
        $exists = DB::table('student_lesson_completions')
            ->where('student_id', $studentId)
            ->where('lesson_id', $completedLessonId)
            ->exists();

        if ($exists) {
            return;
        }

        DB::table('student_lesson_completions')->insert([
            'student_id' => $studentId,
            'lesson_id' => $completedLessonId,
            'subject_id' => $subjectId,
            'completed_at' => Carbon::now()->subHours(2),
            'completion_source' => self::COMPLETION_SOURCE,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedDemoAssignment(Student $student, Subject $subject): void
    {
        $title = 'Demo Assignment — '.$subject->name;

        $alreadyAssigned = DB::table('assigns_students')
            ->where('student_id', $student->id)
            ->whereExists(function ($query) use ($title) {
                $query->select(DB::raw(1))
                    ->from('assigns')
                    ->whereColumn('assigns.id', 'assigns_students.assign_id')
                    ->where('assigns.assigned_name', $title);
            })
            ->exists();

        if ($alreadyAssigned) {
            return;
        }

        $teacherId = User::query()->orderBy('id')->value('id');
        if (! $teacherId) {
            return;
        }

        $assignId = (int) DB::table('assigns')->insertGetId([
            'type' => 'subjects',
            'type_id' => $subject->id,
            'assigned_name' => $title,
            'assigned_path' => url('/api/subject/show/'.$subject->id),
            'school_id' => $student->school_id,
            'status' => 1,
            'created_by' => $teacherId,
            'subject_id' => $subject->id,
            'due_at' => now()->addDays(5)->endOfDay(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('assigns_students')->insert([
            'assign_id' => $assignId,
            'type' => 'subjects',
            'type_id' => $subject->id,
            'student_id' => $student->id,
            'school_id' => $student->school_id,
            'status' => 1,
            'created_by' => $teacherId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
