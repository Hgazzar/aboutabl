<?php

namespace Database\Seeders;

use App\Models\ActivityLesson;
use App\Models\Subject;
use App\Models\SubjectActivity;
use App\Models\User;
use App\Services\ActivityQuizzesDemoExcelBuilder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

/**
 * Creates demo SubjectActivity (Quizzes) + ActivityLesson that match activities-quizzes-demo.xlsx,
 * and writes that spreadsheet to samples/ and abutabl-admin/public/.
 *
 * Uses subject "QB Demo Import" (creates it via QuestionBankDemoHierarchySeeder if missing).
 *
 * Import the file from Quizzes activity upload while logged in; pass the same subject_id.
 *
 * php artisan db:seed --class=Database\\Seeders\\ActivityQuizzesDemoSeeder
 */
class ActivityQuizzesDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(QuestionBankDemoHierarchySeeder::class);

        $subject = Subject::where('name', QuestionBankDemoHierarchySeeder::DEMO_SUBJECT_NAME)->first();
        if (! $subject) {
            $this->command->error('Demo subject not found.');

            return;
        }

        $userId = User::query()->orderBy('id')->value('id');

        $activity = SubjectActivity::firstOrCreate(
            [
                'subject_id' => $subject->id,
                'type'       => 'Quizzes',
                'name_en'    => ActivityQuizzesDemoExcelBuilder::ACTIVITY_REF,
            ],
            [
                'name_ar'    => 'نشاط اختبار تجريبي',
                'status'     => 1,
                'created_by' => $userId,
            ]
        );

        $lessonAttrs = [
            'name_ar'    => 'درس نشاط اختبار تجريبي',
            'status'     => 1,
            'created_by' => $userId,
        ];
        if (Schema::hasColumn('activity_lessons', 'lesson_id')) {
            $lessonAttrs['lesson_id'] = null;
        }

        ActivityLesson::firstOrCreate(
            [
                'subject_activity_id' => $activity->id,
                'name_en'             => ActivityQuizzesDemoExcelBuilder::LESSON_REF,
            ],
            $lessonAttrs
        );

        $paths = ActivityQuizzesDemoExcelBuilder::writeFiles();

        $this->command->info(
            'Activity quizzes demo: SubjectActivity + ActivityLesson ready for subject_id='.$subject->id.'. '.
            'Wrote: '.implode(', ', $paths).'. '.
            'Upload '.ActivityQuizzesDemoExcelBuilder::SAMPLE_FILE.' from Quizzes with subject_id='.$subject->id.'.'
        );
    }
}
