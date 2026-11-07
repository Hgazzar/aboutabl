<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLiveGameSchoolsTable extends Migration
{
    /**
     * School entitlement pivot. An empty set means no schools are entitled
     * (not "all schools").
     *
     * @return void
     */
    public function up()
    {
        Schema::create('live_game_schools', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_id');
            $table->unsignedBigInteger('school_id');
            $table->timestamps();

            $table->unique(['live_game_id', 'school_id'], 'lgs_game_school_unique');
            $table->foreign('live_game_id', 'lgs_game_fk')
                ->references('id')
                ->on('live_games')
                ->onDelete('cascade');
            $table->foreign('school_id', 'lgs_school_fk')
                ->references('id')
                ->on('schools')
                ->onDelete('cascade');
        });
    }

    /**
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('live_game_schools');
    }
}
