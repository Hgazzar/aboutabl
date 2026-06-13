<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryFilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('library_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('library_id')->nullable();
            $table->foreign('library_id')->references('id')->on('libraries')->onDelete('cascade');
            $table->string('path')->nullable();
            $table->string('size',150)->nullable();    
            $table->string('ext',150)->nullable();   
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
        Schema::dropIfExists('library_files');
    }
}
