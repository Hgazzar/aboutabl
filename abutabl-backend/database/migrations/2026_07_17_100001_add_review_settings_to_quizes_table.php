<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009E Step 1 — Quiz Definition review settings.
 * Additive only. Defaults false. Not frozen into Runtime yet.
 */
class AddReviewSettingsToQuizesTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('quizes')) {
            return;
        }

        Schema::table('quizes', function (Blueprint $table) {
            if (! Schema::hasColumn('quizes', 'review_after_submit')) {
                $table->boolean('review_after_submit')->default(false)
                    ->after('shuffle_answers');
            }

            if (! Schema::hasColumn('quizes', 'show_correct_answers')) {
                $table->boolean('show_correct_answers')->default(false)
                    ->after('review_after_submit');
            }

            if (! Schema::hasColumn('quizes', 'show_explanations')) {
                $table->boolean('show_explanations')->default(false)
                    ->after('show_correct_answers');
            }
        });
    }

    public function down()
    {
        if (! Schema::hasTable('quizes')) {
            return;
        }

        Schema::table('quizes', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('quizes', 'review_after_submit')) {
                $columns[] = 'review_after_submit';
            }
            if (Schema::hasColumn('quizes', 'show_correct_answers')) {
                $columns[] = 'show_correct_answers';
            }
            if (Schema::hasColumn('quizes', 'show_explanations')) {
                $columns[] = 'show_explanations';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
}
