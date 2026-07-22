<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-046E — Persist teacher manual-grade notes on Runtime answers.
 */
class AddTeacherCommentToQuizAttemptAnswers extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('quiz_attempt_answers')) {
            return;
        }

        Schema::table('quiz_attempt_answers', function (Blueprint $table) {
            if (! Schema::hasColumn('quiz_attempt_answers', 'teacher_comment')) {
                $table->text('teacher_comment')->nullable()->after('graded_by');
            }
        });
    }

    public function down()
    {
        if (! Schema::hasTable('quiz_attempt_answers')) {
            return;
        }

        Schema::table('quiz_attempt_answers', function (Blueprint $table) {
            if (Schema::hasColumn('quiz_attempt_answers', 'teacher_comment')) {
                $table->dropColumn('teacher_comment');
            }
        });
    }
}
