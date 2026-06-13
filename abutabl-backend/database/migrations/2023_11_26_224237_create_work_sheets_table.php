<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateWorkSheetsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('work_sheets', function (Blueprint $table) {
            $table->id();
            $table->string('name_en',255)->nullable();
            $table->string('name_ar',255)->nullable();
            $table->longText('des_en')->nullable();    
            $table->longText('des_ar')->nullable();
            $table->enum('status',[1,0]);    
            $table->string('code',255)->nullable();
            $table->string('background',255)->nullable();
            $table->string('file_name',255)->nullable();
            $table->string('file_hash_name',255)->nullable();   
            $table->string('size',255)->nullable();
            $table->string('path',255)->nullable();
            $table->string('ext',255)->nullable();  
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();  
 
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
        Schema::dropIfExists('work_sheets');
    }
}
