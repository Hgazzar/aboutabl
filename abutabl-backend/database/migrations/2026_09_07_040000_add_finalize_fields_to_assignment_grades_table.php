<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3C — Finalize metadata on assignment_grades (badge, XP snapshot, feedback).
 */
class AddFinalizeFieldsToAssignmentGradesTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('assignment_grades')) {
            return;
        }

        Schema::table('assignment_grades', function (Blueprint $table) {
            if (! Schema::hasColumn('assignment_grades', 'possible_xp')) {
                $table->unsignedInteger('possible_xp')->nullable()->after('final_percent');
            }
            if (! Schema::hasColumn('assignment_grades', 'earned_xp')) {
                $table->unsignedInteger('earned_xp')->nullable()->after('possible_xp');
            }
            if (! Schema::hasColumn('assignment_grades', 'badge_key')) {
                $table->string('badge_key', 64)->nullable()->after('earned_xp');
            }
            if (! Schema::hasColumn('assignment_grades', 'teacher_feedback')) {
                $table->text('teacher_feedback')->nullable()->after('badge_key');
            }
            if (! Schema::hasColumn('assignment_grades', 'graded_by')) {
                $table->unsignedBigInteger('graded_by')->nullable()->after('teacher_feedback');
            }
            if (! Schema::hasColumn('assignment_grades', 'finalized_at')) {
                $table->timestamp('finalized_at')->nullable()->after('graded_by');
            }
        });

        if (Schema::hasColumn('assignment_grades', 'graded_by') && Schema::hasTable('users')) {
            Schema::table('assignment_grades', function (Blueprint $table) {
                // Soft FK without cascading user deletes into historical grades.
                $table->index('graded_by', 'assignment_grades_graded_by_idx');
            });
        }
    }

    public function down()
    {
        if (! Schema::hasTable('assignment_grades')) {
            return;
        }

        Schema::table('assignment_grades', function (Blueprint $table) {
            foreach (['finalized_at', 'graded_by', 'teacher_feedback', 'badge_key', 'earned_xp', 'possible_xp'] as $col) {
                if (Schema::hasColumn('assignment_grades', $col)) {
                    if ($col === 'graded_by') {
                        $table->dropIndex('assignment_grades_graded_by_idx');
                    }
                    $table->dropColumn($col);
                }
            }
        });
    }
}
