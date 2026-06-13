<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInteractiveStudentAnswersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('interactive_student_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('interactive_game_question_id');
            $table->unsignedBigInteger('student_id');
            $table->text('answer')->nullable();
            $table->unsignedTinyInteger('correct')->default(0);
            $table->timestamps();

            $table->foreign('interactive_game_question_id', 'isa_question_fk')
                ->references('id')
                ->on('interactive_game_questions')
                ->onDelete('cascade');

            $table->foreign('student_id', 'isa_student_fk')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');

            $table->index(['student_id', 'created_at'], 'isa_student_created_idx');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('interactive_student_answers');
    }
}
