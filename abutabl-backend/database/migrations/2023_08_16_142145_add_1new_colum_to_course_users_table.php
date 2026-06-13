<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Add1newColumToCourseUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username',150)->after('name')->unique();
            $table->enum('verify',[1,0])->after('password')->default(0);
            $table->enum('status',[1,0])->after('verify')->default(1);
            $table->unsignedBigInteger('school_id')->after('status')->nullable();
            $table->foreign('school_id')->references('id')->on('schools');
            $table->string('verification_code',150)->nullable();
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
