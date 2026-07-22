<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Teacher notes / evaluations for a student in a class.
 * History = multiple rows; latest = newest created_at.
 * No separate history/attachments tables in v1.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_evaluations')) {
            return;
        }

        Schema::create('teacher_evaluations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->nullable()->index();
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('student_id');
            $table->text('note');
            $table->timestamps();

            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');

            $table->index(
                ['student_id', 'class_id', 'created_at'],
                'teacher_evaluations_student_class_created_idx'
            );
            $table->index(
                ['teacher_id', 'class_id'],
                'teacher_evaluations_teacher_class_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_evaluations');
    }
};
