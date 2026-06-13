<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentAnswerGamesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('student_answer_games', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('game_question_id');
            $table->unsignedBigInteger('student_id');
            $table->string('question');
            $table->string('answer');
            $table->tinyInteger('correct');
            $table->timestamps();
            $table->foreign('game_question_id')->on('game_questions')->references('id')->onDelete('cascade');
            $table->foreign('student_id')->on('students')->references('id')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('student_answer_games');
    }
}
