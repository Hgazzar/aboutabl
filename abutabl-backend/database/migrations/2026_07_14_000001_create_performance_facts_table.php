<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Additive foundation for Performance Analytics Platform.
 * Stores daily performance facts — does not alter existing tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('performance_facts')) {
            return;
        }

        Schema::create('performance_facts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->date('metric_date');
            $table->dateTime('captured_at');
            $table->decimal('performance_percent', 5, 2)->default(0);
            $table->decimal('score_percent', 5, 2)->default(0);
            $table->decimal('completion_percent', 5, 2)->default(0);
            $table->decimal('progress_average', 5, 2)->nullable();
            $table->unsignedInteger('overdue_count')->default(0);
            $table->boolean('has_progress_data')->default(false);
            $table->string('source', 40);
            $table->string('source_type', 80)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->json('meta')->nullable();
            /** Application uniqueness key: student:class:subjectOr0:YYYY-MM-DD */
            $table->string('fact_key', 120);
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->onDelete('cascade');
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('set null');

            $table->unique('fact_key', 'performance_facts_fact_key_uq');
            $table->index(['class_id', 'metric_date'], 'pf_class_date_idx');
            $table->index(['student_id', 'metric_date'], 'pf_student_date_idx');
            $table->index(['school_id', 'metric_date'], 'pf_school_date_idx');
            $table->index(['source', 'captured_at'], 'pf_source_captured_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_facts');
    }
};
