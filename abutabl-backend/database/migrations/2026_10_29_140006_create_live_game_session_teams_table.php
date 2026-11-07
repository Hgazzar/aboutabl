<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLiveGameSessionTeamsTable extends Migration
{
    /**
     * Optional team rows for a session. Created before players so players.team_id
     * can reference this table.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('live_game_session_teams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->string('name');
            $table->string('color')->default('#f4c430');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('coins')->default(0);
            $table->timestamps();

            $table->index('live_game_session_id', 'lgst_session_idx');
            $table->foreign('live_game_session_id', 'lgst_session_fk')
                ->references('id')
                ->on('live_game_sessions')
                ->onDelete('cascade');
        });
    }

    /**
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('live_game_session_teams');
    }
}
