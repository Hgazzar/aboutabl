<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLiveGameSessionInvitesTable extends Migration
{
    /**
     * Invitation authorization rows for a hosted session.
     * Application status values: pending, accepted, revoked, expired.
     * Players who actually join live in live_game_session_players, not here.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('live_game_session_invites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('invited_by');
            $table->string('status', 16)->default('pending');
            $table->timestamp('invited_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['live_game_session_id', 'student_id'], 'lgsi_session_student_unique');
            $table->index(['student_id', 'status'], 'lgsi_student_status_idx');
            $table->index(['live_game_session_id', 'status'], 'lgsi_session_status_idx');
            $table->foreign('live_game_session_id', 'lgsi_session_fk')
                ->references('id')
                ->on('live_game_sessions')
                ->onDelete('cascade');
            $table->foreign('student_id', 'lgsi_student_fk')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');
            $table->foreign('invited_by', 'lgsi_invited_by_fk')
                ->references('id')
                ->on('users')
                ->onDelete('restrict');
        });
    }

    /**
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('live_game_session_invites');
    }
}
