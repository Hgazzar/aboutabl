<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentXpTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('student_xp_events')) {
            Schema::create('student_xp_events', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('student_id');
                $table->string('source_type', 64);
                $table->unsignedBigInteger('source_id');
                $table->unsignedInteger('amount');
                $table->timestamp('earned_at');
                $table->timestamps();

                $table->foreign('student_id')
                    ->references('id')
                    ->on('students')
                    ->onDelete('cascade');

                $table->unique(
                    ['student_id', 'source_type', 'source_id'],
                    'student_xp_events_unique_source'
                );
                $table->index(['student_id', 'earned_at'], 'student_xp_events_student_earned_idx');
            });
        }

        if (! Schema::hasTable('student_xp_balances')) {
            Schema::create('student_xp_balances', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('student_id')->unique();
                $table->unsignedInteger('total_xp')->default(0);
                $table->unsignedSmallInteger('level')->default(1);
                $table->timestamps();

                $table->foreign('student_id')
                    ->references('id')
                    ->on('students')
                    ->onDelete('cascade');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('student_xp_balances');
        Schema::dropIfExists('student_xp_events');
    }
}
