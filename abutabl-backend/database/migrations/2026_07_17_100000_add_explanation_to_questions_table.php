<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009E Step 1 — Question explanation (nullable text).
 * Additive only. Does not affect grading or publishing.
 */
class AddExplanationToQuestionsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('questions')) {
            return;
        }

        if (! Schema::hasColumn('questions', 'explanation')) {
            Schema::table('questions', function (Blueprint $table) {
                $table->text('explanation')->nullable()->after('reason_is_required');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('questions') && Schema::hasColumn('questions', 'explanation')) {
            Schema::table('questions', function (Blueprint $table) {
                $table->dropColumn('explanation');
            });
        }
    }
}
