<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Student work linked to a specific assign_activity (not assignment-only).
 */
class CreateAssignActivitySubmissionsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('assign_activity_submissions')) {
            return;
        }

        Schema::create('assign_activity_submissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assign_id');
            $table->unsignedBigInteger('assign_activity_id');
            $table->unsignedBigInteger('assign_student_id');
            $table->unsignedBigInteger('student_id');
            $table->string('status', 32)->default('pending');
            $table->decimal('score', 8, 2)->nullable();
            $table->decimal('max_score', 8, 2)->nullable();
            $table->decimal('percent', 5, 2)->nullable();
            $table->decimal('completeness', 5, 2)->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->unsignedBigInteger('graded_by')->nullable();
            $table->text('teacher_feedback')->nullable();
            $table->timestamps();

            $table->foreign('assign_id')
                ->references('id')
                ->on('assigns')
                ->onDelete('cascade');
            $table->foreign('assign_activity_id')
                ->references('id')
                ->on('assign_activities')
                ->onDelete('cascade');
            $table->foreign('assign_student_id')
                ->references('id')
                ->on('assigns_students')
                ->onDelete('cascade');
            $table->foreign('student_id')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');
            $table->foreign('graded_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->unique(
                ['assign_activity_id', 'student_id'],
                'assign_activity_submissions_unique_student'
            );
            $table->index(['assign_id', 'student_id'], 'assign_activity_submissions_assign_student_idx');
            $table->index('status', 'assign_activity_submissions_status_idx');
        });
    }

    public function down()
    {
        Schema::dropIfExists('assign_activity_submissions');
    }
}
