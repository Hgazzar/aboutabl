<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009C — QuizAttempt (Runtime aggregate).
 * State machine: in_progress, expired, submitted, auto_graded,
 * pending_manual, finalized, abandoned, voided (F-009B).
 * No soft deletes.
 */
class CreateQuizAttemptsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('quiz_attempts')) {
            return;
        }

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('quiz_version_id');
            $table->unsignedBigInteger('quiz_snapshot_id');

            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('school_id')->nullable();

            $table->unsignedBigInteger('assign_id')->nullable();
            $table->unsignedBigInteger('assign_student_id')->nullable();

            $table->string('status', 32)->default('in_progress');
            $table->unsignedSmallInteger('attempt_no')->default(1);

            $table->timestamp('started_at');
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('last_saved_at')->nullable();

            $table->unsignedInteger('time_limit_seconds')->nullable();
            $table->string('do_when_time_end', 255)->nullable();

            $table->string('client_instance_id', 36)->nullable();

            // Optimistic locking (F-009C)
            $table->unsignedInteger('row_version')->default(1);

            // Idempotency (F-009C) — Start and Submit both UNIQUE
            $table->string('start_idempotency_key', 64)->nullable();
            $table->string('submit_idempotency_key', 64)->nullable();

            /**
             * MySQL partial-unique alternative (F-009C §6):
             * Set to "s:{student}:q:{quiz}:a:{assign_student|0}" only while
             * status is in_progress or expired; NULL otherwise.
             * Enforces at most one active attempt per student/quiz/assign slot.
             */
            $table->string('active_slot_key', 96)->nullable();

            // F-009B terminal lifecycle audit (no logic in schema)
            $table->timestamp('voided_at')->nullable();
            $table->unsignedBigInteger('voided_by')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestamp('abandoned_at')->nullable();

            $table->timestamps();

            $table->foreign('quiz_id')
                ->references('id')
                ->on('quizes')
                ->onDelete('restrict');

            $table->foreign('quiz_version_id')
                ->references('id')
                ->on('quiz_versions')
                ->onDelete('restrict');

            $table->foreign('quiz_snapshot_id')
                ->references('id')
                ->on('quiz_snapshots')
                ->onDelete('restrict');

            $table->foreign('student_id')
                ->references('id')
                ->on('students')
                ->onDelete('restrict');

            $table->foreign('school_id')
                ->references('id')
                ->on('schools')
                ->onDelete('restrict');

            $table->foreign('assign_id')
                ->references('id')
                ->on('assigns')
                ->onDelete('set null');

            $table->foreign('assign_student_id')
                ->references('id')
                ->on('assigns_students')
                ->onDelete('set null');

            $table->foreign('voided_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->unique('active_slot_key', 'quiz_attempts_active_slot_unique');
            $table->unique('start_idempotency_key', 'quiz_attempts_start_idempotency_unique');
            $table->unique('submit_idempotency_key', 'quiz_attempts_submit_idempotency_unique');

            $table->index(
                ['student_id', 'quiz_id', 'status'],
                'quiz_attempts_student_quiz_status_idx'
            );
            $table->index(
                ['quiz_id', 'status'],
                'quiz_attempts_quiz_status_idx'
            );
            $table->index('assign_student_id', 'quiz_attempts_assign_student_idx');
            $table->index(
                ['school_id', 'created_at'],
                'quiz_attempts_school_created_idx'
            );
            $table->index(
                ['ends_at', 'status'],
                'quiz_attempts_ends_status_idx'
            );
        });
    }

    public function down()
    {
        Schema::dropIfExists('quiz_attempts');
    }
}
