<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Platform Engine Migration — Batch 3 (P2, empty/low-traffic tables).
 *
 * Converts legacy MyISAM tables to InnoDB. Engine-only, data-preserving.
 * Excludes test_table by design (non-domain junk table left untouched).
 *
 * Scope guarantees:
 * - Data preserved (ALTER TABLE ... ENGINE keeps rows).
 * - No table/column/index renames.
 * - No foreign keys added or dropped.
 * - Idempotent: tables already on InnoDB are skipped.
 */
class ConvertBatch3TablesToInnodb extends Migration
{
    /** @var array<int, string> */
    private $targets = [
        'conetents_schools',
        'units_schools',
        'tickets_replies',
    ];

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
