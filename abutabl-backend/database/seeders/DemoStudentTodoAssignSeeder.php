<?php

namespace Database\Seeders;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Student;
use App\Models\User;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Seeds one Multi-Activity assignment + rubric into the student To Do tab.
 *
 * Target: AKAIS1119 (student #1) — open from Student SPA:
 *   /todo  →  To Do tab  →  View  →  /todo/assign/{id}
 *
 * Run:
 *   php84 artisan db:seed --class=DemoStudentTodoAssignSeeder
 */
class DemoStudentTodoAssignSeeder extends Seeder
{
    private const STUDENT_USERNAME = 'AKAIS1119';

    private const TITLE = '[Demo] To Do — Rubric Homework';

    private const DUE_DAYS = 7;

    private const POSSIBLE_XP = 50;

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
            ?? Student::query()->find(1);

        if (! $student) {
            $this->command->error('Demo student '.self::STUDENT_USERNAME.' not found.');

            return;
        }

        $teacherId = (int) (User::query()->orderBy('id')->value('id') ?? 1);

        DB::transaction(function () use ($student, $teacherId) {
            $existing = Assigns::query()
                ->where('assigned_name', self::TITLE)
                ->where('school_id', $student->school_id)
                ->where('type', LearningActivityMap::ASSIGN_TYPE)
                ->first();

            if ($existing) {
                $this->resetExisting((int) $existing->id, (int) $student->id, $teacherId);
                $this->command->info(
                    'Reset To Do demo assign #'.$existing->id.' for '.$student->username
                    .' — open /todo then View.'
                );

                return;
            }

            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => self::TITLE,
                'assigned_path' => '/todo',
                'school_id' => $student->school_id,
                'grade_id' => $student->grade_id ?? 1,
                'subject_id' => $student->subject_id ?? 1,
                'due_at' => now()->addDays(self::DUE_DAYS)->endOfDay(),
                'possible_xp' => self::POSSIBLE_XP,
                'status' => '1',
                'created_by' => $teacherId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $assignStudentId = (int) DB::table('assigns_students')->insertGetId([
                'assign_id' => $assignId,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'student_id' => $student->id,
                'school_id' => $student->school_id,
                'status' => '1',
                'opened_at' => null,
                'submission_status' => 'active',
                'submitted_at' => null,
                'graded_at' => null,
                'created_by' => $teacherId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->seedActivities($assignId);
            $this->seedRubric($assignId);

            $this->command->info(
                'Seeded To Do demo assign #'.$assignId
                .' (assign_student #'.$assignStudentId.') for '.$student->username
                .' — open /todo then View → /todo/assign/'.$assignId
            );
        });
    }

    private function resetExisting(int $assignId, int $studentId, int $teacherId): void
    {
        DB::table('assigns')->where('id', $assignId)->update([
            'due_at' => now()->addDays(self::DUE_DAYS)->endOfDay(),
            'possible_xp' => self::POSSIBLE_XP,
            'status' => '1',
            'updated_at' => now(),
        ]);

        $row = DB::table('assigns_students')
            ->where('assign_id', $assignId)
            ->where('student_id', $studentId)
            ->first();

        if ($row) {
            DB::table('assigns_students')->where('id', $row->id)->update([
                'status' => '1',
                'opened_at' => null,
                'submission_status' => 'active',
                'submitted_at' => null,
                'graded_at' => null,
                'updated_at' => now(),
            ]);
        } else {
            DB::table('assigns_students')->insert([
                'assign_id' => $assignId,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'student_id' => $studentId,
                'school_id' => 1,
                'status' => '1',
                'opened_at' => null,
                'submission_status' => 'active',
                'submitted_at' => null,
                'graded_at' => null,
                'created_by' => $teacherId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('assign_activity_submissions')
            ->where('assign_id', $assignId)
            ->where('student_id', $studentId)
            ->delete();

        if (Schema::hasTable('assignment_grades')) {
            DB::table('assignment_grades')->where('assign_id', $assignId)->delete();
        }

        if (DB::table('assign_activities')->where('assign_id', $assignId)->count() === 0) {
            $this->seedActivities($assignId);
        }

        if (
            Schema::hasTable('assignment_rubrics')
            && DB::table('assignment_rubrics')->where('assign_id', $assignId)->doesntExist()
        ) {
            $this->seedRubric($assignId);
        }
    }

    private function seedActivities(int $assignId): void
    {
        $rows = [
            [
                'activity_type' => LearningActivityMap::TYPE_EBOOK,
                'activity_id' => 1,
                'source_table' => LearningActivityMap::SOURCE_TABLE[LearningActivityMap::TYPE_EBOOK],
                'grading_mode' => LearningActivityMap::GRADING_AUTOMATIC_COMPLETENESS,
                'title_snapshot' => 'Read: Unit 1 eBook',
                'sort_order' => 0,
            ],
            [
                'activity_type' => LearningActivityMap::TYPE_QUIZ,
                'activity_id' => 1,
                'source_table' => LearningActivityMap::SOURCE_TABLE[LearningActivityMap::TYPE_QUIZ],
                'grading_mode' => LearningActivityMap::GRADING_AUTOMATIC_ACCURACY,
                'title_snapshot' => 'Quiz: Vocabulary Check',
                'sort_order' => 1,
            ],
            [
                'activity_type' => LearningActivityMap::TYPE_WORKSHEET,
                'activity_id' => 1,
                'source_table' => LearningActivityMap::SOURCE_TABLE[LearningActivityMap::TYPE_WORKSHEET],
                'grading_mode' => LearningActivityMap::GRADING_MANUAL,
                'title_snapshot' => 'Worksheet: Practice Sheet',
                'sort_order' => 2,
            ],
        ];

        foreach ($rows as $row) {
            DB::table('assign_activities')->insert(array_merge($row, [
                'assign_id' => $assignId,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    /**
     * 3 criteria @ 33.33% — matches Figma "Your First Video" weight layout.
     */
    private function seedRubric(int $assignId): void
    {
        if (
            ! Schema::hasTable('assignment_rubrics')
            || ! Schema::hasTable('assignment_rubric_criteria')
        ) {
            return;
        }

        $rubricId = (int) DB::table('assignment_rubrics')->insertGetId([
            'assign_id' => $assignId,
            'title' => 'Your First Video',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach (
            [
                ['label' => '2 min long', 'weight' => 33.33, 'sort' => 0],
                ['label' => 'You appear in the video', 'weight' => 33.33, 'sort' => 1],
                ['label' => 'You use at least two camera angles', 'weight' => 33.34, 'sort' => 2],
            ] as $row
        ) {
            DB::table('assignment_rubric_criteria')->insert([
                'assignment_rubric_id' => $rubricId,
                'label' => $row['label'],
                'weight' => $row['weight'],
                'max_points' => 4,
                'sort_order' => $row['sort'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
