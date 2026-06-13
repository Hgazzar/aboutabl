<?php

namespace Database\Seeders;

use App\Models\Lessons;
use App\Models\Subject;
use App\Models\Units;
use Illuminate\Database\Seeder;

/**
 * Creates a subject, unit, and lesson used by samples/questions-bank-demo.xlsx.
 * Run: php artisan db:seed --class=Database\\Seeders\\QuestionBankDemoHierarchySeeder
 * Then: php scripts/build-questions-demo-xlsx.php
 */
class QuestionBankDemoHierarchySeeder extends Seeder
{
    public const DEMO_SUBJECT_NAME = 'QB Demo Import';

    public const DEMO_SUBJECT_NAME_AR = 'تجربة استيراد بنك الأسئلة';

    public const DEMO_UNIT_NAME = 'QB Demo Unit';

    public const DEMO_UNIT_NAME_AR = 'وحدة تجريبية لبنك الأسئلة';

    public const DEMO_LESSON_NAME_EN = 'QB Demo Lesson';

    public const DEMO_LESSON_NAME_AR = 'درس تجريبي';

    public function run(): void
    {
        $subject = Subject::firstOrCreate(
            ['name' => self::DEMO_SUBJECT_NAME],
            [
                'name_ar' => self::DEMO_SUBJECT_NAME_AR,
                'status'  => 1,
                'photo'   => null,
            ]
        );

        $unit = Units::firstOrCreate(
            [
                'name'       => self::DEMO_UNIT_NAME,
                'subject_id' => $subject->id,
            ],
            [
                'name_ar'    => self::DEMO_UNIT_NAME_AR,
                'status'     => 1,
                'type'       => 'public',
                'for_teacher'=> 0,
            ]
        );

        $lesson = Lessons::firstOrCreate(
            [
                'name_en'    => self::DEMO_LESSON_NAME_EN,
                'subject_id' => $subject->id,
                'unit_id'    => $unit->id,
            ],
            [
                'name_ar'    => self::DEMO_LESSON_NAME_AR,
                'status'     => 1,
            ]
        );

        $this->command->info(sprintf(
            'Question bank demo hierarchy ready: subject_id=%d, unit_id=%d, lesson_id=%d — run: php scripts/build-questions-demo-xlsx.php',
            $subject->id,
            $unit->id,
            $lesson->id
        ));
    }
}
