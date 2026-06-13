<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInteractiveGameQuestionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('interactive_game_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('interactive_game_id');
            $table->text('question')->nullable();
            $table->string('correct_answer')->nullable();
            $table->string('answer1')->nullable();
            $table->string('answer2')->nullable();
            $table->string('answer3')->nullable();
            $table->string('answer4')->nullable();
            $table->string('image')->nullable();
            $table->string('voice_url')->nullable();
            $table->string('answer_type', 32)->default('text');
            $table->json('options')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('interactive_game_id', 'igq_game_fk')
                ->references('id')
                ->on('interactive_games')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('interactive_game_questions');
    }
}
