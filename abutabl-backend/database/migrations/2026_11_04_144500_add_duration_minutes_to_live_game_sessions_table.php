<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDurationMinutesToLiveGameSessionsTable extends Migration
{
    /**
     * Teacher-chosen session length in minutes.
     * Null → begin uses parseMinutes(live_games.time) (legacy default).
     */
    public function up()
    {
        Schema::table('live_game_sessions', function (Blueprint $table) {
            $table->unsignedSmallInteger('duration_minutes')->nullable()->after('ends_at');
        });
    }

    public function down()
    {
        Schema::table('live_game_sessions', function (Blueprint $table) {
            $table->dropColumn('duration_minutes');
        });
    }
}
