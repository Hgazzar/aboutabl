<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3B — Per-criterion points for an Assignment Grade Draft.
 */
class CreateAssignmentGradeCriteriaTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('assignment_grade_criteria')) {
            return;
        }

        Schema::create('assignment_grade_criteria', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assignment_grade_id');
            $table->unsignedBigInteger('assignment_rubric_criterion_id');
            $table->unsignedTinyInteger('points');
            $table->timestamps();

            $table->unique(
                ['assignment_grade_id', 'assignment_rubric_criterion_id'],
                'assignment_grade_criteria_unique'
            );

            $table->foreign('assignment_grade_id', 'assignment_grade_criteria_grade_fk')
                ->references('id')
                ->on('assignment_grades')
                ->onDelete('cascade');

            $table->foreign('assignment_rubric_criterion_id', 'assignment_grade_criteria_criterion_fk')
                ->references('id')
                ->on('assignment_rubric_criteria')
                ->onDelete('restrict');
        });
    }

    public function down()
    {
        Schema::dropIfExists('assignment_grade_criteria');
    }
}
