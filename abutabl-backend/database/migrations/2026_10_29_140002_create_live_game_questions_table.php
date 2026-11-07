<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLiveGameQuestionsTable extends Migration
{
    /**
     * Editable catalog questions. Session play uses live_game_session_questions
     * snapshots, not this table, so later catalog edits cannot change an
     * in-flight competition.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('live_game_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_id');
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

            $table->index(['live_game_id', 'sort_order'], 'lgq_game_sort_idx');
            $table->foreign('live_game_id', 'lgq_game_fk')
                ->references('id')
                ->on('live_games')
                ->onDelete('cascade');
        });
    }

    /**
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('live_game_questions');
    }
}
