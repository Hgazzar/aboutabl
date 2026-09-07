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
            $table->unsignedInteger('possible_xp')->nullable()->after('due_at');
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
