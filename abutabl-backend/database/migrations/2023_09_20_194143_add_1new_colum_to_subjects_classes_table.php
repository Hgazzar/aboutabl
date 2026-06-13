<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Add1newColumToSubjectsClassesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('subjects_classes', function (Blueprint $table) {
           $table->unsignedBigInteger('subject_school_id')->after('id')->nullable();
           $table->foreign('subject_school_id')->references('id')->on('subjects_schools')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('subjects_classes', function (Blueprint $table) {
            //
        });
    }
}
