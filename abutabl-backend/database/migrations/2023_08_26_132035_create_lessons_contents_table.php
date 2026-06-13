<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLessonsContentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('lessons_contents', function (Blueprint $table) {
            $table->id();
            $table->string('name_en',150)->nullable();
            $table->string('name_ar',100)->nullable();
            $table->longText('about_en')->nullable();
            $table->longText('about_ar')->nullable();
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->foreign('lesson_id')->references('id')->on('lessons')->onDelete('cascade');
            $table->string('type',150)->nullable();        
            $table->string('size',150)->nullable();    
            $table->string('path')->nullable();    
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->enum('status',[1,0]);    
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
        Schema::dropIfExists('lessons_contents');
    }
}
