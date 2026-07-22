<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009D Sprint 2 — Persist per-attempt answer choice order (shuffle once at Start).
 * Shape: { snapshot_question_key: ["answer3","answer1",...] }
 */
class AddAnswerOrderToQuizAttemptsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('quiz_attempts')) {
            return;
        }

        if (! Schema::hasColumn('quiz_attempts', 'answer_order')) {
            Schema::table('quiz_attempts', function (Blueprint $table) {
                $table->json('answer_order')->nullable()->after('question_order');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('quiz_attempts') && Schema::hasColumn('quiz_attempts', 'answer_order')) {
            Schema::table('quiz_attempts', function (Blueprint $table) {
                $table->dropColumn('answer_order');
            });
        }
    }
}
