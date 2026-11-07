<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLiveGameSessionPlayersTable extends Migration
{
    /**
     * Session participants. student_id references AbuTabl students.
     * coins is session-scoped runtime currency, separate from the student wallet.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('live_game_session_players', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('coins')->default(0);
            $table->unsignedTinyInteger('character_slot')->default(0);
            $table->boolean('answered_current')->default(false);
            $table->string('hack_password')->nullable();
            $table->json('password_options')->nullable();
            $table->string('reward_type')->nullable();
            $table->json('reward_data')->nullable();
            $table->boolean('reward_pending')->default(false);
            $table->unsignedInteger('streak')->default(0);
            $table->unsignedInteger('best_streak')->default(0);
            $table->string('power')->nullable();
            $table->boolean('power_used')->default(false);
            $table->timestamp('frozen_until')->nullable();
            $table->boolean('shield')->default(false);
            $table->unsignedBigInteger('team_id')->nullable();
            $table->json('retry_queue')->nullable();
            $table->unsignedInteger('answers_since_retry')->default(0);
            $table->boolean('pending_reinforce')->default(false);
            $table->unsignedBigInteger('reinforce_question_id')->nullable();
            $table->timestamp('question_started_at')->nullable();
            $table->unsignedInteger('fastest_ms')->nullable();
            $table->integer('progress_penalty')->default(0);
            $table->string('last_protocol')->nullable();
            $table->timestamps();

            $table->unique(['live_game_session_id', 'student_id'], 'lgsp_session_student_unique');
            $table->foreign('live_game_session_id', 'lgsp_session_fk')
                ->references('id')
                ->on('live_game_sessions')
                ->onDelete('cascade');
            $table->foreign('student_id', 'lgsp_student_fk')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');
            $table->foreign('team_id', 'lgsp_team_fk')
                ->references('id')
                ->on('live_game_session_teams')
                ->nullOnDelete();
            $table->foreign('reinforce_question_id', 'lgsp_reinforce_fk')
                ->references('id')
                ->on('live_game_session_questions')
                ->nullOnDelete();
        });
    }

    /**
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('live_game_session_players');
    }
}
