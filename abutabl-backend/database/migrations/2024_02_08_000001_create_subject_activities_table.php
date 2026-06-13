<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSubjectActivitiesTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('subject_activities')) {
            return;
        }
        Schema::create('subject_activities', function (Blueprint $table) {
            $table->id();
            $table->string('name_en', 255)->nullable();
            $table->string('name_ar', 255)->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->string('type', 100)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('subject_activities');
    }
}
