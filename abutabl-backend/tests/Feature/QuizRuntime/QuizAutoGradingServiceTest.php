<?php

namespace Tests\Feature\QuizRuntime;

use App\Services\QuizRuntime\QuizAutoGradingService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class QuizAutoGradingServiceTest extends TestCase
{
    /** @var int */
    private $sequence = 0;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
            $this->markTestSkipped('Auto-grading tests run only on sqlite :memory:.');
        }

        Schema::dropAllTables();
        $this->buildSchema();
    }

    public function test_mcq_correct_selected_index_scores_the_question(): void
    {
        $graded = $this->grade('MCQ', '1', ['selected' => [1]], 1, [
            'answer1' => 'Cat',
            'answer2' => 'Rat',
        ]);

        $this->assertSame('auto_graded', $graded['attempt']->status);
        $this->assertTrue((bool) $graded['answer']->is_correct);
        $this->assertSame(1.0, (float) $graded['answer']->auto_score);
        $this->assertFalse((bool) $graded['answer']->needs_manual);
        $this->assertSame(1.0, (float) $graded['result']->raw_score);
        $this->assertTrue((bool) $graded['result']->passed);
        $this->assertFalse((bool) $graded['result']->pending_manual);
        $this->assertFalse((bool) $graded['result']->is_authoritative);
    }

    public function test_mcq_incorrect_selected_index_scores_zero(): void
    {
        $graded = $this->grade('MCQ', '1', ['selected' => [2]], 1, [
            'answer1' => 'Cat',
            'answer2' => 'Rat',
        ]);

        $this->assertFalse((bool) $graded['answer']->is_correct);
        $this->assertSame(0.0, (float) $graded['answer']->auto_score);
        $this->assertSame(0.0, (float) $graded['result']->raw_score);
        $this->assertFalse((bool) $graded['result']->passed);
        $this->assertFalse((bool) $graded['answer']->needs_manual);
    }

    public function test_mcq_text_correct_answer_matches_the_selected_option(): void
    {
        $graded = $this->grade('MCQ', 'Cat', ['selected' => [1]], 1, [
            'answer1' => 'Cat',
            'answer2' => 'Rat',
        ]);

        $this->assertTrue((bool) $graded['answer']->is_correct);
        $this->assertSame(1.0, (float) $graded['answer']->auto_score);
    }

    public function test_mcq_numeric_option_text_matches_the_option_before_an_index(): void
    {
        $options = ['answer1' => '2', 'answer2' => 'B'];

        $pickedText = $this->grade('MCQ', '2', ['selected' => [1]], 1, $options);
        $pickedOther = $this->grade('MCQ', '2', ['selected' => [2]], 1, $options);

        $this->assertTrue((bool) $pickedText['answer']->is_correct);
        $this->assertSame(1.0, (float) $pickedText['answer']->auto_score);
        $this->assertFalse((bool) $pickedOther['answer']->is_correct);
    }

    public function test_mcq_invalid_index_and_empty_payload_score_zero(): void
    {
        $invalid = $this->grade('MCQ', '1', ['selected' => [9]], 1, [
            'answer1' => 'Cat',
            'answer2' => 'Rat',
        ]);
        $empty = $this->grade('MCQ', '1', [], 1, [
            'answer1' => 'Cat',
            'answer2' => 'Rat',
        ]);

        $this->assertFalse((bool) $invalid['answer']->is_correct);
        $this->assertSame(0.0, (float) $invalid['answer']->auto_score);
        $this->assertFalse((bool) $invalid['answer']->needs_manual);
        $this->assertFalse((bool) $empty['answer']->is_correct);
        $this->assertSame(0.0, (float) $empty['result']->raw_score);
    }

    public function test_mcq_extra_selection_fails_a_single_correct_index(): void
    {
        $graded = $this->grade('MCQ', '1', ['selected' => [1, 2]], 1, [
            'answer1' => 'Cat',
            'answer2' => 'Rat',
        ]);

        $this->assertFalse((bool) $graded['answer']->is_correct);
        $this->assertSame(0.0, (float) $graded['answer']->auto_score);
        $this->assertFalse((bool) $graded['result']->passed);
    }

    public function test_tf_supported_values_match_player_booleans_and_strings(): void
    {
        $cases = [
            ['1', true],
            ['0', false],
            ['true', true],
            ['false', false],
            ['yes', true],
            ['no', false],
            ['t', true],
            ['f', false],
            [' True ', true],
            ['NO', false],
            ['1', '1'],
            ['0', ' 0 '],
            ['true', 'TRUE'],
            ['false', ' false '],
            ['yes', 'Yes'],
            ['no', ' no '],
        ];

        foreach ($cases as [$expected, $actual]) {
            $graded = $this->grade('TF', $expected, ['value' => $actual]);
            $this->assertTrue(
                (bool) $graded['answer']->is_correct,
                'Expected TF '.$expected.' to accept '.json_encode($actual)
            );
        }
    }

    public function test_tf_invalid_and_missing_values_score_zero(): void
    {
        $invalid = $this->grade('TF', '1', ['value' => 'maybe']);
        $unknown = $this->grade('TF', 'correct', ['value' => true]);
        $missing = $this->grade('TF', '1', []);

        $this->assertFalse((bool) $invalid['answer']->is_correct);
        $this->assertSame(0.0, (float) $invalid['answer']->auto_score);
        $this->assertFalse((bool) $unknown['answer']->is_correct);
        $this->assertFalse((bool) $missing['answer']->is_correct);
        $this->assertFalse((bool) $invalid['answer']->needs_manual);
    }

    public function test_shn_with_score_to_pass_zero_stays_unpassed_while_pending_manual(): void
    {
        $graded = $this->grade('SHN', 'cat', ['value' => 'cat'], 0);

        $this->assertSame('pending_manual', $graded['attempt']->status);
        $this->assertTrue((bool) $graded['answer']->needs_manual);
        $this->assertNull($graded['answer']->auto_score);
        $this->assertNull($graded['answer']->is_correct);
        $this->assertTrue((bool) $graded['result']->pending_manual);
        $this->assertFalse((bool) $graded['result']->is_authoritative);
        $this->assertSame(0.0, (float) $graded['result']->raw_score);
        $this->assertSame(0.0, (float) $graded['result']->auto_score_total);
        $this->assertFalse((bool) $graded['result']->passed);
    }

    public function test_shn_with_score_to_pass_above_zero_is_pending_and_not_passed(): void
    {
        $graded = $this->grade('SHN', 'cat', ['value' => 'cat'], 1);

        $this->assertSame('pending_manual', $graded['attempt']->status);
        $this->assertTrue((bool) $graded['answer']->needs_manual);
        $this->assertNull($graded['answer']->auto_score);
        $this->assertTrue((bool) $graded['result']->pending_manual);
        $this->assertFalse((bool) $graded['result']->is_authoritative);
        $this->assertSame(0.0, (float) $graded['result']->raw_score);
        $this->assertFalse((bool) $graded['result']->passed);
    }

    public function test_matching_correct_pairs_match_regardless_of_order(): void
    {
        $graded = $this->grade('Matching', '1|2,2|1', [
            'pairs' => ['2|1', '1|2'],
        ]);

        $this->assertTrue((bool) $graded['answer']->is_correct);
        $this->assertSame(1.0, (float) $graded['answer']->auto_score);
        $this->assertFalse((bool) $graded['answer']->needs_manual);
        $this->assertTrue((bool) $graded['result']->passed);
    }

    public function test_matching_wrong_partial_missing_duplicate_and_malformed_pairs(): void
    {
        $wrong = $this->grade('Matching', '1|2,2|1', ['pairs' => ['1|1', '2|2']]);
        $partial = $this->grade('Matching', '1|2,2|1', ['pairs' => ['1|2']]);
        $missing = $this->grade('Matching', '1|2,2|1', ['pairs' => []]);
        $duplicateComplete = $this->grade('Matching', '1|2', ['pairs' => ['1|2', '1|2']]);
        $duplicateIncomplete = $this->grade('Matching', '1|2,2|1', ['pairs' => ['1|2', '1|2']]);
        $malformed = $this->grade('Matching', '1|2', ['pairs' => ['1-2']]);

        $this->assertFalse((bool) $wrong['answer']->is_correct);
        $this->assertFalse((bool) $partial['answer']->is_correct);
        $this->assertFalse((bool) $missing['answer']->is_correct);
        $this->assertTrue((bool) $duplicateComplete['answer']->is_correct);
        $this->assertFalse((bool) $duplicateIncomplete['answer']->is_correct);
        $this->assertFalse((bool) $malformed['answer']->is_correct);
        $this->assertSame(0.0, (float) $malformed['answer']->auto_score);
        $this->assertFalse((bool) $malformed['answer']->needs_manual);
    }

    /**
     * @param  array<string, mixed>  $options
     * @param  array<string, mixed>|null  $payload
     * @return array{attempt: \App\Models\QuizRuntime\QuizAttempt, result: \App\Models\QuizRuntime\QuizResult, answer: \App\Models\QuizRuntime\QuizAttemptAnswer|null}
     */
    private function grade(string $type, $corAnswer, ?array $payload, float $scoreToPass = 1, array $options = [])
    {
        $this->sequence++;
        $quizId = 500 + $this->sequence;
        $questionId = 700 + $this->sequence;

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
                    'snapshot_question_key' => 'i1_q'.$questionId,
                    'question_id' => $questionId,
                    'type' => $type,
                    'options' => $options,
                    'correct_key' => ['corAnswer' => $corAnswer],
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

        $answer = null;
        if ($payload !== null) {
            $answerId = (int) DB::table('quiz_attempt_answers')->insertGetId([
                'attempt_id' => $attemptId,
                'question_id' => $questionId,
                'snapshot_question_key' => 'i1_q'.$questionId,
                'response_payload' => json_encode($payload),
                'is_draft' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $answer = \App\Models\QuizRuntime\QuizAttemptAnswer::query()->find($answerId);
        }

        $graded = app(QuizAutoGradingService::class)->grade([
            'attempt_id' => $attemptId,
            'student_id' => 7,
        ]);

        return [
            'attempt' => $graded['attempt']->fresh(),
            'result' => $graded['result']->fresh(),
            'answer' => $answer !== null ? $answer->fresh() : null,
        ];
    }

    private function buildSchema(): void
    {
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
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();
        });
    }
}
