<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1B — nullable curriculum FKs on worksheets/games (mirror quizes).
 * Existing rows stay valid (null). No data backfill.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('work_sheets')) {
            Schema::table('work_sheets', function (Blueprint $table) {
                if (! Schema::hasColumn('work_sheets', 'unit_id')) {
                    $table->unsignedBigInteger('unit_id')->nullable()->after('subject_id');
                    if (Schema::hasTable('units')) {
                        $table->foreign('unit_id')->references('id')->on('units')->onDelete('set null');
                    }
                }
                if (! Schema::hasColumn('work_sheets', 'lesson_id')) {
                    $table->unsignedBigInteger('lesson_id')->nullable()->after('unit_id');
                    if (Schema::hasTable('lessons')) {
                        $table->foreign('lesson_id')->references('id')->on('lessons')->onDelete('set null');
                    }
                }
                if (! Schema::hasColumn('work_sheets', 'activity_lesson_id') && Schema::hasTable('activity_lessons')) {
                    $table->unsignedBigInteger('activity_lesson_id')->nullable()->after('lesson_id');
                    $table->foreign('activity_lesson_id')->references('id')->on('activity_lessons')->onDelete('set null');
                }
            });
        }

        if (Schema::hasTable('games')) {
            Schema::table('games', function (Blueprint $table) {
                if (! Schema::hasColumn('games', 'unit_id')) {
                    $table->unsignedBigInteger('unit_id')->nullable()->after('subject_id');
                    if (Schema::hasTable('units')) {
                        $table->foreign('unit_id')->references('id')->on('units')->onDelete('set null');
                    }
                }
                if (! Schema::hasColumn('games', 'lesson_id')) {
                    $table->unsignedBigInteger('lesson_id')->nullable()->after('unit_id');
                    if (Schema::hasTable('lessons')) {
                        $table->foreign('lesson_id')->references('id')->on('lessons')->onDelete('set null');
                    }
                }
                if (! Schema::hasColumn('games', 'activity_lesson_id') && Schema::hasTable('activity_lessons')) {
                    $table->unsignedBigInteger('activity_lesson_id')->nullable()->after('lesson_id');
                    $table->foreign('activity_lesson_id')->references('id')->on('activity_lessons')->onDelete('set null');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('work_sheets')) {
            Schema::table('work_sheets', function (Blueprint $table) {
                foreach (['activity_lesson_id', 'lesson_id', 'unit_id'] as $col) {
                    if (Schema::hasColumn('work_sheets', $col)) {
                        try {
                            $table->dropForeign([$col]);
                        } catch (\Throwable $e) {
                            // ignore missing FK name variants
                        }
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('games')) {
            Schema::table('games', function (Blueprint $table) {
                foreach (['activity_lesson_id', 'lesson_id', 'unit_id'] as $col) {
                    if (Schema::hasColumn('games', $col)) {
                        try {
                            $table->dropForeign([$col]);
                        } catch (\Throwable $e) {
                            // ignore
                        }
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
