<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuestionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->longText('question')->nullable();
            $table->longText('corAnswer')->nullable();
            $table->longText('answer1')->nullable();
            $table->longText('answer2')->nullable();
            $table->longText('answer3')->nullable();
            $table->longText('answer4')->nullable();
            $table->longText('answer5')->nullable();
            $table->longText('answer6')->nullable();
            $table->longText('answer7')->nullable();
            $table->longText('answer8')->nullable();
            $table->longText('answer1_1')->nullable();
            $table->longText('answer1_2')->nullable();
            $table->longText('answer1_3')->nullable();
            $table->longText('answer1_4')->nullable();
            $table->longText('answer1_5')->nullable();
            $table->longText('answer1_6')->nullable();
            $table->longText('answer1_7')->nullable();
            $table->longText('answer1_8')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->foreign('lesson_id')->references('id')->on('lessons')->onDelete('cascade');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
             $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->enum('status',[1,0])->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('questions');
    }
}
