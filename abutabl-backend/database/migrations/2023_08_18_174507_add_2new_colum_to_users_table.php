<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Add2newColumToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
          $table->date('birthday')->after('school_id')->nullble();
          $table->unsignedBigInteger('govern_id')->after('birthday')->nullable();
          $table->foreign('govern_id')->references('id')->on('governs');
          $table->unsignedBigInteger('city_id')->after('govern_id')->nullable();
          $table->foreign('city_id')->references('id')->on('cities');
         $table->longText('address')->after('city_id')->nullable();
         $table->string('photo')->after('address')->nullable();
         $table->string('gender')->after('photo')->nullable();
         $table->string('specialize')->after('gender')->nullable();
         $table->date('joining_date')->after('specialize')->nullble();
         $table->unsignedBigInteger('role_id')->nullable()->after('joining_date');
         $table->foreign('role_id')->references('id')->on('roles');


        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
}
