<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1 — Assignment Student Works SSOT (optional image/document/voice per assign_student).
 * Additive only. Independent of parent submit / activity submissions.
 */
class CreateAssignmentStudentWorksTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('assignment_student_works')) {
            return;
        }

        Schema::create('assignment_student_works', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assign_id');
            $table->unsignedBigInteger('assign_student_id');
            $table->unsignedBigInteger('student_id');
            $table->string('kind', 32);
            $table->string('original_filename', 255)->nullable();
            $table->string('storage_path', 512);
            $table->string('mime_type', 127)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('assign_id')
                ->references('id')
                ->on('assigns')
                ->onDelete('cascade');

            $table->foreign('assign_student_id')
                ->references('id')
                ->on('assigns_students')
                ->onDelete('cascade');

            $table->foreign('student_id')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');

            $table->index(
                ['assign_student_id', 'sort_order'],
                'assignment_student_works_assign_student_idx'
            );
            $table->index(
                ['assign_id', 'student_id'],
                'assignment_student_works_assign_student_id_idx'
            );
            $table->index(
                ['assign_id', 'kind'],
                'assignment_student_works_assign_kind_idx'
            );
        });
    }

    public function down()
    {
        Schema::dropIfExists('assignment_student_works');
    }
}
