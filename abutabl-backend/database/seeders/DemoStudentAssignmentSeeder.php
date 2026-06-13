<?php

namespace Database\Seeders;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Notification;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds one demo assignment + unread notification for student 7833 (visual QA for notification badge).
 *
 * Run (short class name — avoids shell eating backslashes):
 *   php artisan db:seed --class=DemoStudentAssignmentSeeder
 *
 * Or full namespace in quotes (zsh/bash):
 *   php artisan db:seed --class='Database\Seeders\DemoStudentAssignmentSeeder'
 */
class DemoStudentAssignmentSeeder extends Seeder
{
    private const STUDENT_ID = 7833;

    private const DUE_DAYS = 7;

    public function run(): void
    {
        $student = Student::query()->find(self::STUDENT_ID);
        if (! $student) {
            $this->command->error('Student '.self::STUDENT_ID.' not found.');

            return;
        }

        $subject = Subject::query()->where('school_id', $student->school_id)->first()
            ?? Subject::query()->first();

        if (! $subject) {
            $this->command->error('No subjects in database; cannot seed demo assignment.');

            return;
        }

        $title = $subject->name_ar ?? $subject->name ?? 'Demo subject';

        $alreadySeeded = Notification::query()
            ->where('to_user_type', 'student')
            ->where('to_user_id', self::STUDENT_ID)
            ->where('title', $title)
            ->where('is_read', 0)
            ->where('created_at', '>', now()->subHour())
            ->exists();

        if ($alreadySeeded) {
            $this->command->info(
                'Skipped: unread notification with same title exists for student '.self::STUDENT_ID.' (within last hour).'
            );

            return;
        }

        $teacherId = User::query()->orderBy('id')->value('id');
        if (! $teacherId) {
            $this->command->error('No users in database; cannot set created_by / from_user_id.');

            return;
        }

        DB::transaction(function () use ($student, $subject, $title, $teacherId) {
            $assign = Assigns::create([
                'type' => 'subjects',
                'type_id' => $subject->id,
                'assigned_name' => $title,
                'assigned_path' => url('/api/subject/show/'.$subject->id),
                'school_id' => $student->school_id,
                'status' => 1,
                'created_by' => $teacherId,
                'subject_id' => $subject->id,
                'due_date' => now()->addDays(self::DUE_DAYS),
            ]);

            AssignsStudents::create([
                'assign_id' => $assign->id,
                'type' => 'subjects',
                'type_id' => $subject->id,
                'student_id' => self::STUDENT_ID,
                'school_id' => $student->school_id,
                'status' => 1,
                'created_by' => $teacherId,
            ]);

            $description = 'New Assign For '.$title;

            Notification::create([
                'title' => $title,
                'description' => $description,
                'from_user_type' => 'teacher',
                'from_user_id' => $teacherId,
                'to_user_type' => 'student',
                'to_user_id' => self::STUDENT_ID,
                'url' => '/todo',
                'type' => 'subjects',
                'type_id' => $subject->id,
                'is_read' => 0,
            ]);
        });

        $this->command->info(
            'Seeded assignment + unread notification for student '.self::STUDENT_ID." (subject: {$title})."
        );
    }
}
