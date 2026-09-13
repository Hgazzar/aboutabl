<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Opt-in student friendships (inviter → invitee, pending | accepted).
 * Friend streak is computed at read time — not stored here.
 */
class CreateStudentFriendshipsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('student_friendships')) {
            return;
        }

        Schema::create('student_friendships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('friend_student_id');
            $table->string('status', 16)->default('pending');
            $table->unsignedBigInteger('school_id');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['student_id', 'friend_student_id'],
                'student_friendships_directed_unique'
            );

            $table->foreign('student_id')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');

            $table->foreign('friend_student_id')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');

            $table->foreign('school_id')
                ->references('id')
                ->on('schools')
                ->onDelete('cascade');

            $table->index(
                ['friend_student_id', 'status'],
                'student_friendships_friend_status_idx'
            );
            $table->index(
                ['student_id', 'status'],
                'student_friendships_student_status_idx'
            );
            $table->index(
                ['school_id', 'status'],
                'student_friendships_school_status_idx'
            );
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_friendships');
    }
}
