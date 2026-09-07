<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Learning Activities — Assignment → Activity SSOT (max 10 per assign).
 * Legacy assigns (single type/type_id) remain unchanged.
 */
class CreateAssignActivitiesTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('assign_activities')) {
            return;
        }

        Schema::create('assign_activities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assign_id');
            $table->string('activity_type', 32);
            $table->unsignedBigInteger('activity_id');
            $table->string('source_table', 64);
            $table->string('grading_mode', 64);
            $table->string('title_snapshot', 255)->nullable();
            $table->unsignedTinyInteger('sort_order')->default(1);
            $table->timestamps();

            $table->foreign('assign_id')
                ->references('id')
                ->on('assigns')
                ->onDelete('cascade');

            $table->unique(
                ['assign_id', 'activity_type', 'activity_id'],
                'assign_activities_unique_activity'
            );
            $table->index(['assign_id', 'sort_order'], 'assign_activities_order_idx');
            $table->index(
                ['activity_type', 'activity_id'],
                'assign_activities_source_idx'
            );
        });
    }

    public function down()
    {
        Schema::dropIfExists('assign_activities');
    }
}
