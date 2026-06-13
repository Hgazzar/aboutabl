<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGamesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('name_en',255)->nullable();
            $table->string('name_ar',255)->nullable();
            $table->string('code',255)->nullable();
            $table->longText('des_en')->nullable();
            $table->longText('des_ar')->nullable();
            $table->string('background')->nullable();
            $table->string('path')->nullable();
            $table->string('size',150)->nullable();    
            $table->string('ext',150)->nullable();   
            $table->unsignedBigInteger('grade_id')->nullable();
            $table->foreign('grade_id')->references('id')->on('grades')->onDelete('cascade');
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
        Schema::dropIfExists('games');
    }
}
