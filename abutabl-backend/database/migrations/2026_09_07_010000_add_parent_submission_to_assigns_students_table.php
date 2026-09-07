<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2 — Parent Assignment submission SSOT on assigns_students.
 *
 * Distinct from assign_activity_submissions (per-activity).
 * One row per (assign_id, student_id) already exists; extend it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('assigns_students')) {
            return;
        }

        Schema::table('assigns_students', function (Blueprint $table) {
            if (! Schema::hasColumn('assigns_students', 'submission_status')) {
                $table->string('submission_status', 32)->default('active')->after('opened_at');
            }
            if (! Schema::hasColumn('assigns_students', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('submission_status');
            }
            if (! Schema::hasColumn('assigns_students', 'graded_at')) {
                $table->timestamp('graded_at')->nullable()->after('submitted_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('assigns_students')) {
            return;
        }

        Schema::table('assigns_students', function (Blueprint $table) {
            foreach (['graded_at', 'submitted_at', 'submission_status'] as $col) {
                if (Schema::hasColumn('assigns_students', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
