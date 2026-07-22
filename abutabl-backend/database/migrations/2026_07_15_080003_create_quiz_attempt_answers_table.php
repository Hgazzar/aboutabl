<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009C — QuizAttemptAnswer.
 * Per-question draft/frozen response + grading marks for one attempt.
 * No soft deletes.
 */
class CreateQuizAttemptAnswersTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('quiz_attempt_answers')) {
            return;
        }

        Schema::create('quiz_attempt_answers', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('attempt_id');
            $table->unsignedBigInteger('question_id');

            // Runtime identity within frozen snapshot (supports future question pools)
            $table->string('snapshot_question_key', 64);

            $table->json('response_payload')->nullable();

            $table->boolean('is_draft')->default(true);
            $table->timestamp('answered_at')->nullable();

            $table->decimal('auto_score', 10, 2)->nullable();
            $table->decimal('manual_score', 10, 2)->nullable();
            $table->boolean('is_correct')->nullable();
            $table->boolean('needs_manual')->default(false);

            $table->timestamp('graded_at')->nullable();
            $table->unsignedBigInteger('graded_by')->nullable();

            // Per-answer optimistic concurrency (F-009C Save idempotency)
            $table->unsignedInteger('answer_version')->default(1);

            $table->timestamps();

            $table->foreign('attempt_id')
                ->references('id')
                ->on('quiz_attempts')
                ->onDelete('restrict');

            $table->foreign('question_id')
                ->references('id')
                ->on('questions')
                ->onDelete('restrict');

            $table->foreign('graded_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->unique(
                ['attempt_id', 'snapshot_question_key'],
                'quiz_attempt_answers_attempt_snapshot_key_unique'
            );

            $table->index('attempt_id', 'quiz_attempt_answers_attempt_id_idx');
            $table->index('question_id', 'quiz_attempt_answers_question_id_idx');
        });
    }

    public function down()
    {
        Schema::dropIfExists('quiz_attempt_answers');
    }
}
