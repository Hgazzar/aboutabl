<?php

namespace Database\Seeders;

use App\Imports\QuestionsImport;
use App\Models\Lessons;
use App\Models\Subject;
use App\Models\Units;
use App\Services\QuestionBankDemoExcelBuilder;
use Illuminate\Database\Seeder;
use Maatwebsite\Excel\Facades\Excel;

/**
 * 1) Ensures QB demo subject / unit / lesson exist
 * 2) Regenerates samples/questions-bank-demo.xlsx (+ admin public copy)
 * 3) Imports that file (same as Question Bank upload) — idempotent (skips duplicate questions)
 *
 * Run: php artisan db:seed --class=Database\\Seeders\\QuestionBankDemoDataSeeder
 */
class QuestionBankDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(QuestionBankDemoHierarchySeeder::class);

        $subject = Subject::where('name', QuestionBankDemoHierarchySeeder::DEMO_SUBJECT_NAME)->first();
        $unit = $subject
            ? Units::where('subject_id', $subject->id)->where('name', QuestionBankDemoHierarchySeeder::DEMO_UNIT_NAME)->first()
            : null;
        $lesson = ($subject && $unit)
            ? Lessons::where('subject_id', $subject->id)
                ->where('unit_id', $unit->id)
                ->where('name_en', QuestionBankDemoHierarchySeeder::DEMO_LESSON_NAME_EN)
                ->first()
            : null;

        if (! $subject || ! $unit || ! $lesson) {
            $this->command->error('Demo hierarchy incomplete after seeding.');

            return;
        }

        $paths = QuestionBankDemoExcelBuilder::writeFiles(
            (int) $subject->id,
            (int) $unit->id,
            (int) $lesson->id
        );

        $samplePath = $paths[0];
        Excel::import(new QuestionsImport(null), $samplePath);

        $this->command->info('Question bank demo: wrote '.implode(', ', $paths).' and imported questions.');
    }
}
