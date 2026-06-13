<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('assigns_students')) {
            return;
        }
        Schema::table('assigns_students', function (Blueprint $table) {
            if (! Schema::hasColumn('assigns_students', 'opened_at')) {
                $table->timestamp('opened_at')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('assigns_students')) {
            return;
        }
        Schema::table('assigns_students', function (Blueprint $table) {
            if (Schema::hasColumn('assigns_students', 'opened_at')) {
                $table->dropColumn('opened_at');
            }
        });
    }
};
