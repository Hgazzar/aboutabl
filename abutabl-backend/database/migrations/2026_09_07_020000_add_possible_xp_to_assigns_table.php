<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3A — Assignment possible_xp (nullable; no invented default).
 */
class AddPossibleXpToAssignsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('assigns')) {
            return;
        }

        if (Schema::hasColumn('assigns', 'possible_xp')) {
            return;
        }

        Schema::table('assigns', function (Blueprint $table) {
            // Prefer after due_at when present; fall back so this stays compatible
            // with production that still retains due_date.
            if (Schema::hasColumn('assigns', 'due_at')) {
                $table->unsignedInteger('possible_xp')->nullable()->after('due_at');
            } elseif (Schema::hasColumn('assigns', 'due_date')) {
                $table->unsignedInteger('possible_xp')->nullable()->after('due_date');
            } else {
                $table->unsignedInteger('possible_xp')->nullable();
            }
        });
    }

    public function down()
    {
        if (! Schema::hasTable('assigns') || ! Schema::hasColumn('assigns', 'possible_xp')) {
            return;
        }

        Schema::table('assigns', function (Blueprint $table) {
            $table->dropColumn('possible_xp');
        });
    }
}
