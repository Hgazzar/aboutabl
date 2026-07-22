<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * F-009G — Quiz Definition retry policy settings.
 * Additive only. Extends existing attempt-limit settings.
 */
class AddRetryPolicyToQuizesTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('quizes')) {
            return;
        }

        Schema::table('quizes', function (Blueprint $table) {
            if (! Schema::hasColumn('quizes', 'allow_retry_after_pass')) {
                $table->boolean('allow_retry_after_pass')->default(false)
                    ->after('show_explanations');
            }

            if (! Schema::hasColumn('quizes', 'allow_retry_after_fail')) {
                $table->boolean('allow_retry_after_fail')->default(true)
                    ->after('allow_retry_after_pass');
            }

            if (! Schema::hasColumn('quizes', 'retry_delay_minutes')) {
                $table->unsignedInteger('retry_delay_minutes')->nullable()
                    ->after('allow_retry_after_fail');
            }
        });
    }

    public function down()
    {
        if (! Schema::hasTable('quizes')) {
            return;
        }

        Schema::table('quizes', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('quizes', 'allow_retry_after_pass')) {
                $columns[] = 'allow_retry_after_pass';
            }
            if (Schema::hasColumn('quizes', 'allow_retry_after_fail')) {
                $columns[] = 'allow_retry_after_fail';
            }
            if (Schema::hasColumn('quizes', 'retry_delay_minutes')) {
                $columns[] = 'retry_delay_minutes';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
}
