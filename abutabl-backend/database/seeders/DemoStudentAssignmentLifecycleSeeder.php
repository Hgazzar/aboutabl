<?php

namespace Database\Seeders;

use App\Models\AssignActivitySubmission;
use App\Models\AssignmentGrade;
use App\Models\AssignmentMaterial;
use App\Models\AssignmentStudentWork;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Models\User;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Full Assignment lifecycle demo for DEMOPEER01 (Sara).
 *
 * Covers tabs + Materials + My Work panels:
 *  - TO DO incomplete (View)
 *  - TO DO ready Submit
 *  - TO DO submitted / Waiting (View list → Waiting hero + REDO inside)
 *  - PAST DUE unsubmitted
 *  - COMPLETE graded (Excellent badge)
 *
 * Login: DEMOPEER01 / DemoPeer123
 *
 * Run:
 *   php84 artisan db:seed --class=DemoStudentAssignmentLifecycleSeeder
 */
class DemoStudentAssignmentLifecycleSeeder extends Seeder
{
    private const STUDENT_USERNAME = 'DEMOPEER01';

    private const TITLE_PREFIX = '[Lifecycle Demo]';

    public function run(): void
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasTable('assign_activities')
        ) {
            $this->command->error('Required assignment tables are missing.');

            return;
        }

        $student = Student::query()->where('username', self::STUDENT_USERNAME)->first()
            ?? Student::query()->find(2);

        if (! $student) {
            $this->command->error('Student '.self::STUDENT_USERNAME.' not found.');

            return;
        }

        $teacherId = (int) (User::query()->orderBy('id')->value('id') ?? 1);
        $schoolId = (int) ($student->school_id ?? 1);
        $gradeId = (int) ($student->grade_id ?? 1);
        $subjectId = 1;

        $this->purgePreviousDemos((int) $student->id);

        $cases = [
            [
                'key' => 'todo_incomplete',
                'title' => self::TITLE_PREFIX.' TO DO — Incomplete (View)',
                'due_at' => now()->addDays(4)->endOfDay(),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'activities_complete' => false,
                'with_grade' => false,
                'tab_hint' => 'TO DO → View',
            ],
            [
                'key' => 'todo_ready_submit',
                'title' => self::TITLE_PREFIX.' TO DO — Ready Submit',
                'due_at' => now()->addDays(3)->endOfDay(),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'activities_complete' => true,
                'with_grade' => false,
                'tab_hint' => 'TO DO → SUBMIT',
            ],
            [
                'key' => 'todo_waiting',
                'title' => self::TITLE_PREFIX.' TO DO — Waiting on Teacher',
                'due_at' => now()->addDays(5)->endOfDay(),
                'submission_status' => AssignsStudents::SUBMISSION_SUBMITTED,
                'submitted_at' => now()->subHours(2),
                'graded_at' => null,
                'activities_complete' => true,
                'with_grade' => false,
                'tab_hint' => 'TO DO → View → Waiting hero + REDO',
            ],
            [
                'key' => 'past_due',
                'title' => self::TITLE_PREFIX.' PAST DUE — Unsubmitted',
                'due_at' => now()->subDays(2)->endOfDay(),
                'submission_status' => AssignsStudents::SUBMISSION_ACTIVE,
                'submitted_at' => null,
                'graded_at' => null,
                'activities_complete' => false,
                'with_grade' => false,
                'tab_hint' => 'PAST DUE → View',
            ],
            [
                'key' => 'complete_graded',
                'title' => self::TITLE_PREFIX.' COMPLETE — Graded Excellent',
                'due_at' => now()->addDays(2)->endOfDay(),
                'submission_status' => AssignsStudents::SUBMISSION_GRADED,
                'submitted_at' => now()->subDays(2),
                'graded_at' => now()->subDay(),
                'activities_complete' => true,
                'with_grade' => true,
                'tab_hint' => 'COMPLETE → View → Assignment Graded!',
            ],
        ];

        $created = [];

        DB::transaction(function () use (
            $cases,
            $student,
            $teacherId,
            $schoolId,
            $gradeId,
            $subjectId,
            &$created
        ) {
            foreach ($cases as $case) {
                $created[] = $this->seedCase(
                    $case,
                    (int) $student->id,
                    $teacherId,
                    $schoolId,
                    $gradeId,
                    $subjectId
                );
            }
        });

        $this->command->info('Seeded lifecycle demos for '.$student->username.' (password: DemoPeer123)');
        $this->command->info('Open Student SPA → /todo');
        foreach ($created as $row) {
            $this->command->info(
                '  #'.$row['assign_id'].' '.$row['title'].' — '.$row['tab_hint']
                .' → /todo/assign/'.$row['assign_id']
            );
        }
    }

    /**
     * @param  array<string, mixed>  $case
     * @return array{assign_id:int,title:string,tab_hint:string}
     */
    private function seedCase(
        array $case,
        int $studentId,
        int $teacherId,
        int $schoolId,
        int $gradeId,
        int $subjectId
    ): array {
        $assignId = (int) DB::table('assigns')->insertGetId([
            'type' => LearningActivityMap::ASSIGN_TYPE,
            'type_id' => 0,
            'assigned_name' => $case['title'],
            'assigned_path' => '/todo',
            'school_id' => $schoolId,
            'grade_id' => $gradeId,
            'subject_id' => $subjectId,
            'due_at' => $case['due_at'],
            'possible_xp' => 50,
            'status' => 1,
            'created_by' => $teacherId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $assignStudentId = (int) DB::table('assigns_students')->insertGetId([
            'assign_id' => $assignId,
            'student_id' => $studentId,
            'school_id' => $schoolId,
            'status' => 1,
            'type' => LearningActivityMap::ASSIGN_TYPE,
            'type_id' => 0,
            'opened_at' => now()->subDay(),
            'submission_status' => $case['submission_status'],
            'submitted_at' => $case['submitted_at'],
            'graded_at' => $case['graded_at'],
            'created_by' => $teacherId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $activityId = $this->seedEbookActivity($assignId);

        if ($case['activities_complete']) {
            DB::table('assign_activity_submissions')->insert([
                'assign_id' => $assignId,
                'assign_activity_id' => $activityId,
                'assign_student_id' => $assignStudentId,
                'student_id' => $studentId,
                'status' => AssignActivitySubmission::STATUS_COMPLETED,
                'completeness' => 100,
                'percent' => 100,
                'submitted_at' => now()->subHours(3),
                'graded_at' => now()->subHours(3),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->seedMaterials($assignId, $teacherId);
        $this->seedMyWork($assignId, $assignStudentId, $studentId);

        if ($case['with_grade'] && Schema::hasTable('assignment_grades')) {
            DB::table('assignment_grades')->insert([
                'assign_id' => $assignId,
                'assign_student_id' => $assignStudentId,
                'status' => AssignmentGrade::STATUS_FINALIZED,
                'final_percent' => 92.5,
                'badge_key' => 'excellent',
                'possible_xp' => 50,
                'earned_xp' => 46,
                'teacher_feedback' => 'Great work — clear effort and strong understanding.',
                'graded_by' => $teacherId,
                'finalized_at' => now()->subDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return [
            'assign_id' => $assignId,
            'title' => (string) $case['title'],
            'tab_hint' => (string) $case['tab_hint'],
        ];
    }

    private function seedEbookActivity(int $assignId): int
    {
        return (int) DB::table('assign_activities')->insertGetId([
            'assign_id' => $assignId,
            'activity_type' => LearningActivityMap::TYPE_EBOOK,
            'activity_id' => 1,
            'source_table' => 'lessons_contents',
            'grading_mode' => LearningActivityMap::GRADING_AUTOMATIC_COMPLETENESS,
            'title_snapshot' => 'Demo eBook activity',
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedMaterials(int $assignId, int $teacherId): void
    {
        if (! Schema::hasTable('assignment_materials')) {
            return;
        }

        DB::table('assignment_materials')->insert([
            [
                'assign_id' => $assignId,
                'kind' => AssignmentMaterial::KIND_LINK,
                'label' => 'Teacher reading list',
                'original_filename' => null,
                'storage_path' => null,
                'external_url' => 'https://example.com/demo-reading-list',
                'mime_type' => null,
                'size_bytes' => null,
                'duration_ms' => null,
                'sort_order' => 0,
                'created_by' => $teacherId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'assign_id' => $assignId,
                'kind' => AssignmentMaterial::KIND_FILE,
                'label' => 'Worksheet PDF',
                'original_filename' => 'demo-worksheet.pdf',
                'storage_path' => $this->ensurePublicFile(
                    "assignments/{$assignId}/materials/demo-worksheet.pdf",
                    "%PDF-1.4 demo worksheet\n"
                ),
                'external_url' => null,
                'mime_type' => 'application/pdf',
                'size_bytes' => 128,
                'duration_ms' => null,
                'sort_order' => 1,
                'created_by' => $teacherId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    private function seedMyWork(int $assignId, int $assignStudentId, int $studentId): void
    {
        if (! Schema::hasTable('assignment_student_works')) {
            return;
        }

        DB::table('assignment_student_works')->insert([
            [
                'assign_id' => $assignId,
                'assign_student_id' => $assignStudentId,
                'student_id' => $studentId,
                'kind' => AssignmentStudentWork::KIND_DOCUMENT,
                'original_filename' => 'Storytelling guide student version class a.docx',
                'storage_path' => $this->ensurePublicFile(
                    "assignments/{$assignId}/student-work/{$assignStudentId}/storytelling-guide.docx",
                    "PK demo docx placeholder\n"
                ),
                'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'size_bytes' => 96,
                'duration_ms' => null,
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'assign_id' => $assignId,
                'assign_student_id' => $assignStudentId,
                'student_id' => $studentId,
                'kind' => AssignmentStudentWork::KIND_IMAGE,
                'original_filename' => 'IMG-3243423.jpeg',
                'storage_path' => $this->ensurePublicFile(
                    "assignments/{$assignId}/student-work/{$assignStudentId}/IMG-3243423.jpeg",
                    base64_decode(
                        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
                    ) ?: 'PNG'
                ),
                'mime_type' => 'image/jpeg',
                'size_bytes' => 68,
                'duration_ms' => null,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    private function ensurePublicFile(string $relativePath, string $contents): string
    {
        try {
            Storage::disk('public')->put($relativePath, $contents);
        } catch (\Throwable $e) {
            // Path still stored so UI cards render; download may 404 if disk unavailable.
        }

        return $relativePath;
    }

    private function purgePreviousDemos(int $studentId): void
    {
        $ids = DB::table('assigns')
            ->where('assigned_name', 'like', self::TITLE_PREFIX.'%')
            ->pluck('id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        if ($ids === []) {
            return;
        }

        if (Schema::hasTable('assignment_student_works')) {
            DB::table('assignment_student_works')->whereIn('assign_id', $ids)->delete();
        }
        if (Schema::hasTable('assignment_materials')) {
            DB::table('assignment_materials')->whereIn('assign_id', $ids)->delete();
        }
        if (Schema::hasTable('assignment_grades')) {
            DB::table('assignment_grades')->whereIn('assign_id', $ids)->delete();
        }
        DB::table('assign_activity_submissions')->whereIn('assign_id', $ids)->delete();
        DB::table('assign_activities')->whereIn('assign_id', $ids)->delete();
        DB::table('assigns_students')->whereIn('assign_id', $ids)->where('student_id', $studentId)->delete();
        DB::table('assigns')->whereIn('id', $ids)->delete();
    }
}
