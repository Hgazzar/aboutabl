<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009C — QuizVersion (Runtime SSOT).
 * Immutable published revision bound to Definition quizes.id.
 * No soft deletes — status superseded/void_publish instead.
 */
class CreateQuizVersionsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('quiz_versions')) {
            return;
        }

        Schema::create('quiz_versions', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('quiz_id');
            $table->unsignedInteger('version_number');

            // draft | published | superseded | void_publish (F-009B/C)
            $table->string('status', 32)->default('draft');

            // SHA-256 hex of frozen definition material at publish time
            $table->char('content_hash', 64)->nullable();

            // Frozen timer/attempt/pass/score_method/navigation policy (JSON)
            $table->json('settings_frozen')->nullable();

            $table->unsignedBigInteger('published_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('source_definition_updated_at')->nullable();

            $table->timestamps();

            $table->foreign('quiz_id')
                ->references('id')
                ->on('quizes')
                ->onDelete('restrict');

            $table->foreign('published_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->unique(
                ['quiz_id', 'version_number'],
                'quiz_versions_quiz_version_number_unique'
            );

            $table->index(
                ['quiz_id', 'status', 'published_at'],
                'quiz_versions_quiz_status_published_idx'
            );
        });
    }

    public function down()
    {
        Schema::dropIfExists('quiz_versions');
    }
}
