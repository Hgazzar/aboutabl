<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ActivityLesson;
use App\Models\Questions;
use App\Models\Quizes;
use App\Models\QuizesQuestions;
use App\Models\Subject;

class ActivityLesson37DummyQuestionsSeeder extends Seeder
{
    public const ACTIVITY_LESSON_ID = 37;

    /**
     * Add dummy questions and a quiz to activity lesson 37.
     * Run: php artisan db:seed --class=ActivityLesson37DummyQuestionsSeeder
     */
    public function run()
    {
        $activityLesson = ActivityLesson::with('SubjectActivity')->find(self::ACTIVITY_LESSON_ID);

        if (! $activityLesson) {
            $this->command->warn('Activity lesson 37 not found. Create it first from the admin.');

            return;
        }

        $subjectActivity = $activityLesson->SubjectActivity;
        $subjectId       = $subjectActivity->subject_id ?? Subject::query()->value('id');

        if (! $subjectId) {
            $this->command->warn('No subject found. Create a subject first.');

            return;
        }

        $createdBy = 1; // admin user id often 1 in seeds

        $dummyQuestions = [
            [
                'type'      => 'mcq',
                'question'  => 'What is the capital of France?',
                'corAnswer' => 'Paris',
                'answer1'   => 'Paris',
                'answer2'   => 'London',
                'answer3'   => 'Berlin',
                'answer4'   => 'Madrid',
            ],
            [
                'type'      => 'mcq',
                'question'  => 'How many sides does a hexagon have?',
                'corAnswer' => '6',
                'answer1'   => '5',
                'answer2'   => '6',
                'answer3'   => '7',
                'answer4'   => '8',
            ],
            [
                'type'      => 'mcq',
                'question'  => 'Which planet is known as the Red Planet?',
                'corAnswer' => 'Mars',
                'answer1'   => 'Venus',
                'answer2'   => 'Mars',
                'answer3'   => 'Jupiter',
                'answer4'   => 'Saturn',
            ],
            [
                'type'      => 'mcq',
                'question'  => 'What is 7 × 8?',
                'corAnswer' => '56',
                'answer1'   => '54',
                'answer2'   => '55',
                'answer3'   => '56',
                'answer4'   => '57',
            ],
            [
                'type'      => 'mcq',
                'question'  => 'Which gas do plants absorb from the air?',
                'corAnswer' => 'Carbon dioxide',
                'answer1'   => 'Oxygen',
                'answer2'   => 'Nitrogen',
                'answer3'   => 'Carbon dioxide',
                'answer4'   => 'Hydrogen',
            ],
        ];

        $questionIds = [];

        foreach ($dummyQuestions as $q) {
            $question = Questions::create([
                'type'       => $q['type'],
                'question'   => $q['question'],
                'corAnswer'  => $q['corAnswer'],
                'answer1'    => $q['answer1'],
                'answer2'    => $q['answer2'],
                'answer3'    => $q['answer3'],
                'answer4'    => $q['answer4'],
                'subject_id' => $subjectId,
                'status'     => 1,
                'created_by' => $createdBy,
            ]);
            $questionIds[] = $question->id;
        }

        $quiz = Quizes::create([
            'title_en'           => 'Dummy Quiz – Activity Lesson 37',
            'title_ar'           => 'اختبار تجريبي – الدرس 37',
            'instructions_en'   => 'Answer the following questions.',
            'instructions_ar'   => 'أجب على الأسئلة التالية.',
            'status'             => 1,
            'subject_id'         => $subjectId,
            'activity_lesson_id' => self::ACTIVITY_LESSON_ID,
            'created_by'         => $createdBy,
            'navigation_method'  => 'free',
            'questions_per_page' => 1,
            'score_method'       => 'points',
            'score_to_pass'      => 1,
            'unlimited_attempts' => 1,
            'num_attempts'       => 3,
            'notify_student'      => 0,
            'notify_about_submission'      => 0,
            'notify_about_late_submission' => 0,
            'reminder_before_due_date'     => 0,
            'start_date'         => now()->format('Y-m-d'),
            'due_date'           => now()->addMonths(3)->format('Y-m-d'),
            'time_limit'         => 30,
            'type_time'          => 'minutes',
            'do_when_time_end'   => null,
        ]);

        foreach ($questionIds as $questionId) {
            QuizesQuestions::create([
                'quize_id'    => $quiz->id,
                'question_id' => $questionId,
                'score'       => 1,
                'created_by'  => $createdBy,
                'status'      => 1,
            ]);
        }

        $this->command->info('Added 5 dummy questions and 1 quiz to activity lesson 37.');
        $this->command->info('Quiz ID: ' . $quiz->id);
        $activityType = $subjectActivity->type ?? 'unknown';
        $this->command->info('Activity type: ' . $activityType . '. For this quiz to appear in GET .../activity_lessons/show/37, the subject activity must be type "Quizzes".');
    }
}
