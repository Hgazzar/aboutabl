<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddActivityLessonIdToQuizesTable extends Migration
{
    public function up()
    {
        Schema::table('quizes', function (Blueprint $table) {
            if (! Schema::hasColumn('quizes', 'activity_lesson_id')) {
                $table->unsignedBigInteger('activity_lesson_id')->nullable()->after('lesson_id');
                $table->foreign('activity_lesson_id')->references('id')->on('activity_lessons')->onDelete('set null');
            }
        });
    }

    public function down()
    {
        Schema::table('quizes', function (Blueprint $table) {
            if (Schema::hasColumn('quizes', 'activity_lesson_id')) {
                $table->dropForeign(['activity_lesson_id']);
                $table->dropColumn('activity_lesson_id');
            }
        });
    }
}
