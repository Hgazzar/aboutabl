<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Production-safe assigns deadline upgrade.
 *
 * ADD nullable due_at and backfill from existing due_date only.
 * NEVER drop or rename due_date (production data / SCORM-unrelated but
 * customer assignment deadlines must remain intact).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('assigns')) {
            return;
        }

        if (! Schema::hasColumn('assigns', 'due_at')) {
            Schema::table('assigns', function (Blueprint $table) {
                $table->dateTime('due_at')->nullable()->after('subject_id');
            });
        }

        if (! Schema::hasColumn('assigns', 'due_date') || ! Schema::hasColumn('assigns', 'due_at')) {
            return;
        }

        // Copy existing deadlines only — do not invent dates for null due_date rows.
        DB::table('assigns')
            ->whereNotNull('due_date')
            ->whereNull('due_at')
            ->orderBy('id')
            ->chunkById(100, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('assigns')
                        ->where('id', $row->id)
                        ->update([
                            'due_at' => Carbon::parse($row->due_date)->endOfDay()->format('Y-m-d H:i:s'),
                        ]);
                }
            });
    }

    public function down(): void
    {
        if (! Schema::hasTable('assigns')) {
            return;
        }

        // Keep due_date forever on production path. Rollback only removes due_at
        // when it was added by this migration family.
        if (Schema::hasColumn('assigns', 'due_at')) {
            Schema::table('assigns', function (Blueprint $table) {
                $table->dropColumn('due_at');
            });
        }
    }
};
