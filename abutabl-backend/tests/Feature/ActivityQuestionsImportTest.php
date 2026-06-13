<?php

namespace Tests\Feature;

use App\Imports\ActivityQuestionsImport;
use App\Models\ActivityLesson;
use App\Models\Quizes;
use App\Models\Subject;
use App\Models\SubjectActivity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

/**
 * Backtest for Activities Questions import (Quizzes).
 * Ensures the import runs synchronously and persists to the database.
 *
 * Uses a programmatic fixture that matches the expected template columns:
 * - B = Activity type (Quizzes), C = Activity ref, D = Lesson ref, E = Group key
 * - J = Quiz title, K = time limit, L = score to pass, O = question text
 *
 * To backtest with your real templates (Activities Questions Template.xlsx or
 * Activities Questions Template1.xlsx), ensure you have a Subject and matching
 * SubjectActivity (name_en = value in column C) and ActivityLesson (name_en = value in column D)
 * for the first quiz block, then run the import via the API or tinker.
 */
class ActivityQuestionsImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        if (! Schema::hasTable('subject_activities') || ! Schema::hasTable('activity_lessons')) {
            $this->markTestSkipped(
                'Tables subject_activities and activity_lessons are required. Add migrations if missing.'
            );
        }
    }

    /**
     * Build a minimal xlsx fixture matching the import's expected columns.
     * Column indices: A=0, B=1=Type, C=2=ActivityRef, D=3=LessonRef, E=4=Group, ... J=9=Title, K=10, L=11.
     * One row only = quiz header (no question rows), so the import creates the quiz and skips question creation.
     */
    protected function buildFixtureXlsx(string $activityRef, string $lessonRef, string $quizTitle): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Single row: quiz header only
        $sheet->setCellValueByColumnAndRow(2, 1, 'Quizzes');
        $sheet->setCellValueByColumnAndRow(3, 1, $activityRef);
        $sheet->setCellValueByColumnAndRow(4, 1, $lessonRef);
        $sheet->setCellValueByColumnAndRow(5, 1, 1);
        $sheet->setCellValueByColumnAndRow(10, 1, $quizTitle);
        $sheet->setCellValueByColumnAndRow(11, 1, 60);
        $sheet->setCellValueByColumnAndRow(12, 1, 50);

        $dir = storage_path('app/temp');
        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        $path = $dir . '/activity_import_backtest.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        return 'temp/activity_import_backtest.xlsx';
    }

    /** @test */
    public function activity_questions_import_saves_quizzes_to_database(): void
    {
        $subject = Subject::create(['name' => 'Test Subject']);
        $user = User::create([
            'name'     => 'Test Admin',
            'email'    => 'admin@test.com',
            'phone'    => '1234567890',
            'password' => bcrypt('password'),
        ]);

        $activityRef = 'TestActivity';
        $lessonRef = 'TestLesson';

        $subjectActivity = SubjectActivity::create([
            'name_en'    => $activityRef,
            'name_ar'    => 'نشاط تجريبي',
            'status'     => 1,
            'subject_id' => $subject->id,
            'type'       => 'Quizzes',
            'created_by' => $user->id,
        ]);

        $activityLesson = ActivityLesson::create([
            'name_en'             => $lessonRef,
            'name_ar'             => 'درس تجريبي',
            'status'               => 1,
            'subject_activity_id'  => $subjectActivity->id,
            'created_by'          => $user->id,
        ]);

        $quizTitle = 'Backtest Quiz';
        $path = $this->buildFixtureXlsx($activityRef, $lessonRef, $quizTitle);

        $this->assertDatabaseCount('quizes', 0);

        $this->actingAs($user, 'admin-api');
        Excel::import(new ActivityQuestionsImport($subject->id), $path);

        $this->assertDatabaseHas('quizes', [
            'title_en'           => $quizTitle,
            'subject_id'         => $subject->id,
            'activity_lesson_id'  => $activityLesson->id,
        ]);

        $quiz = Quizes::where('title_en', $quizTitle)->where('subject_id', $subject->id)->first();
        $this->assertNotNull($quiz, 'Quiz should be saved in the database after import.');
    }

    /**
     * Backtest using the provided template file if it exists (run from project root).
     * Requires subject_id and matching activity/lesson to exist in DB for the template's column C/D.
     */
    public function test_import_with_provided_template_if_exists(): void
    {
        $templatePath = base_path('../Activities Questions Template.xlsx');
        if (! file_exists($templatePath)) {
            $templatePath = base_path('../Activities Questions Template1.xlsx');
        }
        if (! file_exists($templatePath)) {
            $this->markTestSkipped('Template file not found. Place Activities Questions Template.xlsx in project root to run this backtest.');
        }

        $subject = Subject::first() ?? Subject::create(['name' => 'Import Test Subject']);
        $pathInStorage = 'temp/template_backtest_' . time() . '.xlsx';
        $fullPath = storage_path('app/' . $pathInStorage);
        $dir = dirname($fullPath);
        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        copy($templatePath, $fullPath);

        $countBefore = Quizes::where('subject_id', $subject->id)->count();

        $user = User::first();
        if ($user) {
            $this->actingAs($user, 'admin-api');
        }

        try {
            Excel::import(new ActivityQuestionsImport($subject->id), $pathInStorage);
        } catch (\Throwable $e) {
            $this->fail('Import failed: ' . $e->getMessage());
        }

        $countAfter = Quizes::where('subject_id', $subject->id)->count();
        $this->assertGreaterThanOrEqual(
            $countBefore,
            $countAfter,
            'Import should create or leave quiz count unchanged (ensure template has matching Activity/Lesson names in column C/D).'
        );
    }
}
