<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Upgrade assigns.due_date (date) to due_at (datetime) with backfill.
     */
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

        if (Schema::hasColumn('assigns', 'due_date')) {
            DB::table('assigns')
                ->whereNotNull('due_date')
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

            DB::table('assigns')
                ->whereNull('due_at')
                ->orderBy('id')
                ->chunkById(100, function ($rows) {
                    foreach ($rows as $row) {
                        $fallback = $row->created_at
                            ? Carbon::parse($row->created_at)->endOfDay()->format('Y-m-d H:i:s')
                            : null;

                        if ($fallback !== null) {
                            DB::table('assigns')
                                ->where('id', $row->id)
                                ->update(['due_at' => $fallback]);
                        }
                    }
                });

            Schema::table('assigns', function (Blueprint $table) {
                $table->dropColumn('due_date');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('assigns')) {
            return;
        }

        if (! Schema::hasColumn('assigns', 'due_date')) {
            Schema::table('assigns', function (Blueprint $table) {
                $table->date('due_date')->nullable()->after('subject_id');
            });
        }

        if (Schema::hasColumn('assigns', 'due_at')) {
            DB::table('assigns')
                ->whereNotNull('due_at')
                ->orderBy('id')
                ->chunkById(100, function ($rows) {
                    foreach ($rows as $row) {
                        DB::table('assigns')
                            ->where('id', $row->id)
                            ->update([
                                'due_date' => Carbon::parse($row->due_at)->toDateString(),
                            ]);
                    }
                });

            Schema::table('assigns', function (Blueprint $table) {
                $table->dropColumn('due_at');
            });
        }
    }
};
