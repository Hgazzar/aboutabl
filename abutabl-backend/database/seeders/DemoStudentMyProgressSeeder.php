<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Services\Student\StudentMyProgressService;
use App\Services\Student\StudentXpService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Local My Progress book-metric QA for AKAIS1119 / ali.
 *
 * Seeds quiz_results (Accuracy), XP sync (Weekly XP), and SLCC (Activities when
 * MY_PROGRESS_DEMO_ACTIVITIES=true).
 *
 * Run:
 *   php artisan db:seed --class=DemoStudentMyProgressSeeder
 *
 * Then open http://127.0.0.1:5173/progress
 */
class DemoStudentMyProgressSeeder extends Seeder
{
    private const STUDENT_USERNAME = 'AKAIS1119';

    private const DEMO_MARKER = 'demo_my_progress_seed';

    /** @var int[] demo accuracy percents applied to the first N enrolled subjects */
    private const ACCURACY_SAMPLES = [88, 76, 92, 64];

    public function run(): void
    {
        $student = Student::query()->where('username', self::STUDENT_USERNAME)->first();
        if (! $student) {
            $this->command->error('Student '.self::STUDENT_USERNAME.' not found.');

            return;
        }

        /** @var StudentMyProgressService $progress */
        $progress = app(StudentMyProgressService::class);
        $before = $progress->build((int) $student->id);
        $books = $before['books'] ?? [];
        if ($books === []) {
            $this->command->error('Student has no enrolled My Progress books.');

            return;
        }

        $targets = array_slice($books, 0, count(self::ACCURACY_SAMPLES));

        DB::transaction(function () use ($student, $targets) {
            foreach ($targets as $index => $book) {
                $subjectId = (int) ($book['subject_id'] ?? 0);
                if ($subjectId <= 0) {
                    continue;
                }
                $percent = self::ACCURACY_SAMPLES[$index] ?? 80;
                $this->ensureQuizAccuracy((int) $student->id, (int) $student->school_id, $subjectId, $percent);
                $this->ensureSlccForSubject((int) $student->id, $subjectId, 3 + $index);
            }
        });

        /** @var StudentXpService $xp */
        $xp = app(StudentXpService::class);
        $xp->syncAndGet((int) $student->id);

        $after = $progress->build((int) $student->id);
        $summary = [];
        foreach (array_slice($after['books'] ?? [], 0, 4) as $book) {
            $summary[] = [
                'subject_id' => $book['subject_id'],
                'title' => $book['title'],
                'xp_this_week' => $book['xp_this_week'],
                'accuracy_percent' => $book['accuracy_percent'],
                'activities_completed' => $book['activities_completed'],
                'activities_available' => $book['activities_available'],
            ];
        }

        $demoFlag = (bool) config('student_my_progress.demo_show_activities', false);
        $this->command->info('Seeded My Progress metrics for '.self::STUDENT_USERNAME.' (#'.$student->id.').');
        $this->command->info('demo_show_activities='.($demoFlag ? 'true' : 'false'));
        if (! $demoFlag) {
            $this->command->warn('Set MY_PROGRESS_DEMO_ACTIVITIES=true in .env (APP_ENV=local) then: php artisan config:clear');
        }
        $this->command->info(json_encode($summary, JSON_UNESCAPED_UNICODE));
        $this->command->info('Open http://127.0.0.1:5173/progress and hard-refresh.');
    }

    private function ensureQuizAccuracy(int $studentId, int $schoolId, int $subjectId, int $percent): void
    {
        if (
            ! Schema::hasTable('quizes')
            || ! Schema::hasTable('quiz_results')
            || ! Schema::hasTable('quiz_versions')
            || ! Schema::hasTable('quiz_snapshots')
            || ! Schema::hasTable('quiz_attempts')
        ) {
            return;
        }

        $titleEn = 'My Progress Demo Quiz — '.$subjectId;
        $quizId = DB::table('quizes')
            ->where('subject_id', $subjectId)
            ->where('title_en', $titleEn)
            ->value('id');

        if (! $quizId) {
            $quizId = DB::table('quizes')->insertGetId([
                'title_en' => $titleEn,
                'title_ar' => 'اختبار تجريبي — تقدم',
                'subject_id' => $subjectId,
                'status' => '1',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $versionId = DB::table('quiz_versions')
            ->where('quiz_id', $quizId)
            ->orderBy('id')
            ->value('id');
        if (! $versionId) {
            $versionId = DB::table('quiz_versions')->insertGetId([
                'quiz_id' => $quizId,
                'version_number' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $snapshotId = DB::table('quiz_snapshots')
            ->where('quiz_id', $quizId)
            ->where('quiz_version_id', $versionId)
            ->orderBy('id')
            ->value('id');
        if (! $snapshotId) {
            $snapshotId = DB::table('quiz_snapshots')->insertGetId([
                'quiz_version_id' => $versionId,
                'quiz_id' => $quizId,
                'payload' => json_encode(['questions' => [], 'marker' => self::DEMO_MARKER]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $attemptId = DB::table('quiz_attempts')
            ->where('student_id', $studentId)
            ->where('quiz_id', $quizId)
            ->orderBy('id')
            ->value('id');
        if (! $attemptId) {
            $attemptId = DB::table('quiz_attempts')->insertGetId([
                'quiz_id' => $quizId,
                'quiz_version_id' => $versionId,
                'quiz_snapshot_id' => $snapshotId,
                'student_id' => $studentId,
                'school_id' => $schoolId,
                'status' => 'submitted',
                'attempt_no' => 1,
                'started_at' => Carbon::now()->subMinutes(20),
                'submitted_at' => Carbon::now()->subMinutes(5),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $existing = DB::table('quiz_results')
            ->where('student_id', $studentId)
            ->where('quiz_id', $quizId)
            ->first();

        $earnedAt = Carbon::now()->subHours(2 + ($subjectId % 5));
        $row = [
            'attempt_id' => $attemptId,
            'student_id' => $studentId,
            'quiz_id' => $quizId,
            'school_id' => $schoolId,
            'percent' => $percent,
            'raw_score' => $percent,
            'max_score' => 100,
            'passed' => $percent >= 50 ? 1 : 0,
            'is_authoritative' => 1,
            'finalized_at' => $earnedAt,
            'updated_at' => now(),
        ];

        if ($existing) {
            DB::table('quiz_results')->where('id', $existing->id)->update($row);
        } else {
            $row['created_at'] = $earnedAt;
            DB::table('quiz_results')->insert($row);
        }
    }

    private function ensureSlccForSubject(int $studentId, int $subjectId, int $desiredCount): void
    {
        if (
            ! Schema::hasTable('lessons')
            || ! Schema::hasTable('lessons_contents')
            || ! Schema::hasTable('student_lesson_content_completions')
        ) {
            return;
        }

        $lesson = DB::table('lessons')
            ->where('subject_id', $subjectId)
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy('id')
            ->first(['id', 'unit_id', 'subject_id']);

        if (! $lesson) {
            return;
        }

        $lessonId = (int) $lesson->id;
        $unitId = $lesson->unit_id !== null ? (int) $lesson->unit_id : null;

        $existingCount = (int) DB::table('student_lesson_content_completions as slcc')
            ->join('lessons', 'lessons.id', '=', 'slcc.lesson_id')
            ->where('slcc.student_id', $studentId)
            ->where('lessons.subject_id', $subjectId)
            ->count();

        $need = max(0, $desiredCount - $existingCount);
        for ($i = 0; $i < $need; $i++) {
            $nameEn = 'MP Demo Content '.$subjectId.'-'.($existingCount + $i + 1);
            $contentId = DB::table('lessons_contents')
                ->where('lesson_id', $lessonId)
                ->where('name_en', $nameEn)
                ->value('id');

            if (! $contentId) {
                $contentId = DB::table('lessons_contents')->insertGetId([
                    'name_en' => $nameEn,
                    'name_ar' => 'محتوى تجريبي '.$subjectId,
                    'about_en' => null,
                    'about_ar' => null,
                    'subject_id' => $subjectId,
                    'unit_id' => $unitId,
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
                'completed_at' => Carbon::now()->subDays($i)->subHours(1),
                'completion_source' => self::DEMO_MARKER,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
