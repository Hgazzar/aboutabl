<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-040A — Production lookup indexes for Insight / Profile / Metrics hot paths.
 * Additive indexes only; no schema semantics or business-rule changes.
 */
class AddProductionLookupIndexesF040a extends Migration
{
    public function up(): void
    {
        $this->addIndexIfMissing('student_lesson_completions', 'slc_student_completed_at_idx', function (Blueprint $table) {
            $table->index(['student_id', 'completed_at'], 'slc_student_completed_at_idx');
        });

        $this->addIndexIfMissing('student_lesson_content_completions', 'slcc_student_completed_at_idx', function (Blueprint $table) {
            $table->index(['student_id', 'completed_at'], 'slcc_student_completed_at_idx');
        });

        $this->addIndexIfMissing('performance_facts', 'pf_student_captured_at_idx', function (Blueprint $table) {
            $table->index(['student_id', 'captured_at'], 'pf_student_captured_at_idx');
        });

        $this->addIndexIfMissing('quiz_results', 'qr_student_authoritative_finalized_idx', function (Blueprint $table) {
            $table->index(
                ['student_id', 'is_authoritative', 'finalized_at'],
                'qr_student_authoritative_finalized_idx'
            );
        });

        $this->addIndexIfMissing('quiz_attempts', 'qa_student_status_idx', function (Blueprint $table) {
            $table->index(['student_id', 'status'], 'qa_student_status_idx');
        });

        $this->addIndexIfMissing('quiz_attempts', 'qa_student_started_at_idx', function (Blueprint $table) {
            $table->index(['student_id', 'started_at'], 'qa_student_started_at_idx');
        });
    }

    public function down(): void
    {
        $this->dropIndexIfExists('student_lesson_completions', 'slc_student_completed_at_idx');
        $this->dropIndexIfExists('student_lesson_content_completions', 'slcc_student_completed_at_idx');
        $this->dropIndexIfExists('performance_facts', 'pf_student_captured_at_idx');
        $this->dropIndexIfExists('quiz_results', 'qr_student_authoritative_finalized_idx');
        $this->dropIndexIfExists('quiz_attempts', 'qa_student_status_idx');
        $this->dropIndexIfExists('quiz_attempts', 'qa_student_started_at_idx');
    }

    private function addIndexIfMissing(string $table, string $index, callable $callback): void
    {
        if (! Schema::hasTable($table) || $this->indexExists($table, $index)) {
            return;
        }

        Schema::table($table, $callback);
    }

    private function dropIndexIfExists(string $table, string $index): void
    {
        if (! Schema::hasTable($table) || ! $this->indexExists($table, $index)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($index) {
            $blueprint->dropIndex($index);
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        try {
            $connection = Schema::getConnection();
            $database = $connection->getDatabaseName();
            $rows = $connection->select(
                'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
                [$database, $table, $index]
            );

            return $rows !== [];
        } catch (\Throwable $e) {
            return false;
        }
    }
}
