<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use App\Repositories\StudentSubjectProgressRepository;
use App\Services\Student\StudentDashboardService;
use App\Services\Student\StudentXpService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Full student-dashboard demo data for local Widget QA (AKAIS1119 / ali).
 *
 * Run:
 *   php artisan db:seed --class=DemoStudentDashboardSeeder
 *
 * Then hard-refresh http://127.0.0.1:5173/learn (or /todo → /learn).
 */
class DemoStudentDashboardSeeder extends Seeder
{
    private const STUDENT_USERNAME = 'AKAIS1119';

    private const DEMO_MARKER = 'demo_dashboard_seed';

    private const UNIT_NAME_EN = 'Demo Unit — Quest QA';

    private const UNIT_NAME_AR = 'وحدة تجريبية — مهام';

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
            $this->command->error('Student has no scoped subjects.');

            return;
        }

        $subjectId = (int) $subjectIds[0];
        $subject = Subject::query()->find($subjectId);
        if (! $subject) {
            $this->command->error('Subject #'.$subjectId.' not found.');

            return;
        }

        DB::transaction(function () use ($student, $subject, $subjectId, $subjectIds) {
            $teacherId = $this->ensureDemoTeacher($student);
            $this->ensureTeacherGradeLink($student, $teacherId, $subjectId);
            $classmateIds = $this->ensureClassmates($student);
            $this->ensureSubjectProgress($student, $classmateIds, $subjectId);
            $unitId = $this->ensureDemoUnit($subjectId, (int) $student->school_id);
            $lessonIds = $this->ensureUnitLessons($subjectId, $unitId);
            $this->ensureQuestProgress((int) $student->id, $subjectId, $lessonIds);
            $this->ensureRecentActivities((int) $student->id, $subjectId, $lessonIds);
            $this->ensureContinueLearningContent((int) $student->id, $subjectId, $lessonIds);
            $this->ensureAssignments($student, $subject, $teacherId);
            $this->ensureNotification((int) $student->id, (string) $subject->name);
        });

        /** @var StudentXpService $xp */
        $xp = app(StudentXpService::class);
        $xp->syncAndGet((int) $student->id);

        $payload = $dashboard->build((int) $student->id, 'week');
        $summary = [
            'assignments_new' => $payload['assignments']['new_count'] ?? 0,
            'todo' => count($payload['assignments']['tabs']['todo'] ?? []),
            'past_due' => count($payload['assignments']['tabs']['past_due'] ?? []),
            'completed' => count($payload['assignments']['tabs']['completed'] ?? []),
            'quests' => ($payload['quests']['available'] ?? false) ? count($payload['quests']['items'] ?? []) : 0,
            'recent' => count($payload['recent_activities']['items'] ?? []),
            'rankings' => $payload['rankings']['available'] ?? false,
            'streak' => $payload['streak']['current_streak'] ?? 0,
            'continue_learning' => $payload['continue_learning']['available'] ?? false,
            'xp' => $payload['xp']['total_xp'] ?? 0,
        ];

        $this->command->info('Seeded full dashboard demo for '.self::STUDENT_USERNAME.' (#'.$student->id.').');
        $this->command->info('Dashboard summary: '.json_encode($summary));
        $this->command->info('Open http://127.0.0.1:5173/learn and hard-refresh if cached.');
    }

    private function ensureDemoTeacher(Student $student): int
    {
        $existing = User::query()->where('username', 'demo_dashboard_teacher')->value('id');
        if ($existing) {
            return (int) $existing;
        }

        return (int) User::query()->insertGetId([
            'name' => 'Demo Dashboard Teacher',
            'name_ar' => 'معلم تجريبي',
            'username' => 'demo_dashboard_teacher',
            'email' => 'demo-dashboard-teacher@test.local',
            'phone' => '01000000001',
            'type' => 'teacher',
            'password' => Hash::make('123456789'),
            'defaultPassword' => '123456789',
            'verify' => '1',
            'status' => '1',
            'school_id' => $student->school_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function ensureTeacherGradeLink(Student $student, int $teacherId, int $subjectId): void
    {
        $exists = DB::table('teachers_grades')
            ->where('user_id', $teacherId)
            ->where('class_id', $student->class_id)
            ->where('grade_id', $student->grade_id)
            ->where('subject_id', $subjectId)
            ->exists();

        if ($exists) {
            return;
        }

        DB::table('teachers_grades')->insert([
            'user_id' => $teacherId,
            'grade_id' => $student->grade_id,
            'class_id' => $student->class_id,
            'subject_id' => $subjectId,
            'status' => 1,
            'school_id' => $student->school_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return int[]
     */
    private function ensureClassmates(Student $student): array
    {
        $peers = [
            ['username' => 'DEMOPEER01', 'name' => 'Sara', 'name_ar' => 'سارة'],
            ['username' => 'DEMOPEER02', 'name' => 'Omar', 'name_ar' => 'عمر'],
        ];

        $ids = [];
        foreach ($peers as $peer) {
            $row = Student::query()->where('username', $peer['username'])->first();
            if (! $row) {
                $id = (int) DB::table('students')->insertGetId([
                    'username' => $peer['username'],
                    'memberShip' => $peer['username'],
                    'name' => $peer['name'],
                    'name_ar' => $peer['name_ar'],
                    'password' => Hash::make('DemoPeer123'),
                    'defaultPassword' => 'DemoPeer123',
                    'verify' => '1',
                    'status' => '1',
                    'api_token' => Str::random(60),
                    'school_id' => $student->school_id,
                    'grade_id' => $student->grade_id,
                    'class_id' => $student->class_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $ids[] = $id;
            } else {
                $ids[] = (int) $row->id;
            }
        }

        return $ids;
    }

    /**
     * @param  int[]  $classmateIds
     */
    private function ensureSubjectProgress(Student $student, array $classmateIds, int $subjectId): void
    {
        /** @var StudentSubjectProgressRepository $repo */
        $repo = app(StudentSubjectProgressRepository::class);

        $targets = [
            (int) $student->id => 78.0,
        ];

        if (isset($classmateIds[0])) {
            $targets[$classmateIds[0]] = 92.0;
        }
        if (isset($classmateIds[1])) {
            $targets[$classmateIds[1]] = 65.0;
        }

        foreach ($targets as $studentId => $value) {
            $repo->saveProgress($studentId, $subjectId, $value);
        }
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
                $query->where('unit_id', $unitId)->orWhereNull('unit_id');
            })
            ->where(function ($query) {
                $query->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy('id')
            ->limit(3)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($lessonIds !== []) {
            DB::table('lessons')
                ->whereIn('id', $lessonIds)
                ->update(['unit_id' => $unitId, 'updated_at' => now()]);
        }

        while (count($lessonIds) < 3) {
            $index = count($lessonIds) + 1;
            $lessonIds[] = (int) DB::table('lessons')->insertGetId([
                'name_en' => 'Demo Dashboard Lesson '.$index,
                'name_ar' => 'درس لوحة '.$index,
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
    private function ensureQuestProgress(int $studentId, int $subjectId, array $lessonIds): void
    {
        if ($lessonIds === []) {
            return;
        }

        $completedLessonIds = array_slice($lessonIds, 0, min(2, count($lessonIds)));
        $offsets = [Carbon::now()->subHours(8), Carbon::now()->subDay()];

        foreach ($completedLessonIds as $index => $lessonId) {
            $exists = DB::table('student_lesson_completions')
                ->where('student_id', $studentId)
                ->where('lesson_id', $lessonId)
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('student_lesson_completions')->insert([
                'student_id' => $studentId,
                'lesson_id' => $lessonId,
                'subject_id' => $subjectId,
                'completed_at' => $offsets[$index] ?? Carbon::now()->subDay(),
                'completion_source' => self::DEMO_MARKER,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * @param  int[]  $lessonIds
     */
    private function ensureRecentActivities(int $studentId, int $subjectId, array $lessonIds): void
    {
        $pairs = [
            [
                'lesson_en' => 'Demo — Phonics Intro',
                'lesson_ar' => 'تجريبي — مقدمة الصوتيات',
                'content_en' => 'Long Vowel Sounds — Chapter Introduction',
                'content_ar' => 'القراءة والاستماع — الأصوات الطويلة والتعرف على الحروف',
                'completed_at' => Carbon::now()->subHours(5),
            ],
            [
                'lesson_en' => 'Demo — Sight Words',
                'lesson_ar' => 'تجريبي — كلمات شائعة',
                'content_en' => 'Sight Words Set 1',
                'content_ar' => 'مجموعة الكلمات الشائعة الأولى',
                'completed_at' => Carbon::now()->subDay(),
            ],
            [
                'lesson_en' => 'Demo — Letter Aa',
                'lesson_ar' => 'تجريبي — الحرف Aa',
                'content_en' => 'Letter Aa',
                'content_ar' => 'الحرف Aa',
                'completed_at' => Carbon::now()->subDays(2),
            ],
            [
                'lesson_en' => 'Demo — Number 1',
                'lesson_ar' => 'تجريبي — الرقم 1',
                'content_en' => 'Number 1',
                'content_ar' => 'الرقم 1',
                'completed_at' => Carbon::now()->subDays(4),
            ],
        ];

        foreach ($pairs as $index => $pair) {
            $lessonId = $lessonIds[$index] ?? $lessonIds[0];
            $contentId = DB::table('lessons_contents')
                ->where('lesson_id', $lessonId)
                ->where('name_en', $pair['content_en'])
                ->value('id');

            if (! $contentId) {
                $contentId = DB::table('lessons_contents')->insertGetId([
                    'name_en' => $pair['content_en'],
                    'name_ar' => $pair['content_ar'],
                    'about_en' => null,
                    'about_ar' => null,
                    'subject_id' => $subjectId,
                    'unit_id' => DB::table('lessons')->where('id', $lessonId)->value('unit_id'),
                    'lesson_id' => $lessonId,
                    'type' => 'text',
                    'size' => null,
                    'path' => null,
                    'created_by' => null,
                    'status' => 1,
                    'privacy' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $exists = DB::table('student_lesson_content_completions')
                ->where('student_id', $studentId)
                ->where('lesson_content_id', $contentId)
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('student_lesson_content_completions')->insert([
                'student_id' => $studentId,
                'lesson_content_id' => $contentId,
                'lesson_id' => $lessonId,
                'completed_at' => $pair['completed_at'],
                'completion_source' => self::DEMO_MARKER,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * @param  int[]  $lessonIds
     */
    private function ensureContinueLearningContent(int $studentId, int $subjectId, array $lessonIds): void
    {
        $lessonId = $lessonIds[0] ?? null;
        if (! $lessonId) {
            return;
        }

        $contentId = DB::table('lessons_contents')
            ->where('lesson_id', $lessonId)
            ->where('name_en', 'Letter Bb')
            ->value('id');

        if (! $contentId) {
            DB::table('lessons_contents')->insert([
                'name_en' => 'Letter Bb',
                'name_ar' => 'الحرف Bb',
                'about_en' => null,
                'about_ar' => null,
                'subject_id' => $subjectId,
                'unit_id' => DB::table('lessons')->where('id', $lessonId)->value('unit_id'),
                'lesson_id' => $lessonId,
                'type' => 'text',
                'size' => null,
                'path' => null,
                'created_by' => null,
                'status' => 1,
                'privacy' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function ensureAssignments(Student $student, Subject $subject, int $teacherId): void
    {
        $definitions = [
            [
                'title' => '[Demo] English Reading — Todo',
                'due_at' => now()->addDays(4)->endOfDay(),
                'opened_at' => null,
            ],
            [
                'title' => '[Demo] English Vocabulary — Todo',
                'due_at' => now()->addDays(7)->endOfDay(),
                'opened_at' => null,
            ],
            [
                'title' => '[Demo] English Grammar — Past Due',
                'due_at' => now()->subDays(2)->endOfDay(),
                'opened_at' => null,
            ],
            [
                'title' => '[Demo] English Intro — Completed',
                'due_at' => now()->subDays(10)->endOfDay(),
                'opened_at' => now()->subDays(8),
            ],
        ];

        foreach ($definitions as $definition) {
            $assignId = DB::table('assigns')
                ->where('assigned_name', $definition['title'])
                ->value('id');

            if (! $assignId) {
                $assignId = DB::table('assigns')->insertGetId([
                    'type' => 'subjects',
                    'type_id' => $subject->id,
                    'assigned_name' => $definition['title'],
                    'assigned_path' => url('/api/subject/show/'.$subject->id),
                    'school_id' => $student->school_id,
                    'status' => 1,
                    'created_by' => $teacherId,
                    'subject_id' => $subject->id,
                    'due_at' => $definition['due_at'],
                    'created_at' => now()->subDays(5),
                    'updated_at' => now(),
                ]);
            }

            $rowExists = DB::table('assigns_students')
                ->where('assign_id', $assignId)
                ->where('student_id', $student->id)
                ->exists();

            if ($rowExists) {
                continue;
            }

            DB::table('assigns_students')->insert([
                'assign_id' => $assignId,
                'type' => 'subjects',
                'type_id' => $subject->id,
                'student_id' => $student->id,
                'school_id' => $student->school_id,
                'status' => 1,
                'opened_at' => $definition['opened_at'],
                'created_by' => $teacherId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function ensureNotification(int $studentId, string $subjectName): void
    {
        $title = '[Demo] New assignment in '.$subjectName;
        $exists = Notification::query()
            ->where('to_user_type', 'student')
            ->where('to_user_id', $studentId)
            ->where('title', $title)
            ->where('is_read', 0)
            ->exists();

        if ($exists) {
            return;
        }

        Notification::query()->create([
            'title' => $title,
            'description' => 'You have new demo assignments waiting in To Do.',
            'from_user_type' => 'teacher',
            'from_user_id' => 1,
            'to_user_type' => 'student',
            'to_user_id' => $studentId,
            'url' => '/todo',
            'type' => 'subjects',
            'type_id' => 1,
            'is_read' => 0,
        ]);
    }
}
