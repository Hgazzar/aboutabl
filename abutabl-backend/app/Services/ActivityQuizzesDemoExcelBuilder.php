<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Minimal "Activities Questions" xlsx for Quizzes import (ActivityQuestionsImport).
 *
 * Column map (0-based): B=Quizzes, C=activity ref, D=lesson ref, E=group id,
 * F=question type, J=quiz title, K=time limit (min), L=score to pass, M=points per question,
 * O=question text, R=correct answer, U=reason required (0/1), W/Z/AC/AF=answer1–4.
 *
 * Import: Activities → Quizzes → upload; subject_id must be the subject that owns
 * the SubjectActivity named {@see ACTIVITY_REF} and ActivityLesson {@see LESSON_REF}.
 * Run: php artisan db:seed --class=Database\\Seeders\\ActivityQuizzesDemoSeeder
 */
class ActivityQuizzesDemoExcelBuilder
{
    public const ACTIVITY_REF = 'Demo Quiz Activity';

    public const LESSON_REF = 'Demo Quiz Lesson';

    public const SAMPLE_FILE = 'activities-quizzes-demo.xlsx';

    /**
     * One quiz (group 1), two MCQ questions.
     *
     * @return list<list<mixed>>
     */
    public static function spreadsheetRows(): array
    {
        $g = 1;
        $title = 'Demo Import — Sample Quiz';

        return [
            self::quizRow($g, $title, true, 'What is 2 + 2?', '2', ['3', '4', '5', '22']),
            self::quizRow($g, $title, false, 'What is the capital of France?', '2', ['London', 'Paris', 'Berlin', 'Madrid']),
        ];
    }

    /**
     * @param  bool  $includeQuizMeta  First row of group: fill J,K,L (title, time limit, score to pass)
     */
    protected static function quizRow(
        int $groupKey,
        string $quizTitle,
        bool $includeQuizMeta,
        string $questionText,
        string $corAnswer,
        array $fourChoices
    ): array {
        $row = array_fill(0, 46, '');
        $row[1] = 'Quizzes';
        $row[2] = self::ACTIVITY_REF;
        $row[3] = self::LESSON_REF;
        $row[4] = $groupKey;
        $row[5] = 'MCQ';
        if ($includeQuizMeta) {
            $row[9] = $quizTitle;
            $row[10] = 30;
            $row[11] = 50;
        }
        $row[12] = 10;
        $row[14] = $questionText;
        $row[17] = $corAnswer;
        $row[19] = '';
        $row[20] = 0;
        $row[22] = $fourChoices[0] ?? '';
        $row[25] = $fourChoices[1] ?? '';
        $row[28] = $fourChoices[2] ?? '';
        $row[31] = $fourChoices[3] ?? '';

        return $row;
    }

    /**
     * @return list<string> paths written
     */
    public static function writeFiles(): array
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray(self::spreadsheetRows(), null, 'A1');

        $writer = new Xlsx($spreadsheet);

        $samplesPath = base_path('samples/'.self::SAMPLE_FILE);
        if (! is_dir(dirname($samplesPath))) {
            mkdir(dirname($samplesPath), 0755, true);
        }
        $writer->save($samplesPath);
        $written = [$samplesPath];

        $publicPath = base_path('../abutabl-admin/public/'.self::SAMPLE_FILE);
        if (is_dir(dirname($publicPath))) {
            $writer->save($publicPath);
            $written[] = $publicPath;
        }

        return $written;
    }
}
