<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * F-009D Sprint 2 — Storage engine alignment (additive, data-preserving).
 *
 * Converts legacy MyISAM Definition/assignment parents to InnoDB so the
 * Runtime foreign keys (quiz_versions/snapshots/attempts/results) can be
 * created. Runs before 2026_07_15_080000_* by filename ordering.
 *
 * Scope guarantees:
 * - Data preserved (ALTER TABLE ... ENGINE keeps rows).
 * - No table/column/index renames.
 * - No foreign keys added or dropped here.
 * - Removes ONLY an orphan quiz_versions table left by a previously failed
 *   run (empty + not recorded in migrations), so the create migration reruns.
 */
class ConvertQuizDefinitionTablesToInnodb extends Migration
{
    /** @var array<int, string> */
    private $targets = ['quizes', 'assigns', 'assigns_students'];

    public function up(): void
    {
        $database = DB::connection()->getDatabaseName();

        // 1) Remove orphan quiz_versions from a prior failed migration.
        //    Only when it exists, is empty, and has no migrations record.
        $this->dropOrphanQuizVersions($database);

        // 2) Convert legacy MyISAM parents to InnoDB (idempotent).
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
     * Intentionally irreversible: reverting to MyISAM would reintroduce the
     * foreign-key failure this migration fixes. No-op on rollback.
     */
    public function down(): void
    {
        // No-op by design.
    }

    private function dropOrphanQuizVersions(string $database): void
    {
        if (! Schema::hasTable('quiz_versions')) {
            return;
        }

        $recorded = DB::table('migrations')
            ->where('migration', 'like', '%create_quiz_versions%')
            ->exists();

        if ($recorded) {
            return;
        }

        $rowCount = DB::table('quiz_versions')->count();
        if ($rowCount > 0) {
            return;
        }

        Schema::drop('quiz_versions');
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
