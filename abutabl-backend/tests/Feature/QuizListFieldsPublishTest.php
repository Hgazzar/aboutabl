<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\AdminControllers\QuizesController;
use App\Models\QuizRuntime\QuizVersion;
use App\Models\User;
use App\Services\QuizRuntime\QuizPublishService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class QuizListFieldsPublishTest extends TestCase
{
    /** @var User */
    private $admin;

    /** @var int */
    private $quizId;

    /** @var int */
    private $questionId;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'sqlite') {
            $this->markTestSkipped('Score publish tests use a private sqlite schema.');
        }

        Schema::dropAllTables();
        $this->buildSchema();

        $this->admin = User::create([
            'name' => 'Score Admin',
            'email' => 'score-admin@test.com',
            'password' => bcrypt('password'),
            'type' => 'admin',
        ]);
        $this->questionId = (int) DB::table('questions')->insertGetId([
            'type' => 'MCQ',
            'question' => 'Which letter is A?',
            'corAnswer' => '1',
            'answer1' => 'A',
            'answer2' => 'B',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->quizId = (int) DB::table('quizes')->insertGetId([
            'title_en' => 'First',
            'title_ar' => 'First',
            'status' => '1',
            'subject_id' => 1,
            'score_to_pass' => 1,
            'score_method' => 'points',
            'num_attempts' => 1,
            'created_by' => $this->admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('quizes_questions')->insert([
            'quize_id' => $this->quizId,
            'question_id' => $this->questionId,
            'score' => 1,
            'created_by' => $this->admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_a_changed_pass_score_is_frozen_and_old_attempt_results_stay(): void
    {
        $this->actAsAdmin();
        app(QuizPublishService::class)->publish([
            'quiz_id' => $this->quizId,
            'published_by' => $this->admin->id,
        ]);
        $original = QuizVersion::where('quiz_id', $this->quizId)->first();
        $attemptId = (int) DB::table('quiz_attempts')->insertGetId([
            'quiz_id' => $this->quizId,
            'quiz_version_id' => $original->id,
            'student_id' => 41,
            'status' => 'finalized',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $resultId = (int) DB::table('quiz_results')->insertGetId([
            'attempt_id' => $attemptId,
            'quiz_id' => $this->quizId,
            'raw_score' => 1,
            'max_score' => 1,
            'percent' => 100,
            'passed' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $resultBefore = (array) DB::table('quiz_results')->where('id', $resultId)->first();
        $attemptBefore = (array) DB::table('quiz_attempts')->where('id', $attemptId)->first();

        $same = $this->controller()->listFields($this->quizId, Request::create('/', 'POST', [
            'score_to_pass' => 1,
        ]));
        $this->assertSame(200, $same->getStatusCode());
        $this->assertSame(1, QuizVersion::where('quiz_id', $this->quizId)->count());
        $this->assertSame(QuizVersion::STATUS_PUBLISHED, $original->fresh()->status);

        $changed = $this->controller()->listFields($this->quizId, Request::create('/', 'POST', [
            'score_to_pass' => 8,
        ]));
        $this->assertSame(200, $changed->getStatusCode());

        $versions = QuizVersion::where('quiz_id', $this->quizId)->orderBy('version_number')->get();
        $this->assertCount(2, $versions);
        $this->assertSame(QuizVersion::STATUS_SUPERSEDED, $versions[0]->status);
        $this->assertSame(1.0, (float) $versions[0]->settings_frozen['score_to_pass']);
        $this->assertSame(QuizVersion::STATUS_PUBLISHED, $versions[1]->status);
        $this->assertSame(8.0, (float) $versions[1]->settings_frozen['score_to_pass']);
        $this->assertSame('First', $versions[1]->settings_frozen['title_en']);
        $this->assertSame('points', $versions[1]->settings_frozen['score_method']);
        $this->assertSame(8.0, (float) DB::table('quizes')->where('id', $this->quizId)->value('score_to_pass'));
        $this->assertSame($attemptBefore, (array) DB::table('quiz_attempts')->where('id', $attemptId)->first());
        $this->assertSame($resultBefore, (array) DB::table('quiz_results')->where('id', $resultId)->first());
    }

    public function test_publish_failure_rolls_back_the_pass_score(): void
    {
        $this->mock(QuizPublishService::class, function ($mock) {
            $mock->shouldReceive('publish')->once()->andThrow(new \RuntimeException('publish failed'));
        });
        $this->actAsAdmin();

        $response = $this->controller()->listFields($this->quizId, Request::create('/', 'POST', [
            'score_to_pass' => 9,
        ]));

        $this->assertSame(400, $response->getStatusCode());
        $this->assertSame(1.0, (float) DB::table('quizes')->where('id', $this->quizId)->value('score_to_pass'));
        $this->assertSame(0, QuizVersion::count());
    }

    private function controller(): QuizesController
    {
        return $this->app->make(QuizesController::class);
    }

    private function actAsAdmin(): void
    {
        auth()->setDefaultDriver('admin-api');
        auth('admin-api')->setUser($this->admin);
    }

    private function buildSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->string('type')->nullable();
            $table->timestamps();
        });
        Schema::create('questions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type')->nullable();
            $table->longText('question')->nullable();
            $table->longText('corAnswer')->nullable();
            $table->longText('answer1')->nullable();
            $table->longText('answer2')->nullable();
            $table->timestamps();
        });
        Schema::create('quizes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title_en')->nullable();
            $table->string('title_ar')->nullable();
            $table->string('status')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('score_method')->nullable();
            $table->double('score_to_pass')->nullable();
            $table->integer('num_attempts')->nullable();
            $table->timestamps();
        });
        Schema::create('quizes_questions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('quize_id');
            $table->unsignedBigInteger('question_id');
            $table->double('score')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
        Schema::create('quiz_versions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedInteger('version_number');
            $table->string('status', 32)->default('draft');
            $table->char('content_hash', 64)->nullable();
            $table->json('settings_frozen')->nullable();
            $table->unsignedBigInteger('published_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('source_definition_updated_at')->nullable();
            $table->timestamps();
        });
        Schema::create('quiz_snapshots', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('quiz_version_id');
            $table->unsignedBigInteger('quiz_id');
            $table->char('content_hash', 64)->nullable();
            $table->json('payload');
            $table->unsignedInteger('item_count')->default(0);
            $table->timestamps();
        });
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('quiz_version_id');
            $table->unsignedBigInteger('student_id');
            $table->string('status')->nullable();
            $table->timestamps();
        });
        Schema::create('quiz_results', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('attempt_id');
            $table->unsignedBigInteger('quiz_id');
            $table->double('raw_score')->nullable();
            $table->double('max_score')->nullable();
            $table->double('percent')->nullable();
            $table->boolean('passed')->default(false);
            $table->timestamps();
        });
    }
}
