<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-024 — Lesson Completion infrastructure.
 *
 * Content completions are required so lesson completion can mean
 * "all required active lesson content is finished" (not merely opened).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('student_lesson_content_completions')) {
            Schema::create('student_lesson_content_completions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('lesson_content_id');
                $table->unsignedBigInteger('lesson_id');
                $table->timestamp('completed_at');
                $table->string('completion_source', 64);
                $table->timestamps();

                $table->foreign('student_id')->references('id')->on('students');
                $table->foreign('lesson_content_id')->references('id')->on('lessons_contents');
                $table->foreign('lesson_id')->references('id')->on('lessons');

                $table->unique(
                    ['student_id', 'lesson_content_id'],
                    'slcc_student_content_unique'
                );
                $table->index(
                    ['student_id', 'lesson_id'],
                    'slcc_student_lesson_idx'
                );
            });
        }

        if (! Schema::hasTable('student_lesson_completions')) {
            Schema::create('student_lesson_completions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('lesson_id');
                $table->unsignedBigInteger('subject_id');
                $table->timestamp('completed_at');
                $table->string('completion_source', 64);
                $table->timestamps();

                $table->foreign('student_id')->references('id')->on('students');
                $table->foreign('lesson_id')->references('id')->on('lessons');
                $table->foreign('subject_id')->references('id')->on('subjects');

                $table->unique(
                    ['student_id', 'lesson_id'],
                    'slc_student_lesson_unique'
                );
                $table->index(
                    ['student_id', 'subject_id'],
                    'slc_student_subject_idx'
                );
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_lesson_completions');
        Schema::dropIfExists('student_lesson_content_completions');
    }
};
