<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * F-021 — Harden student_subject_progress as canonical Progress storage.
 *
 * Audit → quarantine dirty rows (backup table) → NOT NULL + UNIQUE + FKs.
 * Idempotent: discovers real FK/index names via INFORMATION_SCHEMA.
 * Does not calculate Progress. Does not delete without backup.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('student_subject_progress')) {
            return;
        }

        $audit = $this->audit();

        Log::info('F-021 student_subject_progress audit', $audit);
        echo PHP_EOL.'[F-021] student_subject_progress audit: '.json_encode($audit).PHP_EOL;

        $this->ensureBackupTable();
        $this->quarantineNullKeys();
        $this->quarantineOrphans();
        $this->quarantineDuplicates();
        $this->quarantineInvalidValues();

        $post = $this->audit();
        Log::info('F-021 student_subject_progress post-quarantine', $post);
        echo '[F-021] post-quarantine: '.json_encode($post).PHP_EOL;

        if ($post['null_student_id'] > 0 || $post['null_subject_id'] > 0 || $post['duplicate_pair_groups'] > 0) {
            throw new RuntimeException(
                'F-021 cannot harden student_subject_progress: dirty rows remain after quarantine. '.
                json_encode($post)
            );
        }

        // Drop FOREIGN KEY constraints first — MySQL blocks dropping indexes they depend on.
        $this->dropForeignKeysOnColumn('student_subject_progress', 'student_id');
        $this->dropForeignKeysOnColumn('student_subject_progress', 'subject_id');

        // Drop non-unique composite index if present (unique supersedes it).
        $this->dropIndexIfExists('student_subject_progress', 'ssp_student_subject_idx');

        // Drop leftover non-unique single-column indexes (e.g. MyISAM-era *_foreign names
        // that are indexes only, not TABLE_CONSTRAINTS FOREIGN KEY rows).
        $this->dropNonUniqueIndexesOnColumn('student_subject_progress', 'student_id');
        $this->dropNonUniqueIndexesOnColumn('student_subject_progress', 'subject_id');

        // Make columns NOT NULL only when still nullable.
        $needsStudentNotNull = $this->isColumnNullable('student_subject_progress', 'student_id');
        $needsSubjectNotNull = $this->isColumnNullable('student_subject_progress', 'subject_id');

        if ($needsStudentNotNull || $needsSubjectNotNull) {
            Schema::table('student_subject_progress', function (Blueprint $table) use ($needsStudentNotNull, $needsSubjectNotNull) {
                if ($needsStudentNotNull) {
                    $table->unsignedBigInteger('student_id')->nullable(false)->change();
                }
                if ($needsSubjectNotNull) {
                    $table->unsignedBigInteger('subject_id')->nullable(false)->change();
                }
            });
        }

        // Recreate FKs only when missing on those columns.
        if (! $this->hasForeignKeyOnColumn('student_subject_progress', 'student_id')) {
            Schema::table('student_subject_progress', function (Blueprint $table) {
                $table->foreign('student_id')->references('id')->on('students');
            });
        }

        if (! $this->hasForeignKeyOnColumn('student_subject_progress', 'subject_id')) {
            Schema::table('student_subject_progress', function (Blueprint $table) {
                $table->foreign('subject_id')->references('id')->on('subjects');
            });
        }

        if (! $this->hasUniqueOnColumns('student_subject_progress', ['student_id', 'subject_id'])) {
            Schema::table('student_subject_progress', function (Blueprint $table) {
                $table->unique(['student_id', 'subject_id'], 'ssp_student_subject_unique');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('student_subject_progress')) {
            return;
        }

        if ($this->hasIndex('student_subject_progress', 'ssp_student_subject_unique')) {
            $this->dropIndexIfExists('student_subject_progress', 'ssp_student_subject_unique');
        } else {
            // Unique may exist under a different auto name.
            foreach ($this->uniqueIndexNamesOnColumns('student_subject_progress', ['student_id', 'subject_id']) as $name) {
                $this->dropIndexIfExists('student_subject_progress', $name);
            }
        }

        $this->dropForeignKeysOnColumn('student_subject_progress', 'student_id');
        $this->dropForeignKeysOnColumn('student_subject_progress', 'subject_id');

        if (! $this->isColumnNullable('student_subject_progress', 'student_id')
            || ! $this->isColumnNullable('student_subject_progress', 'subject_id')) {
            Schema::table('student_subject_progress', function (Blueprint $table) {
                $table->unsignedBigInteger('student_id')->nullable()->change();
                $table->unsignedBigInteger('subject_id')->nullable()->change();
            });
        }

        if (! $this->hasForeignKeyOnColumn('student_subject_progress', 'student_id')) {
            Schema::table('student_subject_progress', function (Blueprint $table) {
                $table->foreign('student_id')->references('id')->on('students');
            });
        }

        if (! $this->hasForeignKeyOnColumn('student_subject_progress', 'subject_id')) {
            Schema::table('student_subject_progress', function (Blueprint $table) {
                $table->foreign('subject_id')->references('id')->on('subjects');
            });
        }

        if (! $this->hasIndex('student_subject_progress', 'ssp_student_subject_idx')
            && ! $this->hasUniqueOnColumns('student_subject_progress', ['student_id', 'subject_id'])) {
            Schema::table('student_subject_progress', function (Blueprint $table) {
                $table->index(['student_id', 'subject_id'], 'ssp_student_subject_idx');
            });
        }

        // Backup table intentionally retained (historical quarantine).
    }

    /**
     * @return array<string, int|float|null>
     */
    private function audit(): array
    {
        $total = (int) DB::table('student_subject_progress')->count();
        $nullStudent = (int) DB::table('student_subject_progress')->whereNull('student_id')->count();
        $nullSubject = (int) DB::table('student_subject_progress')->whereNull('subject_id')->count();
        $invalid = (int) DB::table('student_subject_progress')
            ->where(function ($q) {
                $q->where('value', '<', 0)->orWhere('value', '>', 100);
            })
            ->count();

        $orphanStudents = 0;
        $orphanSubjects = 0;
        if (Schema::hasTable('students')) {
            $orphanStudents = (int) DB::table('student_subject_progress as p')
                ->leftJoin('students as s', 's.id', '=', 'p.student_id')
                ->whereNotNull('p.student_id')
                ->whereNull('s.id')
                ->count();
        }
        if (Schema::hasTable('subjects')) {
            $orphanSubjects = (int) DB::table('student_subject_progress as p')
                ->leftJoin('subjects as sub', 'sub.id', '=', 'p.subject_id')
                ->whereNotNull('p.subject_id')
                ->whereNull('sub.id')
                ->count();
        }

        $dupPairs = DB::table('student_subject_progress')
            ->select('student_id', 'subject_id', DB::raw('COUNT(*) as c'))
            ->whereNotNull('student_id')
            ->whereNotNull('subject_id')
            ->groupBy('student_id', 'subject_id')
            ->having('c', '>', 1)
            ->get();

        return [
            'total' => $total,
            'null_student_id' => $nullStudent,
            'null_subject_id' => $nullSubject,
            'invalid_value_lt0_or_gt100' => $invalid,
            'orphan_student_fk' => $orphanStudents,
            'orphan_subject_fk' => $orphanSubjects,
            'duplicate_pair_groups' => $dupPairs->count(),
            'duplicate_rows_in_groups' => (int) $dupPairs->sum('c'),
            'value_min' => DB::table('student_subject_progress')->min('value'),
            'value_max' => DB::table('student_subject_progress')->max('value'),
            'backup_rows' => Schema::hasTable('student_subject_progress_f021_backup')
                ? (int) DB::table('student_subject_progress_f021_backup')->count()
                : 0,
        ];
    }

    private function ensureBackupTable(): void
    {
        if (Schema::hasTable('student_subject_progress_f021_backup')) {
            return;
        }

        Schema::create('student_subject_progress_f021_backup', function (Blueprint $table) {
            $table->unsignedBigInteger('original_id')->nullable();
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->float('value', 8, 2)->nullable();
            $table->timestamp('original_created_at')->nullable();
            $table->timestamp('original_updated_at')->nullable();
            $table->string('quarantine_reason', 64);
            $table->timestamp('quarantined_at')->useCurrent();
        });
    }

    private function quarantineNullKeys(): void
    {
        $rows = DB::table('student_subject_progress')
            ->where(function ($q) {
                $q->whereNull('student_id')->orWhereNull('subject_id');
            })
            ->get();

        foreach ($rows as $row) {
            $this->moveToBackup($row, 'null_student_or_subject_id');
        }
    }

    private function quarantineOrphans(): void
    {
        if (Schema::hasTable('students')) {
            $ids = DB::table('student_subject_progress as p')
                ->leftJoin('students as s', 's.id', '=', 'p.student_id')
                ->whereNotNull('p.student_id')
                ->whereNull('s.id')
                ->pluck('p.id');

            foreach ($ids as $id) {
                $row = DB::table('student_subject_progress')->where('id', $id)->first();
                if ($row) {
                    $this->moveToBackup($row, 'orphan_student_id');
                }
            }
        }

        if (Schema::hasTable('subjects')) {
            $ids = DB::table('student_subject_progress as p')
                ->leftJoin('subjects as sub', 'sub.id', '=', 'p.subject_id')
                ->whereNotNull('p.subject_id')
                ->whereNull('sub.id')
                ->pluck('p.id');

            foreach ($ids as $id) {
                $row = DB::table('student_subject_progress')->where('id', $id)->first();
                if ($row) {
                    $this->moveToBackup($row, 'orphan_subject_id');
                }
            }
        }
    }

    private function quarantineDuplicates(): void
    {
        $pairs = DB::table('student_subject_progress')
            ->select('student_id', 'subject_id', DB::raw('COUNT(*) as c'))
            ->whereNotNull('student_id')
            ->whereNotNull('subject_id')
            ->groupBy('student_id', 'subject_id')
            ->having('c', '>', 1)
            ->get();

        foreach ($pairs as $pair) {
            $keepers = DB::table('student_subject_progress')
                ->where('student_id', $pair->student_id)
                ->where('subject_id', $pair->subject_id)
                ->orderByDesc('updated_at')
                ->orderByDesc('id')
                ->get();

            $keep = $keepers->first();
            foreach ($keepers->slice(1) as $dup) {
                $this->moveToBackup($dup, 'duplicate_student_subject');
            }

            if ($keep) {
                Log::info('F-021 kept duplicate winner', [
                    'id' => $keep->id,
                    'student_id' => $keep->student_id,
                    'subject_id' => $keep->subject_id,
                    'value' => $keep->value,
                ]);
            }
        }
    }

    /**
     * Invalid values are reported and clamped in-place (not deleted) so Progress
     * Writer later receives a bounded float without inventing curriculum coverage.
     */
    private function quarantineInvalidValues(): void
    {
        $invalid = DB::table('student_subject_progress')
            ->where(function ($q) {
                $q->where('value', '<', 0)->orWhere('value', '>', 100);
            })
            ->get();

        foreach ($invalid as $row) {
            DB::table('student_subject_progress_f021_backup')->insert([
                'original_id' => $row->id,
                'student_id' => $row->student_id,
                'subject_id' => $row->subject_id,
                'value' => $row->value,
                'original_created_at' => $row->created_at ?? null,
                'original_updated_at' => $row->updated_at ?? null,
                'quarantine_reason' => 'invalid_value_clamped',
                'quarantined_at' => now(),
            ]);

            $clamped = max(0.0, min(100.0, (float) $row->value));
            DB::table('student_subject_progress')
                ->where('id', $row->id)
                ->update(['value' => $clamped]);
        }
    }

    private function moveToBackup(object $row, string $reason): void
    {
        DB::table('student_subject_progress_f021_backup')->insert([
            'original_id' => $row->id ?? null,
            'student_id' => $row->student_id ?? null,
            'subject_id' => $row->subject_id ?? null,
            'value' => $row->value ?? null,
            'original_created_at' => $row->created_at ?? null,
            'original_updated_at' => $row->updated_at ?? null,
            'quarantine_reason' => $reason,
            'quarantined_at' => now(),
        ]);

        if (isset($row->id)) {
            DB::table('student_subject_progress')->where('id', $row->id)->delete();
        }
    }

    private function databaseName(): string
    {
        return (string) DB::getDatabaseName();
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->pluck('Key_name')
            ->unique()
            ->all();

        return in_array($indexName, $indexes, true);
    }

    private function dropIndexIfExists(string $table, string $indexName): void
    {
        if (! $this->hasIndex($table, $indexName) || $indexName === 'PRIMARY') {
            return;
        }

        if ($this->foreignKeyNamesOnIndex($table, $indexName) !== []) {
            return;
        }

        try {
            Schema::table($table, function (Blueprint $blueprint) use ($indexName) {
                $blueprint->dropIndex($indexName);
            });
        } catch (\Throwable $e) {
            if (! str_contains($e->getMessage(), '1553') && ! str_contains($e->getMessage(), 'foreign key')) {
                throw $e;
            }
        }
    }

    /**
     * @return string[]
     */
    private function foreignKeyNamesOnIndex(string $table, string $indexName): array
    {
        $rows = DB::select(
            'SELECT DISTINCT tc.CONSTRAINT_NAME AS constraint_name
             FROM information_schema.TABLE_CONSTRAINTS tc
             INNER JOIN information_schema.KEY_COLUMN_USAGE kcu
                ON kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
               AND kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
               AND kcu.TABLE_NAME = tc.TABLE_NAME
             INNER JOIN information_schema.STATISTICS s
                ON s.TABLE_SCHEMA = kcu.TABLE_SCHEMA
               AND s.TABLE_NAME = kcu.TABLE_NAME
               AND s.INDEX_NAME = ?
             WHERE tc.CONSTRAINT_SCHEMA = ?
               AND tc.TABLE_NAME = ?
               AND tc.CONSTRAINT_TYPE = \'FOREIGN KEY\'
               AND kcu.COLUMN_NAME = s.COLUMN_NAME',
            [$indexName, $this->databaseName(), $table]
        );

        return array_values(array_unique(array_map(
            static fn ($row) => (string) $row->constraint_name,
            $rows
        )));
    }

    /**
     * @return string[]
     */
    private function foreignKeyNamesOnColumn(string $table, string $column): array
    {
        $rows = DB::select(
            'SELECT DISTINCT kcu.CONSTRAINT_NAME AS constraint_name
             FROM information_schema.KEY_COLUMN_USAGE kcu
             INNER JOIN information_schema.TABLE_CONSTRAINTS tc
                ON tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
               AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
               AND tc.TABLE_NAME = kcu.TABLE_NAME
             WHERE kcu.TABLE_SCHEMA = ?
               AND kcu.TABLE_NAME = ?
               AND kcu.COLUMN_NAME = ?
               AND tc.CONSTRAINT_TYPE = \'FOREIGN KEY\'
               AND kcu.REFERENCED_TABLE_NAME IS NOT NULL',
            [$this->databaseName(), $table, $column]
        );

        return array_values(array_unique(array_map(
            static fn ($row) => (string) $row->constraint_name,
            $rows
        )));
    }

    private function hasForeignKeyOnColumn(string $table, string $column): bool
    {
        return $this->foreignKeyNamesOnColumn($table, $column) !== [];
    }

    private function dropForeignKeysOnColumn(string $table, string $column): void
    {
        foreach ($this->foreignKeyNamesOnColumn($table, $column) as $name) {
            Schema::table($table, function (Blueprint $blueprint) use ($name) {
                $blueprint->dropForeign($name);
            });
        }
    }

    /**
     * Drop non-unique indexes that include only this column (legacy FK-named indexes).
     * Never drops PRIMARY or UNIQUE indexes.
     */
    private function dropNonUniqueIndexesOnColumn(string $table, string $column): void
    {
        $indexes = collect(DB::select("SHOW INDEX FROM `{$table}`"));

        $byName = $indexes->groupBy('Key_name');
        foreach ($byName as $name => $parts) {
            if ($name === 'PRIMARY') {
                continue;
            }

            $nonUnique = (int) $parts->first()->Non_unique === 1;
            if (! $nonUnique) {
                continue;
            }

            $columns = $parts->sortBy('Seq_in_index')->pluck('Column_name')->values()->all();
            if ($columns === [$column]) {
                $this->dropIndexIfExists($table, (string) $name);
            }
        }
    }

    private function isColumnNullable(string $table, string $column): bool
    {
        $row = DB::selectOne(
            'SELECT IS_NULLABLE AS is_nullable
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?',
            [$this->databaseName(), $table, $column]
        );

        return $row !== null && strtoupper((string) $row->is_nullable) === 'YES';
    }

    /**
     * @param  string[]  $columns
     */
    private function hasUniqueOnColumns(string $table, array $columns): bool
    {
        return $this->uniqueIndexNamesOnColumns($table, $columns) !== [];
    }

    /**
     * @param  string[]  $columns
     * @return string[]
     */
    private function uniqueIndexNamesOnColumns(string $table, array $columns): array
    {
        $indexes = collect(DB::select("SHOW INDEX FROM `{$table}`"));
        $byName = $indexes->groupBy('Key_name');
        $wanted = array_values($columns);
        $found = [];

        foreach ($byName as $name => $parts) {
            if ((int) $parts->first()->Non_unique !== 0) {
                continue;
            }
            if ($name === 'PRIMARY') {
                continue;
            }

            $indexCols = $parts->sortBy('Seq_in_index')->pluck('Column_name')->values()->all();
            if ($indexCols === $wanted) {
                $found[] = (string) $name;
            }
        }

        return $found;
    }
};
