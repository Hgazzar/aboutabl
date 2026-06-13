<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * For assigns still missing created_by, set to a default teacher for the school:
     * 1) teachers_grades: same school + subject (when subject_id is set)
     * 2) teachers_grades: same school (any active row)
     * 3) schools_roles: user linked to school with teacher role
     * 4) users: school_id match + teacher role_id
     *
     * Then copy assigns.created_by onto assigns_students where still null.
     */
    public function up(): void
    {
        if (! DB::getSchemaBuilder()->hasTable('assigns')) {
            return;
        }

        $teacherRoleId = DB::table('roles')->whereRaw('LOWER(name) = ?', ['teacher'])->value('id');

        $beforeAssigns = DB::table('assigns')->whereNull('created_by')->count();
        $beforeStudents = DB::getSchemaBuilder()->hasTable('assigns_students')
            ? DB::table('assigns_students')->whereNull('created_by')->count()
            : 0;

        Log::info('backfill_assigns_school_teacher: before', [
            'assigns_created_by_null' => $beforeAssigns,
            'assigns_students_created_by_null' => $beforeStudents,
        ]);

        DB::table('assigns')->whereNull('created_by')->orderBy('id')->chunkById(100, function ($assigns) use ($teacherRoleId) {
            foreach ($assigns as $assign) {
                $schoolId = $assign->school_id;
                if (! $schoolId && DB::getSchemaBuilder()->hasTable('assigns_students')) {
                    $schoolId = DB::table('assigns_students as ast')
                        ->join('students as s', 's.id', '=', 'ast.student_id')
                        ->where('ast.assign_id', $assign->id)
                        ->value('s.school_id');
                }
                if (! $schoolId) {
                    continue;
                }

                $subjectId = $assign->subject_id ?? null;
                $userId = null;

                if (DB::getSchemaBuilder()->hasTable('teachers_grades')) {
                    if ($subjectId) {
                        $userId = DB::table('teachers_grades')
                            ->where('school_id', $schoolId)
                            ->where('subject_id', $subjectId)
                            ->where('status', 1)
                            ->whereNotNull('user_id')
                            ->orderBy('id')
                            ->value('user_id');
                    }
                    if (! $userId) {
                        $userId = DB::table('teachers_grades')
                            ->where('school_id', $schoolId)
                            ->where('status', 1)
                            ->whereNotNull('user_id')
                            ->orderBy('id')
                            ->value('user_id');
                    }
                }

                if (! $userId && $teacherRoleId && DB::getSchemaBuilder()->hasTable('schools_roles')) {
                    $userId = DB::table('schools_roles')
                        ->where('school_id', $schoolId)
                        ->where('role_id', $teacherRoleId)
                        ->where(function ($q) {
                            $q->where('status', 1)->orWhereNull('status');
                        })
                        ->whereNotNull('user_id')
                        ->orderBy('id')
                        ->value('user_id');
                }

                if (! $userId && $teacherRoleId) {
                    $userId = DB::table('users')
                        ->where('school_id', $schoolId)
                        ->where('role_id', $teacherRoleId)
                        ->whereNotNull('id')
                        ->orderBy('id')
                        ->value('id');
                }

                if ($userId) {
                    DB::table('assigns')->where('id', $assign->id)->update(['created_by' => $userId]);
                }
            }
        });

        if (DB::getSchemaBuilder()->hasTable('assigns_students')) {
            DB::table('assigns_students')->whereNull('created_by')->orderBy('id')->chunkById(100, function ($rows) {
                foreach ($rows as $row) {
                    $parentCb = DB::table('assigns')->where('id', $row->assign_id)->value('created_by');
                    if ($parentCb) {
                        DB::table('assigns_students')->where('id', $row->id)->update(['created_by' => $parentCb]);
                    }
                }
            });
        }

        Log::info('backfill_assigns_school_teacher: after', [
            'assigns_created_by_null' => DB::table('assigns')->whereNull('created_by')->count(),
            'assigns_students_created_by_null' => DB::getSchemaBuilder()->hasTable('assigns_students')
                ? DB::table('assigns_students')->whereNull('created_by')->count()
                : 0,
        ]);
    }

    public function down(): void
    {
        // Data backfill; no safe automatic rollback.
    }
};
