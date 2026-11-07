<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLiveGameSessionsTable extends Migration
{
    /**
     * Hosted classroom sessions. Hosts are AbuTabl users (teachers).
     * One-active-session-per-class is enforced in application code, not here:
     * MySQL 8 has no filtered unique index on (class_id) WHERE status IN (...).
     *
     * @return void
     */
    public function up()
    {
        Schema::create('live_game_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 8)->unique();
            $table->unsignedBigInteger('live_game_id');
            $table->unsignedBigInteger('host_user_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('status')->default('lobby');
            $table->unsignedInteger('current_question_index')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('goal')->default('comprehension');
            $table->unsignedTinyInteger('question_seconds')->default(20);
            $table->boolean('team_mode')->default(false);
            $table->unsignedInteger('firewood')->default(0);
            $table->boolean('fire_lit')->default(false);
            $table->string('active_event')->nullable();
            $table->unsignedInteger('live_version')->default(0);
            $table->boolean('firewall_active')->default(false);
            $table->boolean('bridge_broken')->default(false);
            $table->decimal('class_accuracy', 5, 2)->nullable();
            $table->timestamps();

            $table->index(['class_id', 'status'], 'lgsess_class_status_idx');
            $table->index('host_user_id', 'lgsess_host_idx');
            $table->index('school_id', 'lgsess_school_idx');
            $table->foreign('live_game_id', 'lgsess_game_fk')
                ->references('id')
                ->on('live_games')
                ->onDelete('restrict');
            $table->foreign('host_user_id', 'lgsess_host_fk')
                ->references('id')
                ->on('users')
                ->onDelete('restrict');
            $table->foreign('class_id', 'lgsess_class_fk')
                ->references('id')
                ->on('classes')
                ->onDelete('restrict');
            $table->foreign('school_id', 'lgsess_school_fk')
                ->references('id')
                ->on('schools')
                ->onDelete('restrict');
        });
    }

    /**
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('live_game_sessions');
    }
}
