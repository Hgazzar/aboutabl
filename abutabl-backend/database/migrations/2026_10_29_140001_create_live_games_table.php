<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLiveGamesTable extends Migration
{
    /**
     * Catalog of hosted live competitions (replacement for standalone game1s).
     * Additive only: does not replace SCORM packages or the legacy Live Games tables.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('live_games', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('time', 16)->default('05:00');
            $table->string('logo')->nullable();
            $table->string('type', 32)->nullable();
            $table->unsignedTinyInteger('level')->nullable();
            $table->string('background')->nullable();
            $table->unsignedTinyInteger('status')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('type');
            $table->index('status');
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('live_games');
    }
}
