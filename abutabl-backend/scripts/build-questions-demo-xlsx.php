<?php

/**
 * Generates samples/questions-bank-demo.xlsx with IDs from the demo hierarchy.
 *
 * php artisan db:seed --class=Database\\Seeders\\QuestionBankDemoHierarchySeeder
 * php scripts/build-questions-demo-xlsx.php
 *
 * Or use: php artisan db:seed --class=Database\\Seeders\\QuestionBankDemoDataSeeder (writes + imports)
 */

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Lessons;
use App\Models\Subject;
use App\Models\Units;
use App\Services\QuestionBankDemoExcelBuilder;
use Database\Seeders\QuestionBankDemoHierarchySeeder;

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
    fwrite(STDERR, "Demo hierarchy not found. Run:\n  php artisan db:seed --class=Database\\\\Seeders\\\\QuestionBankDemoHierarchySeeder\n");
    exit(1);
}

$paths = QuestionBankDemoExcelBuilder::writeFiles(
    (int) $subject->id,
    (int) $unit->id,
    (int) $lesson->id
);

foreach ($paths as $p) {
    echo "Wrote {$p}\n";
}
