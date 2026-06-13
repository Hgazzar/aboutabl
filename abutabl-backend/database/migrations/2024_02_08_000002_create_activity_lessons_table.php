<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateActivityLessonsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('activity_lessons')) {
            return;
        }
        Schema::create('activity_lessons', function (Blueprint $table) {
            $table->id();
            $table->string('name_en', 255)->nullable();
            $table->string('name_ar', 255)->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->unsignedBigInteger('subject_activity_id')->nullable();
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('subject_activity_id')->references('id')->on('subject_activities')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('activity_lessons');
    }
}
