<?php

namespace Tests\Feature\QuizRuntime;

use App\Models\User;
use App\Services\QuizRuntime\QuizAutoGradingService;
use App\Services\QuizRuntime\QuizManualGradingService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class QuizManualGradingCycleTest extends TestCase
{
    /** @var User */
    private $teacher;

    /** @var int */
    private $sequence = 0;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
            $this->markTestSkipped('Manual grading cycle tests run only on sqlite :memory:.');
        }

        Schema::dropAllTables();
        $this->buildSchema();
        DB::table('schools')->insert([
            'id' => 1,
            'name' => 'Local School',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->teacher = User::create([
            'name' => 'Grading Admin',
            'email' => 'grading-admin@test.com',
            'password' => 'secret',
            'type' => 'admin',
        ]);
    }

    public function test_shn_stays_unpassed_until_manual_score_meets_zero_pass_score(): void
    {
        $done = $this->finishManualCycle('SHN', 0, 0);

        $this->assertPendingBeforeManual($done['before']);
        $this->assertFinal($done['after'], true, 0.0);
    }

    public function test_shn_manual_zero_does_not_pass_when_score_to_pass_is_one(): void
    {
        $done = $this->finishManualCycle('SHN', 1, 0);

        $this->assertPendingBeforeManual($done['before']);
        $this->assertFinal($done['after'], false, 0.0);
    }

    public function test_shn_manual_full_score_passes_when_score_to_pass_is_one(): void
    {
        $done = $this->finishManualCycle('SHN', 1, 1);

        $this->assertPendingBeforeManual($done['before']);
        $this->assertFinal($done['after'], true, 1.0);
    }

    public function test_mixed_mcq_and_shn_stays_unfinalized_until_manual_grading(): void
    {
        foreach ([0.0, 3.0] as $scoreToPass) {
            $done = $this->finishMixedCycle($scoreToPass, 1.0);
            $before = $done['before'];

            $this->assertSame('pending_manual', $before['attempt']->status);
            $this->assertTrue((bool) $before['result']->pending_manual);
            $this->assertFalse((bool) $before['result']->is_authoritative);
            $this->assertFalse((bool) $before['result']->passed);
            $this->assertSame(1.0, (float) $before['result']->auto_score_total);
            $this->assertSame(2.0, (float) $before['result']->max_score);

            $after = $done['after'];
            $attempt = $after['attempt']->fresh();
            $result = $after['result']->fresh();
            $this->assertSame('finalized', $attempt->status);
            $this->assertFalse((bool) $result->pending_manual);
            $this->assertTrue((bool) $result->is_authoritative);
            $this->assertSame(2.0, (float) $result->raw_score);
            $this->assertSame($scoreToPass === 0.0, (bool) $result->passed);
        }
    }

    public function test_essay_and_upload_complete_the_same_manual_cycle(): void
    {
        foreach (['Essay', 'Upload'] as $type) {
            $zero = $this->finishManualCycle($type, 0, 0);
            $this->assertPendingBeforeManual($zero['before']);
            $this->assertFinal($zero['after'], true, 0.0);

            $full = $this->finishManualCycle($type, 1, 1);
            $this->assertPendingBeforeManual($full['before']);
            $this->assertFinal($full['after'], true, 1.0);
        }
    }

    /**
     * @param  array{attempt: \App\Models\QuizRuntime\QuizAttempt, result: \App\Models\QuizRuntime\QuizResult}  $before
     */
    private function assertPendingBeforeManual(array $before): void
    {
        $this->assertSame('pending_manual', $before['attempt']->status);
        $this->assertTrue((bool) $before['result']->pending_manual);
        $this->assertFalse((bool) $before['result']->passed);
        $this->assertFalse((bool) $before['result']->is_authoritative);
    }

    /**
     * @param  array{attempt: \App\Models\QuizRuntime\QuizAttempt, result: \App\Models\QuizRuntime\QuizResult}  $after
     */
    private function assertFinal(array $after, bool $passed, float $rawScore): void
    {
        $attempt = $after['attempt']->fresh();
        $result = $after['result']->fresh();

        $this->assertSame('finalized', $attempt->status);
        $this->assertFalse((bool) $result->pending_manual);
        $this->assertTrue((bool) $result->is_authoritative);
        $this->assertSame($passed, (bool) $result->passed);
        $this->assertSame($rawScore, (float) $result->raw_score);
        $this->assertSame($rawScore, (float) $result->manual_score_total);
        $this->assertSame(1, DB::table('quiz_integration_outbox')->where('attempt_id', $attempt->id)->count());
    }

    /**
     * @return array{before: array, after: array}
     */
    private function finishManualCycle(string $type, float $scoreToPass, float $manualScore): array
    {
        $this->sequence++;
        $quizId = 800 + $this->sequence;
        $questionId = 900 + $this->sequence;
        $key = 'i1_q'.$questionId;

        $versionId = (int) DB::table('quiz_versions')->insertGetId([
            'quiz_id' => $quizId,
            'version_number' => 1,
            'status' => 'published',
            'settings_frozen' => json_encode(['score_to_pass' => $scoreToPass]),
            'published_at' => '2026-11-23 12:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $snapshotId = (int) DB::table('quiz_snapshots')->insertGetId([
            'quiz_version_id' => $versionId,
            'quiz_id' => $quizId,
            'payload' => json_encode([
                'questions' => [[
                    'snapshot_question_key' => $key,
                    'question_id' => $questionId,
                    'type' => $type,
                    'options' => [],
                    'correct_key' => ['corAnswer' => 'sample'],
                    'max_score' => 1,
                ]],
            ]),
            'item_count' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $attemptId = (int) DB::table('quiz_attempts')->insertGetId([
            'quiz_id' => $quizId,
            'quiz_version_id' => $versionId,
            'quiz_snapshot_id' => $snapshotId,
            'student_id' => 7,
            'status' => 'submitted',
            'attempt_no' => 1,
            'started_at' => '2026-11-23 12:00:00',
            'submitted_at' => '2026-11-23 12:05:00',
            'row_version' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('quiz_attempt_answers')->insert([
            'attempt_id' => $attemptId,
            'question_id' => $questionId,
            'snapshot_question_key' => $key,
            'response_payload' => json_encode(['value' => 'student text']),
            'is_draft' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $before = app(QuizAutoGradingService::class)->grade([
            'attempt_id' => $attemptId,
            'student_id' => 7,
        ]);
        $after = app(QuizManualGradingService::class)->manualGrade([
            'attempt_id' => $attemptId,
            'teacher' => $this->teacher,
            'row_version' => (int) $before['attempt']->row_version,
            'grades' => [[
                'snapshot_question_key' => $key,
                'manual_score' => $manualScore,
            ]],
        ]);

        return [
            'before' => $before,
            'after' => $after,
        ];
    }

    /**
     * @return array{before: array, after: array}
     */
    private function finishMixedCycle(float $scoreToPass, float $manualScore): array
    {
        $this->sequence++;
        $quizId = 800 + $this->sequence;
        $mcqId = 900 + $this->sequence;
        $shnId = 950 + $this->sequence;
        $mcqKey = 'i1_q'.$mcqId;
        $shnKey = 'i2_q'.$shnId;

        $versionId = (int) DB::table('quiz_versions')->insertGetId([
            'quiz_id' => $quizId,
            'version_number' => 1,
            'status' => 'published',
            'settings_frozen' => json_encode(['score_to_pass' => $scoreToPass]),
            'published_at' => '2026-11-23 12:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $snapshotId = (int) DB::table('quiz_snapshots')->insertGetId([
            'quiz_version_id' => $versionId,
            'quiz_id' => $quizId,
            'payload' => json_encode([
                'questions' => [
                    [
                        'snapshot_question_key' => $mcqKey,
                        'question_id' => $mcqId,
                        'type' => 'MCQ',
                        'options' => ['answer1' => 'Cat', 'answer2' => 'Rat'],
                        'correct_key' => ['corAnswer' => '1'],
                        'max_score' => 1,
                    ],
                    [
                        'snapshot_question_key' => $shnKey,
                        'question_id' => $shnId,
                        'type' => 'SHN',
                        'options' => [],
                        'correct_key' => ['corAnswer' => 'cat'],
                        'max_score' => 1,
                    ],
                ],
            ]),
            'item_count' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $attemptId = (int) DB::table('quiz_attempts')->insertGetId([
            'quiz_id' => $quizId,
            'quiz_version_id' => $versionId,
            'quiz_snapshot_id' => $snapshotId,
            'student_id' => 7,
            'status' => 'submitted',
            'attempt_no' => 1,
            'started_at' => '2026-11-23 12:00:00',
            'submitted_at' => '2026-11-23 12:05:00',
            'row_version' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('quiz_attempt_answers')->insert([
            [
                'attempt_id' => $attemptId,
                'question_id' => $mcqId,
                'snapshot_question_key' => $mcqKey,
                'response_payload' => json_encode(['selected' => [1]]),
                'is_draft' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'attempt_id' => $attemptId,
                'question_id' => $shnId,
                'snapshot_question_key' => $shnKey,
                'response_payload' => json_encode(['value' => 'cat']),
                'is_draft' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $before = app(QuizAutoGradingService::class)->grade([
            'attempt_id' => $attemptId,
            'student_id' => 7,
        ]);
        $after = app(QuizManualGradingService::class)->manualGrade([
            'attempt_id' => $attemptId,
            'teacher' => $this->teacher,
            'row_version' => (int) $before['attempt']->row_version,
            'grades' => [[
                'snapshot_question_key' => $shnKey,
                'manual_score' => $manualScore,
            ]],
        ]);

        return ['before' => $before, 'after' => $after];
    }

    private function buildSchema(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->string('type')->nullable();
            $table->timestamps();
        });

        Schema::create('quiz_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_id');
            $table->integer('version_number')->default(1);
            $table->string('status');
            $table->text('settings_frozen')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('quiz_snapshots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_version_id');
            $table->unsignedBigInteger('quiz_id');
            $table->text('payload')->nullable();
            $table->integer('item_count')->default(0);
            $table->timestamps();
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('quiz_version_id')->nullable();
            $table->unsignedBigInteger('quiz_snapshot_id')->nullable();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('status')->nullable();
            $table->integer('attempt_no')->default(1);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->integer('row_version')->default(1);
            $table->timestamps();
        });

        Schema::create('quiz_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attempt_id');
            $table->unsignedBigInteger('question_id')->nullable();
            $table->string('snapshot_question_key')->nullable();
            $table->text('response_payload')->nullable();
            $table->boolean('is_draft')->default(false);
            $table->boolean('is_correct')->nullable();
            $table->boolean('needs_manual')->default(false);
            $table->decimal('auto_score', 8, 2)->nullable();
            $table->decimal('manual_score', 8, 2)->nullable();
            $table->unsignedBigInteger('graded_by')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('quiz_results', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attempt_id');
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('quiz_id')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->decimal('raw_score', 8, 2)->nullable();
            $table->decimal('max_score', 8, 2)->nullable();
            $table->decimal('percent', 8, 2)->nullable();
            $table->decimal('auto_score_total', 8, 2)->nullable();
            $table->decimal('manual_score_total', 8, 2)->nullable();
            $table->boolean('pending_manual')->default(false);
            $table->boolean('passed')->default(false);
            $table->integer('grade_version')->default(1);
            $table->boolean('is_authoritative')->default(false);
            $table->unsignedBigInteger('authoritative_slot')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();
        });

        Schema::create('quiz_integration_outbox', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attempt_id')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('event_type');
            $table->string('idempotency_key');
            $table->text('payload')->nullable();
            $table->string('status');
            $table->integer('relay_attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }
}
