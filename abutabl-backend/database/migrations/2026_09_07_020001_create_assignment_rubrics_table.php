<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3A — Assignment Rubric SSOT (1:1 with assigns). No student scores.
 */
class CreateAssignmentRubricsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('assignment_rubrics')) {
            return;
        }

        Schema::create('assignment_rubrics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assign_id');
            $table->string('title', 255)->nullable();
            $table->timestamps();

            $table->unique('assign_id', 'assignment_rubrics_assign_unique');
            $table->foreign('assign_id')
                ->references('id')
                ->on('assigns')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('assignment_rubrics');
    }
}
