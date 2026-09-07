<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3B — Assignment Grade Draft SSOT (evaluation lifecycle ≠ parent lifecycle).
 */
class CreateAssignmentGradesTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('assignment_grades')) {
            return;
        }

        Schema::create('assignment_grades', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assign_id');
            $table->unsignedBigInteger('assign_student_id');
            $table->decimal('final_percent', 8, 2);
            $table->string('status', 32)->default('draft');
            $table->timestamps();

            $table->unique('assign_student_id', 'assignment_grades_assign_student_unique');
            $table->index(['assign_id', 'status'], 'assignment_grades_assign_status_idx');

            $table->foreign('assign_id')
                ->references('id')
                ->on('assigns')
                ->onDelete('cascade');

            $table->foreign('assign_student_id')
                ->references('id')
                ->on('assigns_students')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('assignment_grades');
    }
}
