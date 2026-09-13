<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1 — Assignment Materials SSOT (teacher optional file/voice/link on assign).
 * Additive only. Does not alter existing assignment tables.
 */
class CreateAssignmentMaterialsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('assignment_materials')) {
            return;
        }

        Schema::create('assignment_materials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assign_id');
            $table->string('kind', 32);
            $table->string('label', 255)->nullable();
            $table->string('original_filename', 255)->nullable();
            $table->string('storage_path', 512)->nullable();
            $table->string('external_url', 2048)->nullable();
            $table->string('mime_type', 127)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('assign_id')
                ->references('id')
                ->on('assigns')
                ->onDelete('cascade');

            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->index(
                ['assign_id', 'sort_order'],
                'assignment_materials_assign_order_idx'
            );
            $table->index(
                ['assign_id', 'kind'],
                'assignment_materials_assign_kind_idx'
            );
        });
    }

    public function down()
    {
        Schema::dropIfExists('assignment_materials');
    }
}
