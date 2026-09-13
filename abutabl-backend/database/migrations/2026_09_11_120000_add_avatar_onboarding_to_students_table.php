<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * First-login avatar onboarding — store preset choice on students.
 * Existing rows are backfilled so only new students see the picker.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('students')) {
            return;
        }

        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'avatar_preset')) {
                $table->string('avatar_preset', 16)->nullable()->after('photo');
            }
            if (! Schema::hasColumn('students', 'avatar_selected_at')) {
                $table->timestamp('avatar_selected_at')->nullable()->after('avatar_preset');
            }
        });

        // Existing students already used the app — skip first-login onboarding.
        if (Schema::hasColumn('students', 'avatar_selected_at')) {
            DB::table('students')
                ->whereNull('avatar_selected_at')
                ->update(['avatar_selected_at' => now()]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('students')) {
            return;
        }

        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'avatar_selected_at')) {
                $table->dropColumn('avatar_selected_at');
            }
            if (Schema::hasColumn('students', 'avatar_preset')) {
                $table->dropColumn('avatar_preset');
            }
        });
    }
};
