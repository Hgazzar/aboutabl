<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Foundation audit hardening for performance_facts:
 * - Preserve historical rows: restrict parent deletes (no silent cascade wipe)
 * - Improve time-series query indexes before data accumulates
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('performance_facts')) {
            return;
        }

        Schema::table('performance_facts', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropForeign(['class_id']);
            $table->dropForeign(['student_id']);
            $table->dropForeign(['subject_id']);

            $table->dropIndex('pf_class_date_idx');
            $table->dropIndex('pf_student_date_idx');
        });

        Schema::table('performance_facts', function (Blueprint $table) {
            $table->foreign('school_id', 'pf_school_fk')
                ->references('id')->on('schools')->onDelete('restrict');
            $table->foreign('class_id', 'pf_class_fk')
                ->references('id')->on('classes')->onDelete('restrict');
            $table->foreign('student_id', 'pf_student_fk')
                ->references('id')->on('students')->onDelete('restrict');
            $table->foreign('subject_id', 'pf_subject_fk')
                ->references('id')->on('subjects')->onDelete('restrict');

            // Left-prefix covers former (class_id, metric_date) / (student_id, metric_date)
            $table->index(['class_id', 'metric_date', 'student_id'], 'pf_class_date_student_idx');
            $table->index(['student_id', 'metric_date', 'class_id'], 'pf_student_date_class_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('performance_facts')) {
            return;
        }

        Schema::table('performance_facts', function (Blueprint $table) {
            $table->dropForeign('pf_school_fk');
            $table->dropForeign('pf_class_fk');
            $table->dropForeign('pf_student_fk');
            $table->dropForeign('pf_subject_fk');

            $table->dropIndex('pf_class_date_student_idx');
            $table->dropIndex('pf_student_date_class_idx');
        });

        Schema::table('performance_facts', function (Blueprint $table) {
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('set null');

            $table->index(['class_id', 'metric_date'], 'pf_class_date_idx');
            $table->index(['student_id', 'metric_date'], 'pf_student_date_idx');
        });
    }
};
