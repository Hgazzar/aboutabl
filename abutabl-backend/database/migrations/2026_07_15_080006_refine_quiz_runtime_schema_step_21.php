<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * F-009D Sprint 1 — Step 2.1 Final Database Refinement (additive).
 * Applies only when Step 2 create migrations already ran with older shapes.
 * Fresh installs get refined schema from 080002 / 080003 create files.
 */
class RefineQuizRuntimeSchemaStep21 extends Migration
{
    public function up()
    {
        if (Schema::hasTable('quiz_attempts')) {
            Schema::table('quiz_attempts', function (Blueprint $table) {
                if (! Schema::hasColumn('quiz_attempts', 'voided_at')) {
                    $table->timestamp('voided_at')->nullable()->after('active_slot_key');
                }
                if (! Schema::hasColumn('quiz_attempts', 'voided_by')) {
                    $table->unsignedBigInteger('voided_by')->nullable()->after('voided_at');
                }
                if (! Schema::hasColumn('quiz_attempts', 'void_reason')) {
                    $table->text('void_reason')->nullable()->after('voided_by');
                }
                if (! Schema::hasColumn('quiz_attempts', 'abandoned_at')) {
                    $table->timestamp('abandoned_at')->nullable()->after('void_reason');
                }
            });

            if (! $this->hasForeign('quiz_attempts', 'quiz_attempts_voided_by_foreign')) {
                Schema::table('quiz_attempts', function (Blueprint $table) {
                    $table->foreign('voided_by')
                        ->references('id')
                        ->on('users')
                        ->onDelete('set null');
                });
            }

            // Replace non-unique index with UNIQUE on start_idempotency_key
            if ($this->hasIndex('quiz_attempts', 'quiz_attempts_start_idempotency_idx')) {
                Schema::table('quiz_attempts', function (Blueprint $table) {
                    $table->dropIndex('quiz_attempts_start_idempotency_idx');
                });
            }

            if (! $this->hasIndex('quiz_attempts', 'quiz_attempts_start_idempotency_unique')) {
                Schema::table('quiz_attempts', function (Blueprint $table) {
                    $table->unique('start_idempotency_key', 'quiz_attempts_start_idempotency_unique');
                });
            }
        }

        if (Schema::hasTable('quiz_attempt_answers')) {
            if ($this->hasIndex('quiz_attempt_answers', 'quiz_attempt_answers_attempt_question_unique')) {
                Schema::table('quiz_attempt_answers', function (Blueprint $table) {
                    $table->dropUnique('quiz_attempt_answers_attempt_question_unique');
                });
            }

            // Ensure snapshot_question_key is present and NOT NULL for Runtime identity
            if (Schema::hasColumn('quiz_attempt_answers', 'snapshot_question_key')) {
                DB::table('quiz_attempt_answers')
                    ->whereNull('snapshot_question_key')
                    ->update([
                        'snapshot_question_key' => DB::raw("CONCAT('q', question_id)"),
                    ]);

                Schema::table('quiz_attempt_answers', function (Blueprint $table) {
                    $table->string('snapshot_question_key', 64)->nullable(false)->change();
                });
            } else {
                Schema::table('quiz_attempt_answers', function (Blueprint $table) {
                    $table->string('snapshot_question_key', 64)->after('question_id');
                });

                DB::table('quiz_attempt_answers')->update([
                    'snapshot_question_key' => DB::raw("CONCAT('q', question_id)"),
                ]);
            }

            if (! $this->hasIndex('quiz_attempt_answers', 'quiz_attempt_answers_attempt_snapshot_key_unique')) {
                Schema::table('quiz_attempt_answers', function (Blueprint $table) {
                    $table->unique(
                        ['attempt_id', 'snapshot_question_key'],
                        'quiz_attempt_answers_attempt_snapshot_key_unique'
                    );
                });
            }

            if (! $this->hasIndex('quiz_attempt_answers', 'quiz_attempt_answers_question_id_idx')) {
                Schema::table('quiz_attempt_answers', function (Blueprint $table) {
                    $table->index('question_id', 'quiz_attempt_answers_question_id_idx');
                });
            }
        }
    }

    public function down()
    {
        if (Schema::hasTable('quiz_attempt_answers')) {
            Schema::table('quiz_attempt_answers', function (Blueprint $table) {
                if ($this->hasIndex('quiz_attempt_answers', 'quiz_attempt_answers_attempt_snapshot_key_unique')) {
                    $table->dropUnique('quiz_attempt_answers_attempt_snapshot_key_unique');
                }
                if ($this->hasIndex('quiz_attempt_answers', 'quiz_attempt_answers_question_id_idx')) {
                    $table->dropIndex('quiz_attempt_answers_question_id_idx');
                }
                if (! $this->hasIndex('quiz_attempt_answers', 'quiz_attempt_answers_attempt_question_unique')) {
                    $table->unique(
                        ['attempt_id', 'question_id'],
                        'quiz_attempt_answers_attempt_question_unique'
                    );
                }
            });
        }

        if (Schema::hasTable('quiz_attempts')) {
            Schema::table('quiz_attempts', function (Blueprint $table) {
                if ($this->hasIndex('quiz_attempts', 'quiz_attempts_start_idempotency_unique')) {
                    $table->dropUnique('quiz_attempts_start_idempotency_unique');
                }
                if (! $this->hasIndex('quiz_attempts', 'quiz_attempts_start_idempotency_idx')) {
                    $table->index('start_idempotency_key', 'quiz_attempts_start_idempotency_idx');
                }
                if ($this->hasForeign('quiz_attempts', 'quiz_attempts_voided_by_foreign')) {
                    $table->dropForeign('quiz_attempts_voided_by_foreign');
                }
            });

            Schema::table('quiz_attempts', function (Blueprint $table) {
                $cols = [];
                foreach (['voided_at', 'voided_by', 'void_reason', 'abandoned_at'] as $col) {
                    if (Schema::hasColumn('quiz_attempts', $col)) {
                        $cols[] = $col;
                    }
                }
                if ($cols !== []) {
                    $table->dropColumn($cols);
                }
            });
        }
    }

    private function hasIndex(string $table, string $name): bool
    {
        $database = Schema::getConnection()->getDatabaseName();
        $row = DB::selectOne(
            'SELECT 1 AS ok FROM information_schema.statistics
             WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
            [$database, $table, $name]
        );

        return $row !== null;
    }

    private function hasForeign(string $table, string $name): bool
    {
        $database = Schema::getConnection()->getDatabaseName();
        $row = DB::selectOne(
            'SELECT 1 AS ok FROM information_schema.table_constraints
             WHERE table_schema = ? AND table_name = ? AND constraint_name = ?
               AND constraint_type = ? LIMIT 1',
            [$database, $table, $name, 'FOREIGN KEY']
        );

        return $row !== null;
    }
}
