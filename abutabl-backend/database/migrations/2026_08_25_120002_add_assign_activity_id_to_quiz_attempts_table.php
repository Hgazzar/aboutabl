<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Link quiz attempts to a specific learning activity on multi-activity assigns.
 */
class AddAssignActivityIdToQuizAttemptsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('quiz_attempts')) {
            return;
        }

        if (Schema::hasColumn('quiz_attempts', 'assign_activity_id')) {
            return;
        }

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->unsignedBigInteger('assign_activity_id')->nullable()->after('assign_student_id');

            $table->foreign('assign_activity_id')
                ->references('id')
                ->on('assign_activities')
                ->onDelete('set null');

            $table->index('assign_activity_id', 'quiz_attempts_assign_activity_idx');
        });
    }

    public function down()
    {
        if (! Schema::hasTable('quiz_attempts') || ! Schema::hasColumn('quiz_attempts', 'assign_activity_id')) {
            return;
        }

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropForeign(['assign_activity_id']);
            $table->dropIndex('quiz_attempts_assign_activity_idx');
            $table->dropColumn('assign_activity_id');
        });
    }
}
