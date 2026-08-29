<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentQuestsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('student_quests')) {
            return;
        }

        Schema::create('student_quests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('quest_key', 128);
            $table->string('quest_type', 32);
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('unit_id');
            $table->string('unit_label', 255);
            $table->string('subject_name', 255);
            $table->string('reward_label', 64)->nullable();
            $table->unsignedInteger('progress_current')->default(0);
            $table->unsignedInteger('progress_target')->default(0);
            $table->string('status', 16)->default('active');
            $table->string('cta_path', 512)->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'quest_key'], 'student_quests_student_quest_key_unique');
            $table->foreign('student_id')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');
            $table->index(['student_id', 'status'], 'student_quests_student_status_idx');
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_quests');
    }
}
