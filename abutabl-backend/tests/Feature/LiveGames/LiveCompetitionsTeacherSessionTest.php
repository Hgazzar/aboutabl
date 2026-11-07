<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\AdminControllers\LiveCompetitionsTeacherController;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionQuestion;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.2 — teacher lobby session create. sqlite :memory: only; no migrate, no onesave.
 */
class LiveCompetitionsTeacherSessionTest extends TestCase
{
    /** @var string */
    private $previousDefault;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousDefault = config('database.default');
        config([
            'database.connections.live_competitions_test' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                'foreign_key_constraints' => true,
            ],
            'database.default' => 'live_competitions_test',
        ]);
        DB::purge('live_competitions_test');
        DB::reconnect('live_competitions_test');
        $this->createSchema();
        Schools::create(['id' => 5, 'name' => 'School Five']);
        Schools::create(['id' => 99, 'name' => 'School Other']);
    }

    protected function tearDown(): void
    {
        config(['database.default' => $this->previousDefault]);
        DB::purge('live_competitions_test');
        parent::tearDown();
    }

    public function test_authorized_teacher_creates_a_lobby_session_for_one_class(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->publishedEntitledGame(5, [
            ['sort_order' => 2, 'question' => 'Second'],
            ['sort_order' => 1, 'question' => 'First'],
        ]);

        $response = $this->storeSession($game->id, 1, ['school_id' => 99]);
        $payload = $response->getData(true);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertTrue($payload['status']);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $payload['session']['status']);
        $this->assertSame(1, $payload['session']['class_id']);
        $this->assertSame(5, $payload['session']['school_id']);
        $this->assertSame($teacher->id, $payload['session']['host_user_id']);
        $this->assertSame(2, $payload['session']['questions_count']);
        $this->assertSame(8, strlen($payload['session']['code']));
        $this->assertArrayNotHasKey('questions', $payload['session']);
        $this->assertSame(1, LiveGameSession::count());
        $this->assertNull(LiveGameSession::first()->started_at);
    }

    public function test_unauthenticated_session_create_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->postJson('/api/live-competitions/sessions', [
            'live_game_id' => 1,
            'class_id' => 1,
        ]);

        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_admin_cannot_create_a_teacher_session(): void
    {
        $admin = User::create(['id' => 1, 'type' => 'admin', 'name' => 'Admin']);
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($admin);

        $response = $this->storeSession(1, 1);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame('E403', $response->getData(true)['errNum']);
        $this->assertSame(0, LiveGameSession::count());
    }

    public function test_unpublished_game_is_rejected(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->insertGame('Draft', LiveGame::STATUS_UNPUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 5]);
        $this->insertQuestion($game->id, ['question' => 'Q1']);

        $response = $this->storeSession($game->id, 1);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(0, LiveGameSession::count());
    }

    public function test_game_entitled_only_to_another_school_is_rejected(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->publishedEntitledGame(99, [['question' => 'Q1']]);

        $response = $this->storeSession($game->id, 1);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(0, LiveGameSession::count());
    }

    public function test_unauthorized_class_is_rejected(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $other = $this->actingTeacher(11);
        $this->assignClass($other->id, 2, 5);
        $this->actingTeacher(10);
        $game = $this->publishedEntitledGame(5, [['question' => 'Q1']]);

        $response = $this->storeSession($game->id, 2);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(0, LiveGameSession::count());
    }

    public function test_class_from_a_different_school_cannot_use_that_schools_game(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->assignClass($teacher->id, 2, 99);
        $game = $this->publishedEntitledGame(99, [['question' => 'Q1']]);

        $response = $this->storeSession($game->id, 1);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(0, LiveGameSession::count());
    }

    public function test_session_belongs_to_exactly_one_class_and_starts_in_lobby(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->publishedEntitledGame(5, [['question' => 'Q1']]);

        $payload = $this->storeSession($game->id, 1)->getData(true);
        $session = LiveGameSession::first();

        $this->assertSame(1, (int) $session->class_id);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $session->status);
        $this->assertFalse($session->isActive() && $session->status === LiveGameSession::STATUS_PLAYING);
        $this->assertTrue($session->isLobby());
        $this->assertArrayNotHasKey('class_ids', $payload['session']);
        $this->assertSame(1, LiveGameSession::where('class_id', 1)->count());
    }

    public function test_question_snapshots_preserve_source_order_and_required_data(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->publishedEntitledGame(5, [
            ['sort_order' => 10, 'question' => 'Later', 'correct_answer' => 'B', 'answer1' => 'A', 'answer2' => 'B', 'answer3' => 'C', 'answer4' => 'D', 'explanation' => 'Why B'],
            ['sort_order' => 3, 'question' => 'Earlier', 'correct_answer' => 'Wood', 'answer1' => 'Sun', 'answer2' => 'Wood', 'answer3' => 'Rocks', 'answer4' => 'Leaves'],
        ]);

        $this->storeSession($game->id, 1);
        $snapshots = LiveGameSessionQuestion::query()->orderBy('sort_order')->orderBy('id')->get();

        $this->assertCount(2, $snapshots);
        $this->assertSame('Earlier', $snapshots[0]->question);
        $this->assertSame(3, (int) $snapshots[0]->sort_order);
        $this->assertSame('Wood', $snapshots[0]->correct_answer);
        $this->assertSame('Sun', $snapshots[0]->answer1);
        $this->assertSame($game->questions()->orderBy('sort_order')->first()->id, $snapshots[0]->live_game_question_id);
        $this->assertSame('Later', $snapshots[1]->question);
        $this->assertSame('Why B', $snapshots[1]->explanation);
        $this->assertSame(2, (int) LiveGame::first()->questions()->count());
    }

    public function test_snapshot_failure_rolls_back_the_session(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->publishedEntitledGame(5, [['question' => 'Q1']]);

        LiveGameSessionQuestion::creating(function () {
            throw new \RuntimeException('forced snapshot failure');
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->createLobbySession($teacher->id, $game->id, 1, [5]);
            $this->fail('Expected snapshot failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced snapshot failure', $ex->getMessage());
        } finally {
            LiveGameSessionQuestion::flushEventListeners();
        }

        $this->assertSame(0, LiveGameSession::count());
        $this->assertSame(0, LiveGameSessionQuestion::count());
    }

    public function test_second_active_session_for_the_same_class_is_rejected(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->publishedEntitledGame(5, [['question' => 'Q1']]);

        $first = $this->storeSession($game->id, 1);
        $this->assertSame(201, $first->getStatusCode());

        $second = $this->storeSession($game->id, 1);
        $this->assertSame(409, $second->getStatusCode());
        $this->assertSame(1, LiveGameSession::count());
    }

    public function test_sessions_route_is_flagged_teacher_post_not_admin_only(): void
    {
        $route = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/live-competitions/sessions'
                && in_array('POST', $route->methods(), true);
        });
        $this->assertNotNull($route);
        $middleware = $route->gatherMiddleware();
        $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
        $this->assertContains('checkUserToken:admin-api', $middleware);
        $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
    }

    public function test_empty_entitlements_cannot_start_a_session(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->insertGame('No schools', LiveGame::STATUS_PUBLISHED);
        $this->insertQuestion($game->id, ['question' => 'Q1']);

        $response = $this->storeSession($game->id, 1);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(0, LiveGameSession::count());
    }

    public function test_teacher_can_set_duration_minutes_on_create(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->publishedEntitledGame(5, [
            ['sort_order' => 1, 'question' => 'First'],
        ]);

        $response = $this->storeSession($game->id, 1, ['duration_minutes' => 15]);
        $payload = $response->getData(true);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame(15, $payload['session']['duration_minutes']);
        $this->assertSame(15, (int) LiveGameSession::first()->duration_minutes);
    }

    public function test_invalid_duration_minutes_is_rejected(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $game = $this->publishedEntitledGame(5, [
            ['sort_order' => 1, 'question' => 'First'],
        ]);

        $tooHigh = $this->storeSession($game->id, 1, ['duration_minutes' => 90]);
        $this->assertSame(400, $tooHigh->getStatusCode());
        $this->assertFalse($tooHigh->getData(true)['status']);
        $this->assertSame(0, LiveGameSession::count());

        $tooLow = $this->storeSession($game->id, 1, ['duration_minutes' => 0]);
        $this->assertSame(400, $tooLow->getStatusCode());
        $this->assertFalse($tooLow->getData(true)['status']);
        $this->assertSame(0, LiveGameSession::count());
    }

    private function storeSession(int $gameId, int $classId, array $extra = [])
    {
        $request = Request::create('/api/live-competitions/sessions', 'POST', array_merge([
            'live_game_id' => $gameId,
            'class_id' => $classId,
        ], $extra));

        return $this->app->make(LiveCompetitionsTeacherController::class)->storeSession($request);
    }

    private function actingTeacher(int $id, array $attrs = []): User
    {
        $existing = User::query()->find($id);
        $teacher = $existing ?: User::create(array_merge([
            'id' => $id,
            'type' => 'teacher',
            'name' => 'Teacher '.$id,
            'school_id' => 5,
        ], $attrs));
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($teacher);

        return $teacher;
    }

    private function assignClass(int $teacherId, int $classId, int $schoolId): void
    {
        if (! Classes::query()->where('id', $classId)->exists()) {
            Classes::create(['id' => $classId, 'school_id' => $schoolId, 'name' => 'Class '.$classId]);
        }
        TeachersGrades::create([
            'user_id' => $teacherId,
            'school_id' => $schoolId,
            'class_id' => $classId,
            'grade_id' => 1,
            'subject_id' => 1,
            'status' => 1,
        ]);
        if (! SchoolsRoles::query()->where('user_id', $teacherId)->where('school_id', $schoolId)->exists()) {
            SchoolsRoles::create([
                'user_id' => $teacherId,
                'school_id' => $schoolId,
                'role_id' => 1,
                'status' => 1,
            ]);
        }
    }

    private function publishedEntitledGame(int $schoolId, array $questions): LiveGame
    {
        $game = $this->insertGame('Entitled Classic', LiveGame::STATUS_PUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => $schoolId]);
        foreach ($questions as $question) {
            $this->insertQuestion($game->id, $question);
        }

        return $game->fresh(['questions']);
    }

    private function insertGame(string $name, int $status): LiveGame
    {
        return LiveGame::create([
            'name' => $name,
            'time' => '10:00',
            'logo' => null,
            'type' => 'classic',
            'level' => 1,
            'background' => null,
            'status' => $status,
            'created_by' => 1,
        ]);
    }

    private function insertQuestion(int $gameId, array $attrs): LiveGameQuestion
    {
        return LiveGameQuestion::create(array_merge([
            'live_game_id' => $gameId,
            'question' => 'Q',
            'image' => null,
            'voice_url' => null,
            'correct_answer' => 'Wood',
            'answer_type' => 'text',
            'answer1' => 'Sun',
            'answer2' => 'Wood',
            'answer3' => 'Rocks',
            'answer4' => 'Leaves',
            'explanation' => null,
            'sort_order' => 1,
        ], $attrs));
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->string('name')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->timestamps();
        });
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('name_ar')->nullable();
            $table->timestamps();
        });
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('name')->nullable();
            $table->timestamps();
        });
        Schema::create('schools_roles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('role_id')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
        });
        Schema::create('teachers_grades', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('grade_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
        });
        Schema::create('live_games', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('time', 16)->default('05:00');
            $table->string('logo')->nullable();
            $table->string('type', 32)->nullable();
            $table->unsignedTinyInteger('level')->nullable();
            $table->string('background')->nullable();
            $table->unsignedTinyInteger('status')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
        Schema::create('live_game_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_id');
            $table->text('question')->nullable();
            $table->text('image')->nullable();
            $table->text('voice_url')->nullable();
            $table->string('correct_answer')->nullable();
            $table->string('answer_type')->nullable();
            $table->string('answer1')->nullable();
            $table->string('answer2')->nullable();
            $table->string('answer3')->nullable();
            $table->string('answer4')->nullable();
            $table->text('explanation')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
        Schema::create('live_game_schools', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_id');
            $table->unsignedBigInteger('school_id');
            $table->timestamps();
            $table->unique(['live_game_id', 'school_id']);
        });
        Schema::create('live_game_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 8)->unique();
            $table->unsignedBigInteger('live_game_id');
            $table->unsignedBigInteger('host_user_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('status')->default('lobby');
            $table->unsignedInteger('current_question_index')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->string('goal')->default('comprehension');
            $table->unsignedTinyInteger('question_seconds')->default(20);
            $table->boolean('team_mode')->default(false);
            $table->unsignedInteger('firewood')->default(0);
            $table->boolean('fire_lit')->default(false);
            $table->string('active_event')->nullable();
            $table->unsignedInteger('live_version')->default(0);
            $table->boolean('firewall_active')->default(false);
            $table->boolean('bridge_broken')->default(false);
            $table->decimal('class_accuracy', 5, 2)->nullable();
            $table->timestamps();
        });
        Schema::create('live_game_session_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('live_game_question_id')->nullable();
            $table->text('question')->nullable();
            $table->text('image')->nullable();
            $table->text('voice_url')->nullable();
            $table->string('correct_answer');
            $table->string('answer_type')->nullable();
            $table->string('answer1');
            $table->string('answer2');
            $table->string('answer3');
            $table->string('answer4');
            $table->text('explanation')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('name_ar')->nullable();
            $table->string('photo')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });
        Schema::create('live_game_session_invites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('invited_by');
            $table->string('status', 16)->default('pending');
            $table->timestamp('invited_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->unique(['live_game_session_id', 'student_id']);
        });
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('from_user_type')->nullable();
            $table->unsignedBigInteger('from_user_id')->nullable();
            $table->unsignedBigInteger('to_user_id');
            $table->string('to_user_type')->nullable();
            $table->string('title')->nullable();
            $table->string('description', 1000)->nullable();
            $table->string('url', 1000)->nullable();
            $table->string('type')->nullable();
            $table->unsignedBigInteger('type_id')->nullable();
            $table->boolean('is_read')->default(0);
            $table->timestamps();
        });
    }
}
