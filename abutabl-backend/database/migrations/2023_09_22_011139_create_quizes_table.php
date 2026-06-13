<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuizesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quizes', function (Blueprint $table) {
            $table->id();
            $table->string('title_en',255)->nullable();
            $table->string('title_ar',255)->nullable();
            $table->longText('instructions_en')->nullable();    
            $table->longText('instructions_ar')->nullable();
            $table->enum('status',[1,0]);    
            $table->string('code',255)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->unsignedBigInteger('grade_id')->nullable();
            $table->foreign('grade_id')->references('id')->on('grades')->onDelete('cascade');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->string('navigation_method',255)->nullable();
            $table->string('questions_per_page',255)->nullable();
            $table->string('score_method',255)->nullable();
            $table->double('score_to_pass',15,2)->nullable();
            $table->enum('unlimited_attempts',[1,0])->nullable();    
            $table->integer('num_attempts')->nullable();
            $table->enum('notify_student',[1,0])->nullable();    
            $table->enum('notify_about_submission',[1,0])->nullable();    
            $table->enum('notify_about_late_submission',[1,0])->nullable();    
            $table->enum('reminder_before_due_date',[1,0])->nullable();    
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->double('time_limit', 15, 2)->nullable();
            $table->string('type_time',255)->nullable();
            $table->longText('do_when_time_end')->nullable();
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
        Schema::dropIfExists('quizes');
    }
}
