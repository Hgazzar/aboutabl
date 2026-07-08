<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teachers_grades')) {
            Schema::table('teachers_grades', function (Blueprint $table) {
                $table->index(['user_id', 'status', 'class_id'], 'tg_user_status_class_idx');
            });
        }

        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                $table->index(['class_id', 'status'], 'students_class_status_idx');
            });
        }

        if (Schema::hasTable('student_subject_progress')) {
            Schema::table('student_subject_progress', function (Blueprint $table) {
                $table->index(['student_id', 'subject_id'], 'ssp_student_subject_idx');
            });
        }

        if (Schema::hasTable('assigns_students')) {
            Schema::table('assigns_students', function (Blueprint $table) {
                $table->index(['student_id', 'assign_id', 'opened_at'], 'as_student_assign_opened_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('teachers_grades')) {
            Schema::table('teachers_grades', function (Blueprint $table) {
                $table->dropIndex('tg_user_status_class_idx');
            });
        }

        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropIndex('students_class_status_idx');
            });
        }

        if (Schema::hasTable('student_subject_progress')) {
            Schema::table('student_subject_progress', function (Blueprint $table) {
                $table->dropIndex('ssp_student_subject_idx');
            });
        }

        if (Schema::hasTable('assigns_students')) {
            Schema::table('assigns_students', function (Blueprint $table) {
                $table->dropIndex('as_student_assign_opened_idx');
            });
        }
    }
};
