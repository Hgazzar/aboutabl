<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Platform Engine Migration — Batch 1 (P1, quiz-adjacent).
 *
 * Converts legacy MyISAM tables to InnoDB. Engine-only, data-preserving.
 *
 * Scope guarantees:
 * - Data preserved (ALTER TABLE ... ENGINE keeps rows).
 * - No table/column/index renames.
 * - No foreign keys added or dropped.
 * - Idempotent: tables already on InnoDB are skipped.
 */
class ConvertBatch1TablesToInnodb extends Migration
{
    /** @var array<int, string> */
    private $targets = ['quizes_questions', 'skills_quizes', 'notifications'];

    public function up(): void
    {
        $database = DB::connection()->getDatabaseName();

        foreach ($this->targets as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            if ($this->currentEngine($database, $table) === 'InnoDB') {
                continue;
            }

            DB::statement("ALTER TABLE `{$table}` ENGINE = InnoDB");
        }
    }

    /**
     * Intentionally non-destructive: reverting to MyISAM would undo the
     * intended platform alignment. No-op on rollback.
     */
    public function down(): void
    {
        // No-op by design.
    }

    private function currentEngine(string $database, string $table): ?string
    {
        $row = DB::selectOne(
            'SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
            [$database, $table]
        );

        return $row->ENGINE ?? null;
    }
}
