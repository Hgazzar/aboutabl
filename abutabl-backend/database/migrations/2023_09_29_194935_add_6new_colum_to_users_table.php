<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Add6newColumToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
          $table->string('specialize_ar')->after('specialize')->nullable();
          $table->string('fname_en')->after('name_ar')->nullable();
          $table->string('lname_en')->after('fname_en')->nullable();
          $table->string('fname_ar')->after('lname_en')->nullable();
          $table->string('lname_ar')->after('lname_en')->nullable();
          $table->longText('address_ar')->after('address')->nullable();
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
