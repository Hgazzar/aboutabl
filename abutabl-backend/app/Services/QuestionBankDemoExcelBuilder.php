<?php

namespace App\Services;

use Database\Seeders\QuestionBankDemoHierarchySeeder;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Builds samples/questions-bank-demo.xlsx (Question Bank import layout).
 * Rows 2–4 use numeric IDs; rows 5–6 use English / Arabic names (tests name resolution).
 */
class QuestionBankDemoExcelBuilder
{
    public static function spreadsheetRows(int $subjectId, int $unitId, int $lessonId): array
    {
        $s = QuestionBankDemoHierarchySeeder::DEMO_SUBJECT_NAME;
        $u = QuestionBankDemoHierarchySeeder::DEMO_UNIT_NAME;
        $l = QuestionBankDemoHierarchySeeder::DEMO_LESSON_NAME_EN;
        $sAr = QuestionBankDemoHierarchySeeder::DEMO_SUBJECT_NAME_AR;
        $uAr = QuestionBankDemoHierarchySeeder::DEMO_UNIT_NAME_AR;
        $lAr = QuestionBankDemoHierarchySeeder::DEMO_LESSON_NAME_AR;

        return [
            [
                'subject', 'unit', 'lesson', 'type', 'code', 'question', 'corAnswer', 'reasoning', 'reasoningIsRequired',
                'answer1', 'answer2', 'answer3', 'answer4', 'answer5', 'answer6', 'answer7', 'answer8',
                'answer2.1', 'answer2.2', 'answer2.3', 'answer2.4', 'answer2.5', 'answer2.6', 'answer2.7', 'answer2.8',
            ],
            [
                $subjectId, $unitId, $lessonId, 'MCQ', 'DEMO-XLSX-001', 'What is 2 + 2?', '2', '2 + 2 equals 4.', 0,
                '3', '4', '5', '22', '', '', '', '',
                '', '', '', '', '', '', '', '',
            ],
            [
                $subjectId, $unitId, $lessonId, 'TF', 'DEMO-XLSX-002', 'The sun rises in the west.', '0', 'The sun rises in the east.', 0,
                'True', 'False', '', '', '', '', '', '',
                '', '', '', '', '', '', '', '',
            ],
            [
                $subjectId, $unitId, $lessonId, 'Matching', 'DEMO-XLSX-003', 'Match each city to its country.', '1:1,2:2,3:3', '', 0,
                'Cairo', 'Riyadh', 'Baghdad', '', '', '', '', '',
                'Egypt', 'Saudi Arabia', 'Iraq', '', '', '', '', '',
            ],
            [
                $s, $u, $l, 'SHN', 'DEMO-XLSX-004', 'Name two primary colors (comma-separated).', 'red,blue', 'Primary colors include red, blue, and yellow.', 0,
                '', '', '', '', '', '', '', '',
                '', '', '', '', '', '', '', '',
            ],
            [
                $sAr, $uAr, $lAr, 'MCQ', 'DEMO-XLSX-005', 'Which number is even?', '2', '2 is divisible by 2.', 0,
                '1', '2', '3', '5', '', '', '', '',
                '', '', '', '', '', '', '', '',
            ],
        ];
    }

    /**
     * @return array{0:string,1?:string} paths written (samples always; public when sibling admin exists)
     */
    public static function writeFiles(int $subjectId, int $unitId, int $lessonId): array
    {
        $rows = self::spreadsheetRows($subjectId, $unitId, $lessonId);
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray($rows, null, 'A1');

        $writer = new Xlsx($spreadsheet);

        $samplesPath = base_path('samples/questions-bank-demo.xlsx');
        if (! is_dir(dirname($samplesPath))) {
            mkdir(dirname($samplesPath), 0755, true);
        }
        $writer->save($samplesPath);
        $written = [$samplesPath];

        $publicPath = base_path('../abutabl-admin/public/questions-bank-demo.xlsx');
        if (is_dir(dirname($publicPath))) {
            $writer->save($publicPath);
            $written[] = $publicPath;
        }

        return $written;
    }
}
