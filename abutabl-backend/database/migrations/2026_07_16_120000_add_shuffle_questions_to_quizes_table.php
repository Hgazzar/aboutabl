<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009D Sprint 2 — Definition: shuffle_questions setting.
 */
class AddShuffleQuestionsToQuizesTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('quizes')) {
            return;
        }

        if (! Schema::hasColumn('quizes', 'shuffle_questions')) {
            Schema::table('quizes', function (Blueprint $table) {
                $table->enum('shuffle_questions', [1, 0])->nullable()->default(0)
                    ->after('navigation_method');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('quizes') && Schema::hasColumn('quizes', 'shuffle_questions')) {
            Schema::table('quizes', function (Blueprint $table) {
                $table->dropColumn('shuffle_questions');
            });
        }
    }
}
