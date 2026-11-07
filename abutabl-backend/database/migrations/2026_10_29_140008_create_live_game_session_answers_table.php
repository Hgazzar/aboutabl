<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLiveGameSessionAnswersTable extends Migration
{
    /**
     * Per-attempt answers against session question snapshots, not catalog rows.
     * No unique (session, student, question): the engine allows retries.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('live_game_session_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('live_game_session_question_id');
            $table->string('answer');
            $table->boolean('correct')->default(false);
            $table->integer('coins_delta')->default(0);
            $table->unsignedInteger('elapsed_ms')->nullable();
            $table->boolean('timed_out')->default(false);
            $table->boolean('is_retry')->default(false);
            $table->boolean('is_reinforce')->default(false);
            $table->unsignedTinyInteger('attempt')->default(1);
            $table->timestamps();

            $table->index(
                ['live_game_session_id', 'student_id', 'live_game_session_question_id'],
                'lgsa_session_student_question_idx'
            );
            $table->foreign('live_game_session_id', 'lgsa_session_fk')
                ->references('id')
                ->on('live_game_sessions')
                ->onDelete('cascade');
            $table->foreign('student_id', 'lgsa_student_fk')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');
            $table->foreign('live_game_session_question_id', 'lgsa_snapshot_fk')
                ->references('id')
                ->on('live_game_session_questions')
                ->onDelete('cascade');
        });
    }

    /**
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('live_game_session_answers');
    }
}
