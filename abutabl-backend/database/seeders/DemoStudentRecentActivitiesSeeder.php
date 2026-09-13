<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Services\Student\StudentRecentActivitiesService;
use App\Services\Student\StudentXpService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds lesson content completions for Widget 6 — Recent Activities (+XP rows) visual QA.
 *
 * Run:
 *   php artisan db:seed --class=DemoStudentRecentActivitiesSeeder
 */
class DemoStudentRecentActivitiesSeeder extends Seeder
{
    private const STUDENT_USERNAME = 'AKAIS1119';

    private const COMPLETION_SOURCE = 'demo_recent_activities_seed';

    public function run(): void
    {
        $student = Student::query()->where('username', self::STUDENT_USERNAME)->first();
        if (! $student) {
            $this->command->error('Student '.self::STUDENT_USERNAME.' not found.');

            return;
        }

        $subjectId = (int) DB::table('subjects')->orderBy('id')->value('id');
        if ($subjectId <= 0) {
            $this->command->error('No subjects in database; cannot seed recent activities.');

            return;
        }

        $inserted = DB::transaction(function () use ($student, $subjectId) {
            return $this->seedRecentActivityPairs((int) $student->id, $subjectId, $this->demoPairs());
        });

        /** @var StudentXpService $xp */
        $xp = app(StudentXpService::class);
        $xp->syncAndGet((int) $student->id);

        /** @var StudentRecentActivitiesService $recent */
        $recent = app(StudentRecentActivitiesService::class);
        $payload = $recent->buildDashboardPayload((int) $student->id, 4);

        $this->command->info(
            'Seeded '.$inserted.' new recent-activity completion(s) for '.self::STUDENT_USERNAME.' (#'.$student->id.').'
        );
        $this->command->info('Recent activities preview: '.json_encode($payload, JSON_UNESCAPED_UNICODE));
        $this->command->info('Hard-refresh http://127.0.0.1:5173/learn to preview Recent Activities (+XP).');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function demoPairs(): array
    {
        return [
            [
                'lesson_en' => 'Demo Lesson — Phonics Intro',
                'lesson_ar' => 'درس تجريبي — مقدمة الصوتيات',
                'content_en' => 'Long Vowel Sounds — Chapter Introduction',
                'content_ar' => 'القراءة والاستماع — الأصوات الطويلة والتعرف على الحروف',
                'completed_at' => Carbon::now()->subHours(5),
            ],
            [
                'lesson_en' => 'Demo Lesson — Sight Words',
                'lesson_ar' => 'درس تجريبي — كلمات شائعة',
                'content_en' => 'Sight Words Set 1',
                'content_ar' => 'مجموعة الكلمات الشائعة الأولى',
                'completed_at' => Carbon::now()->subDay(),
            ],
            [
                'lesson_en' => 'Demo Lesson — Letter Aa',
                'lesson_ar' => 'درس تجريبي — الحرف Aa',
                'content_en' => 'Letter Aa',
                'content_ar' => 'الحرف Aa',
                'completed_at' => Carbon::now()->subDays(2),
            ],
            [
                'lesson_en' => 'Demo Lesson — Number 1',
                'lesson_ar' => 'درس تجريبي — الرقم 1',
                'content_en' => 'Number 1',
                'content_ar' => 'الرقم 1',
                'completed_at' => Carbon::now()->subDays(4),
            ],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $pairs
     */
    private function seedRecentActivityPairs(int $studentId, int $subjectId, array $pairs): int
    {
        $inserted = 0;
        $now = now();

        foreach ($pairs as $pair) {
            $lessonId = (int) DB::table('lessons')
                ->where('subject_id', $subjectId)
                ->where('name_en', $pair['lesson_en'])
                ->value('id');

            if (! $lessonId) {
                $lessonId = (int) DB::table('lessons')->insertGetId([
                    'name_en' => $pair['lesson_en'],
                    'name_ar' => $pair['lesson_ar'],
                    'subject_id' => $subjectId,
                    'unit_id' => null,
                    'created_by' => null,
                    'status' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $contentId = (int) DB::table('lessons_contents')
                ->where('lesson_id', $lessonId)
                ->where('name_en', $pair['content_en'])
                ->value('id');

            if (! $contentId) {
                $contentId = (int) DB::table('lessons_contents')->insertGetId([
                    'name_en' => $pair['content_en'],
                    'name_ar' => $pair['content_ar'],
                    'about_en' => null,
                    'about_ar' => null,
                    'subject_id' => $subjectId,
                    'unit_id' => null,
                    'lesson_id' => $lessonId,
                    'type' => 'text',
                    'size' => null,
                    'path' => null,
                    'created_by' => null,
                    'status' => 1,
                    'privacy' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
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
                'completion_source' => self::COMPLETION_SOURCE,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $inserted++;
        }

        return $inserted;
    }
}
