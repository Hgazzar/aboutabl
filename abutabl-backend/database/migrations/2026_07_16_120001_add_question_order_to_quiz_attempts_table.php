<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009D Sprint 2 — Persist per-attempt question order (shuffle once at Start).
 */
class AddQuestionOrderToQuizAttemptsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('quiz_attempts')) {
            return;
        }

        if (! Schema::hasColumn('quiz_attempts', 'question_order')) {
            Schema::table('quiz_attempts', function (Blueprint $table) {
                $table->json('question_order')->nullable()->after('do_when_time_end');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('quiz_attempts') && Schema::hasColumn('quiz_attempts', 'question_order')) {
            Schema::table('quiz_attempts', function (Blueprint $table) {
                $table->dropColumn('question_order');
            });
        }
    }
}
