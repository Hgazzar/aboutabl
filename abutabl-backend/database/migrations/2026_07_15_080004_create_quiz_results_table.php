<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009C — QuizResult (authoritative outcome SSOT).
 * Multiple grade_version rows per attempt; one authoritative via authoritative_slot.
 * No soft deletes — void handled at attempt level.
 */
class CreateQuizResultsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('quiz_results')) {
            return;
        }

        Schema::create('quiz_results', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('attempt_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('school_id')->nullable();

            $table->decimal('raw_score', 10, 2)->default(0);
            $table->decimal('max_score', 10, 2)->default(0);
            $table->decimal('scaled_score', 10, 2)->nullable();
            $table->decimal('percent', 5, 2)->default(0);

            $table->decimal('auto_score_total', 10, 2)->default(0);
            $table->decimal('manual_score_total', 10, 2)->default(0);

            $table->boolean('passed')->default(false);
            $table->boolean('pending_manual')->default(false);

            $table->unsignedInteger('grade_version')->default(1);
            $table->boolean('is_authoritative')->default(false);

            /**
             * MySQL partial-unique alternative (F-009C §8):
             * Set to attempt_id when is_authoritative=true; NULL otherwise.
             * Guarantees at most one authoritative result row per attempt.
             */
            $table->unsignedBigInteger('authoritative_slot')->nullable();

            $table->timestamp('finalized_at');

            // Item-level breakdown / audit pointer (JSON)
            $table->json('breakdown')->nullable();

            $table->timestamps();

            $table->foreign('attempt_id')
                ->references('id')
                ->on('quiz_attempts')
                ->onDelete('restrict');

            $table->foreign('student_id')
                ->references('id')
                ->on('students')
                ->onDelete('restrict');

            $table->foreign('quiz_id')
                ->references('id')
                ->on('quizes')
                ->onDelete('restrict');

            $table->foreign('school_id')
                ->references('id')
                ->on('schools')
                ->onDelete('restrict');

            $table->unique(
                ['attempt_id', 'grade_version'],
                'quiz_results_attempt_grade_version_unique'
            );

            $table->unique(
                'authoritative_slot',
                'quiz_results_authoritative_slot_unique'
            );

            $table->index(
                ['student_id', 'quiz_id', 'finalized_at'],
                'quiz_results_student_quiz_finalized_idx'
            );
            $table->index(
                ['quiz_id', 'passed', 'finalized_at'],
                'quiz_results_quiz_passed_finalized_idx'
            );
            $table->index(
                ['school_id', 'finalized_at'],
                'quiz_results_school_finalized_idx'
            );
        });
    }

    public function down()
    {
        Schema::dropIfExists('quiz_results');
    }
}
