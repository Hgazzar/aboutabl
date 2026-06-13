<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Add26newColumToQuestionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->string('question_body_type')->after('type')->nullable();
            $table->string('answer_body_type')->after('corAnswer')->nullable();
            $table->longText('reason')->after('answer1_8')->nullable();
            $table->enum('reason_is_required',[1,0])->after('reason')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn(['question_body_type', 'answer_body_type', 'reason','reason_is_required']);
        });
    }
}
