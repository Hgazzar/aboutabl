<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('from_user_type')->nullable();
            $table->unsignedBigInteger('from_user_id')->nullable()->comment('null if from system');
            $table->foreign('from_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unsignedBigInteger('to_user_id');
            $table->foreign('to_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('to_user_type')->nullable();
            $table->string('title')->nullable();
            $table->string('description',1000)->nullable();
            $table->string('url',1000)->nullable();
            $table->string('type')->nullable()->comment('type action');
            $table->unsignedBigInteger('type_id')->nullable()->comment('type action id');
            $table->boolean('is_read')->default(0)->comment('0 is not read yet');
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
        Schema::dropIfExists('notifications');
    }
};
