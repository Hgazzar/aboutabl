<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Add2newColumToSchoolsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('schools', function (Blueprint $table) {
          $table->unsignedBigInteger('govern_id')->after('status')->nullable();
          $table->foreign('govern_id')->references('id')->on('governs');
          $table->unsignedBigInteger('city_id')->after('govern_id')->nullable();
          $table->foreign('city_id')->references('id')->on('cities');
         $table->longText('address')->after('city_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('schools', function (Blueprint $table) {
            //
        });
    }
}
