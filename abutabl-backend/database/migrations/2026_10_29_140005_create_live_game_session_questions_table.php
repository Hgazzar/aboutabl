<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLiveGameSessionQuestionsTable extends Migration
{
    /**
     * Frozen copies of catalog questions for one session.
     * live_game_question_id is lineage only and nulls on catalog delete so
     * active/historical sessions keep their own question text and answers.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('live_game_session_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('live_game_question_id')->nullable();
            $table->text('question')->nullable();
            $table->text('image')->nullable();
            $table->text('voice_url')->nullable();
            $table->string('correct_answer');
            $table->string('answer_type')->nullable();
            $table->string('answer1');
            $table->string('answer2');
            $table->string('answer3');
            $table->string('answer4');
            $table->text('explanation')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['live_game_session_id', 'sort_order'], 'lgsq_session_sort_idx');
            $table->foreign('live_game_session_id', 'lgsq_session_fk')
                ->references('id')
                ->on('live_game_sessions')
                ->onDelete('cascade');
            $table->foreign('live_game_question_id', 'lgsq_catalog_fk')
                ->references('id')
                ->on('live_game_questions')
                ->nullOnDelete();
        });
    }

    /**
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('live_game_session_questions');
    }
}
