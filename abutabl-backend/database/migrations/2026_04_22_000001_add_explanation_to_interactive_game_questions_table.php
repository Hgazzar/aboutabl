<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddExplanationToInteractiveGameQuestionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('interactive_game_questions', function (Blueprint $table) {
            if (! Schema::hasColumn('interactive_game_questions', 'explanation')) {
                $table->text('explanation')->nullable()->after('correct_answer');
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
        Schema::table('interactive_game_questions', function (Blueprint $table) {
            if (Schema::hasColumn('interactive_game_questions', 'explanation')) {
                $table->dropColumn('explanation');
            }
        });
    }
}
