<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009D Sprint 2 — Definition: shuffle_answers setting.
 */
class AddShuffleAnswersToQuizesTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('quizes')) {
            return;
        }

        if (! Schema::hasColumn('quizes', 'shuffle_answers')) {
            Schema::table('quizes', function (Blueprint $table) {
                $table->enum('shuffle_answers', [1, 0])->nullable()->default(0)
                    ->after('shuffle_questions');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('quizes') && Schema::hasColumn('quizes', 'shuffle_answers')) {
            Schema::table('quizes', function (Blueprint $table) {
                $table->dropColumn('shuffle_answers');
            });
        }
    }
}
