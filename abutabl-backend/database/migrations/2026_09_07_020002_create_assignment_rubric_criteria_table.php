<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3A — Rubric criteria (weights + max_points config). No student selections.
 */
class CreateAssignmentRubricCriteriaTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('assignment_rubric_criteria')) {
            return;
        }

        Schema::create('assignment_rubric_criteria', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assignment_rubric_id');
            $table->string('label', 255);
            $table->decimal('weight', 8, 4);
            $table->unsignedTinyInteger('max_points')->default(4);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('assignment_rubric_id', 'assignment_rubric_criteria_rubric_fk')
                ->references('id')
                ->on('assignment_rubrics')
                ->onDelete('cascade');

            $table->index(
                ['assignment_rubric_id', 'sort_order'],
                'assignment_rubric_criteria_order_idx'
            );
        });
    }

    public function down()
    {
        Schema::dropIfExists('assignment_rubric_criteria');
    }
}
