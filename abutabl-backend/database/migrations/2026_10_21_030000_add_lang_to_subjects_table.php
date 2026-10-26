<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLangToSubjectsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('subjects') || Schema::hasColumn('subjects', 'lang')) {
            return;
        }

        Schema::table('subjects', function (Blueprint $table) {
            $table->enum('lang', ['en', 'ar'])->default('en')->after('name_ar');
        });
    }

    public function down()
    {
        if (! Schema::hasTable('subjects') || ! Schema::hasColumn('subjects', 'lang')) {
            return;
        }

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('lang');
        });
    }
}
