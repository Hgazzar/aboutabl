<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddInteractiveGameFieldsToStudentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'game_password')) {
                $table->text('game_password')->nullable();
            }
            if (!Schema::hasColumn('students', 'games_coins')) {
                $table->unsignedInteger('games_coins')->default(0);
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'games_coins')) {
                $table->dropColumn('games_coins');
            }
            if (Schema::hasColumn('students', 'game_password')) {
                $table->dropColumn('game_password');
            }
        });
    }
}
