<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('class_alert_dismissals')) {
            return;
        }

        Schema::create('class_alert_dismissals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('class_id');
            $table->string('alert_key', 191);
            $table->timestamp('dismissed_at')->useCurrent();
            $table->timestamps();

            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->unique(['teacher_id', 'class_id', 'alert_key'], 'class_alert_dismissals_unique');
            $table->index(['teacher_id', 'class_id'], 'class_alert_dismissals_teacher_class_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_alert_dismissals');
    }
};
