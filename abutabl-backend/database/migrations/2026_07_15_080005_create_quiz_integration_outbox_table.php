<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009C — QuizIntegrationOutbox.
 * Durable canonical domain events; Runtime does not call downstream modules directly.
 * No soft deletes.
 */
class CreateQuizIntegrationOutboxTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('quiz_integration_outbox')) {
            return;
        }

        Schema::create('quiz_integration_outbox', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('attempt_id')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();

            $table->string('event_type', 64);

            $table->string('idempotency_key', 128);

            $table->json('payload');

            // pending | published | dead (F-009C)
            $table->string('status', 16)->default('pending');

            $table->unsignedSmallInteger('relay_attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            $table->foreign('attempt_id')
                ->references('id')
                ->on('quiz_attempts')
                ->onDelete('set null');

            $table->foreign('school_id')
                ->references('id')
                ->on('schools')
                ->onDelete('set null');

            $table->unique('idempotency_key', 'quiz_integration_outbox_idempotency_unique');

            $table->index(
                ['status', 'created_at'],
                'quiz_integration_outbox_status_created_idx'
            );
            $table->index(
                ['attempt_id', 'event_type'],
                'quiz_integration_outbox_attempt_event_idx'
            );
            $table->index('school_id', 'quiz_integration_outbox_school_id_idx');
        });
    }

    public function down()
    {
        Schema::dropIfExists('quiz_integration_outbox');
    }
}
