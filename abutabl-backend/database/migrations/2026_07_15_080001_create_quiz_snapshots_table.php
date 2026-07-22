<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009C — QuizSnapshot (Runtime SSOT).
 * Immutable question set + grading material for a QuizVersion.
 * Entire row is append-only; no soft deletes.
 */
class CreateQuizSnapshotsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('quiz_snapshots')) {
            return;
        }

        Schema::create('quiz_snapshots', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('quiz_version_id');
            $table->unsignedBigInteger('quiz_id');

            $table->char('content_hash', 64)->nullable();

            // Frozen ordered questions, options, keys, per-item scores (JSON)
            $table->json('payload');

            $table->unsignedInteger('item_count')->default(0);

            $table->timestamps();

            $table->foreign('quiz_version_id')
                ->references('id')
                ->on('quiz_versions')
                ->onDelete('restrict');

            $table->foreign('quiz_id')
                ->references('id')
                ->on('quizes')
                ->onDelete('restrict');

            $table->unique(
                'quiz_version_id',
                'quiz_snapshots_version_unique'
            );

            $table->index('quiz_id', 'quiz_snapshots_quiz_id_idx');
        });
    }

    public function down()
    {
        Schema::dropIfExists('quiz_snapshots');
    }
}
