<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\AdminControllers\LiveCompetitionsTeacherController;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionAnswer;
use App\Models\LiveGameSessionInvite;
use App\Models\LiveGameSessionPlayer;
use App\Models\LiveGameSessionQuestion;
use App\Models\LiveGameSessionTeam;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\LiveCompetitions\LiveCompetitionEngine;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.5 — teacher Begin. sqlite :memory: only; no migrate, no onesave.
 *
 * SQLite does not honor MySQL FOR UPDATE row locks, so these tests cannot
 * prove real Join-vs-Begin concurrency. Lock ordering is asserted by
 * inspecting beginLobbySession and joinLobbySession source.
 */
class LiveCompetitionsTeacherBeginTest extends TestCase
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
        Carbon::setTestNow();
        config(['database.default' => $this->previousDefault]);
        DB::purge('live_competitions_test');
        parent::tearDown();
    }

    public function test_authorized_teacher_can_begin_a_lobby_session(): void
    {
        $session = $this->openLobbyWithStudents([21, 22]);
        $this->joinStudents($session['id'], [21, 22]);
        $this->actingTeacher(10);

        $response = $this->begin($session['id']);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['status']);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, $payload['session']['status']);
        $this->assertSame((int) $session['id'], $payload['session']['id']);
        $this->assertSame((int) $session['live_game_id'], $payload['session']['live_game_id']);
        $this->assertSame(1, $payload['session']['class_id']);
        $this->assertSame(5, $payload['session']['school_id']);
        $this->assertSame(2, $payload['session']['joined_player_count']);
        $this->assertNotNull($payload['session']['started_at']);
        $this->assertNotNull($payload['session']['ends_at']);
        $this->assertArrayNotHasKey('questions', $payload['session']);
        $this->assertArrayNotHasKey('code', $payload['session']);
        $this->assertArrayNotHasKey('players', $payload['session']);
        $encoded = json_encode($payload);
        $this->assertStringNotContainsString('correct_answer', $encoded);
        $this->assertStringNotContainsString('Wood', $encoded);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, LiveGameSession::first()->status);
    }

    public function test_admin_cannot_begin_a_session(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $admin = User::create(['id' => 1, 'type' => 'admin', 'name' => 'Admin']);
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($admin);

        $response = $this->begin($session['id']);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame('E403', $response->getData(true)['errNum']);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, LiveGameSession::first()->status);
    }

    public function test_teacher_cannot_begin_an_inaccessible_class_session(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $other = $this->actingTeacher(11);
        $this->assignClass($other->id, 2, 5);

        $response = $this->begin($session['id']);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_LOBBY, LiveGameSession::first()->status);
        $this->assertNull(LiveGameSession::first()->started_at);
    }

    public function test_non_owner_teacher_with_class_access_cannot_begin(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $other = $this->actingTeacher(11);
        $this->assignClass($other->id, 1, 5);

        $response = $this->begin($session['id']);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_LOBBY, LiveGameSession::first()->status);
        $this->assertNull(LiveGameSession::first()->started_at);
        $this->assertSame(10, (int) LiveGameSession::first()->host_user_id);
    }

    public function test_owner_without_current_class_access_cannot_begin(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        TeachersGrades::query()->where('user_id', 10)->delete();
        $this->actingTeacher(10);

        $response = $this->begin($session['id']);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_LOBBY, LiveGameSession::first()->status);
        $this->assertNull(LiveGameSession::first()->started_at);
    }

    public function test_missing_session_returns_404(): void
    {
        $this->actingTeacher(10);
        $this->assignClass(10, 1, 5);

        $response = $this->begin(999);
        $this->assertSame(404, $response->getStatusCode());
    }

    public function test_non_lobby_session_returns_409(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_PLAYING,
            'started_at' => now(),
        ]);
        $this->actingTeacher(10);

        $response = $this->begin($session['id']);
        $this->assertSame(409, $response->getStatusCode());
    }

    public function test_begin_initializes_each_joined_player_exactly_once(): void
    {
        $session = $this->openLobbyWithStudents([21, 22]);
        $this->joinStudents($session['id'], [21, 22]);
        LiveGameSessionPlayer::query()->update([
            'score' => 9,
            'coins' => 4,
            'streak' => 3,
            'character_slot' => 2,
            'best_streak' => 5,
            'power' => null,
            'power_used' => true,
            'shield' => true,
            'reward_pending' => true,
            'reward_type' => 'chest',
            'answered_current' => true,
            'answers_since_retry' => 2,
            'progress_penalty' => 1,
        ]);
        $this->actingTeacher(10);

        $this->assertSame(200, $this->begin($session['id'])->getStatusCode());
        $this->assertSame(2, LiveGameSessionPlayer::count());

        foreach (LiveGameSessionPlayer::query()->orderBy('student_id')->get() as $player) {
            $this->assertSame(0, (int) $player->score);
            $this->assertSame(20, (int) $player->coins);
            $this->assertSame(0, (int) $player->streak);
            $this->assertSame(5, (int) $player->best_streak);
            $this->assertSame(2, (int) $player->character_slot);
            $this->assertFalse((bool) $player->answered_current);
            $this->assertFalse((bool) $player->reward_pending);
            $this->assertNull($player->reward_type);
            $this->assertFalse((bool) $player->power_used);
            $this->assertFalse((bool) $player->shield);
            $this->assertContains($player->power, LiveCompetitionEngine::POWERS);
            $this->assertSame(0, (int) $player->answers_since_retry);
            $this->assertSame(0, (int) $player->progress_penalty);
            $this->assertNull($player->retry_queue);
            $this->assertNull($player->frozen_until);
            $this->assertNull($player->question_started_at);
            $this->assertNull($player->reinforce_question_id);
        }
    }

    public function test_repeated_begin_does_not_reset_or_duplicate_player_state(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->joinStudents($session['id'], [21]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->begin($session['id'])->getStatusCode());

        LiveGameSessionPlayer::query()->update([
            'score' => 7,
            'coins' => 33,
            'power' => 'shield',
        ]);
        $startedAt = LiveGameSession::first()->started_at;
        $endsAt = LiveGameSession::first()->ends_at;

        $second = $this->begin($session['id']);
        $this->assertSame(409, $second->getStatusCode());
        $this->assertSame(1, LiveGameSessionPlayer::count());
        $player = LiveGameSessionPlayer::first();
        $this->assertSame(7, (int) $player->score);
        $this->assertSame(33, (int) $player->coins);
        $this->assertSame('shield', $player->power);
        $this->assertEquals($startedAt, LiveGameSession::first()->started_at);
        $this->assertEquals($endsAt, LiveGameSession::first()->ends_at);
    }

    public function test_started_at_and_ends_at_follow_standalone_duration_rules(): void
    {
        $engine = new LiveCompetitionEngine();
        $this->assertSame(5, $engine->parseMinutes('05:00'));
        $this->assertSame(10, $engine->parseMinutes('10:30'));
        $this->assertSame(10, $engine->parseMinutes(null));
        $this->assertSame(10, $engine->parseMinutes('bad'));
        $this->assertSame(1, $engine->parseMinutes('00:45'));

        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);

        $five = $this->openLobbyWithStudents([21], '05:00');
        $this->actingTeacher(10);
        $this->assertSame(200, $this->begin($five['id'])->getStatusCode());
        $begun = LiveGameSession::query()->find($five['id']);
        $this->assertEquals($now, $begun->started_at);
        $this->assertEquals($now->copy()->addMinutes(5), $begun->ends_at);

        $invalid = $this->openLobbyWithStudents([22], 'not-a-time', 2);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->begin($invalid['id'])->getStatusCode());
        $fallback = LiveGameSession::query()->find($invalid['id']);
        $this->assertEquals($now, $fallback->started_at);
        $this->assertEquals($now->copy()->addMinutes(10), $fallback->ends_at);
    }

    public function test_teacher_duration_minutes_overrides_game_time_on_begin(): void
    {
        $now = Carbon::parse('2026-10-31 15:00:00');
        Carbon::setTestNow($now);

        $session = $this->openLobbyWithStudents([21], '10:00');
        LiveGameSession::query()->where('id', $session['id'])->update([
            'duration_minutes' => 3,
        ]);

        $this->actingTeacher(10);
        $this->assertSame(200, $this->begin($session['id'])->getStatusCode());

        $begun = LiveGameSession::query()->find($session['id']);
        $this->assertEquals($now, $begun->started_at);
        $this->assertEquals($now->copy()->addMinutes(3), $begun->ends_at);
        $this->assertSame(3, (int) $begun->duration_minutes);
    }

    public function test_zero_player_lobby_can_begin(): void
    {
        $session = $this->openLobbyWithStudents([]);
        $this->actingTeacher(10);

        $response = $this->begin($session['id']);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(0, $response->getData(true)['session']['joined_player_count']);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, LiveGameSession::first()->status);
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(0, LiveGameSessionTeam::count());
    }

    public function test_team_mode_assigns_teams_using_standalone_rules(): void
    {
        $session = $this->openLobbyWithStudents([21, 22]);
        $this->joinStudents($session['id'], [21, 22]);
        LiveGameSession::query()->where('id', $session['id'])->update(['team_mode' => true]);
        $this->actingTeacher(10);

        $this->assertSame(200, $this->begin($session['id'])->getStatusCode());
        $this->assertSame(1, LiveGameSessionTeam::count());
        $this->assertSame('Team 1', LiveGameSessionTeam::first()->name);
        $this->assertSame('#f4c430', LiveGameSessionTeam::first()->color);
        $this->assertSame(2, LiveGameSessionPlayer::query()->whereNotNull('team_id')->count());
    }

    public function test_begin_clears_existing_session_answers(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->joinStudents($session['id'], [21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        LiveGameSessionAnswer::create([
            'live_game_session_id' => $session['id'],
            'student_id' => 21,
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
            'correct' => true,
        ]);
        $this->actingTeacher(10);

        $this->assertSame(200, $this->begin($session['id'])->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());
    }

    public function test_new_join_after_begin_returns_409_and_accepted_join_returns_200(): void
    {
        $session = $this->openLobbyWithStudents([21, 22]);
        $this->joinStudents($session['id'], [21]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->begin($session['id'])->getStatusCode());

        $accepted = $this->app->make(LiveCompetitionSessionService::class)
            ->joinLobbySession(21, (int) $session['id']);
        $this->assertFalse($accepted['created']);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, $accepted['join']['session']['status']);
        $this->assertSame(1, LiveGameSessionPlayer::count());

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->joinLobbySession(22, (int) $session['id']);
            $this->fail('Expected new join after Begin to fail');
        } catch (\RuntimeException $ex) {
            $this->assertSame(409, (int) $ex->getCode());
        }
        $this->assertSame(1, LiveGameSessionPlayer::count());
        $this->assertSame(
            LiveGameSessionInvite::STATUS_PENDING,
            LiveGameSessionInvite::query()->where('student_id', 22)->first()->status
        );
    }

    public function test_begin_failure_rolls_back_player_initialization(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->joinStudents($session['id'], [21]);
        LiveGameSessionPlayer::query()->update(['coins' => 4, 'score' => 2]);
        $this->actingTeacher(10);

        LiveGameSession::updating(function (LiveGameSession $model) {
            if ((string) $model->status === LiveGameSession::STATUS_PLAYING) {
                throw new \RuntimeException('forced begin failure');
            }
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->beginLobbySession(10, (int) $session['id']);
            $this->fail('Expected begin failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced begin failure', $ex->getMessage());
        } finally {
            LiveGameSession::flushEventListeners();
        }

        $this->assertSame(LiveGameSession::STATUS_LOBBY, LiveGameSession::first()->status);
        $this->assertNull(LiveGameSession::first()->started_at);
        $this->assertSame(4, (int) LiveGameSessionPlayer::first()->coins);
        $this->assertSame(2, (int) LiveGameSessionPlayer::first()->score);
    }

    public function test_begin_and_join_lock_the_session_row_before_player_rows(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $this->assertNotFalse($source);

        $join = $this->methodBody($source, 'joinLobbySession');
        $begin = $this->methodBody($source, 'beginLobbySession');

        $this->assertLessThan(strpos($join, 'findPlayer'), strpos($join, 'lockForUpdate'));
        $this->assertLessThan(strpos($join, 'createPlayer'), strpos($join, 'lockForUpdate'));
        $this->assertLessThan(strpos($begin, 'startSession'), strpos($begin, 'lockForUpdate'));
        $this->assertFalse(strpos($begin, 'LiveGameSessionPlayer') < strpos($begin, 'lockForUpdate')
            && strpos($begin, 'LiveGameSessionPlayer') !== false);

        $joinLockSession = strpos($join, 'LiveGameSession::query()');
        $this->assertNotFalse($joinLockSession);
        $this->assertLessThan(strpos($join, 'lockForUpdate'), $joinLockSession + 1);
        $this->assertLessThan(strpos($join, 'LiveGameSessionInvite::query()'), strpos($join, 'lockForUpdate'));

        $beginLockSession = strpos($begin, 'LiveGameSession::query()');
        $this->assertNotFalse($beginLockSession);
        $this->assertLessThan(strpos($begin, 'lockForUpdate'), $beginLockSession + 1);
    }

    public function test_begin_route_is_flagged_teacher_post_not_admin_only(): void
    {
        $route = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/live-competitions/sessions/{id}/begin'
                && in_array('POST', $route->methods(), true);
        });
        $this->assertNotNull($route);
        $middleware = $route->gatherMiddleware();
        $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
        $this->assertContains('checkUserToken:admin-api', $middleware);
        $this->assertContains('checkSecretApi', $middleware);
        $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
    }

    public function test_unauthenticated_begin_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->postJson('/api/live-competitions/sessions/1/begin');

        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    private function begin($sessionId)
    {
        return $this->app->make(LiveCompetitionsTeacherController::class)->beginSession($sessionId);
    }

    /**
     * @param  int[]  $studentIds
     * @return array<string,mixed>
     */
    private function openLobbyWithStudents(
        array $studentIds,
        string $time = '10:00',
        int $classId = 1
    ): array {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, $classId, 5);
        foreach ($studentIds as $id) {
            $this->insertStudent($id, $classId, 5, '1', 'Student '.$id);
        }
        $game = $this->publishedEntitledGame(5, $time);

        return $this->app->make(LiveCompetitionSessionService::class)
            ->createLobbySession($teacher->id, $game->id, $classId, [5]);
    }

    /**
     * @param  int[]  $studentIds
     */
    private function joinStudents($sessionId, array $studentIds): void
    {
        $service = $this->app->make(LiveCompetitionSessionService::class);
        foreach ($studentIds as $studentId) {
            $service->joinLobbySession((int) $studentId, (int) $sessionId);
        }
    }

    private function actingTeacher(int $id): User
    {
        $existing = User::query()->find($id);
        $teacher = $existing ?: User::create([
            'id' => $id,
            'type' => 'teacher',
            'name' => 'Teacher '.$id,
            'school_id' => 5,
        ]);
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($teacher);

        return $teacher;
    }

    private function assignClass(int $teacherId, int $classId, int $schoolId): void
    {
        if (! Classes::query()->where('id', $classId)->exists()) {
            Classes::create(['id' => $classId, 'school_id' => $schoolId, 'name' => 'Class '.$classId]);
        }
        if (! TeachersGrades::query()->where('user_id', $teacherId)->where('class_id', $classId)->exists()) {
            TeachersGrades::create([
                'user_id' => $teacherId,
                'school_id' => $schoolId,
                'class_id' => $classId,
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
            ]);
        }
        if (! SchoolsRoles::query()->where('user_id', $teacherId)->where('school_id', $schoolId)->exists()) {
            SchoolsRoles::create([
                'user_id' => $teacherId,
                'school_id' => $schoolId,
                'role_id' => 1,
                'status' => 1,
            ]);
        }
    }

    private function publishedEntitledGame(int $schoolId, string $time = '10:00'): LiveGame
    {
        $game = LiveGame::create([
            'name' => 'Entitled Classic',
            'time' => $time,
            'type' => 'classic',
            'level' => 1,
            'status' => LiveGame::STATUS_PUBLISHED,
            'created_by' => 1,
        ]);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => $schoolId]);
        LiveGameQuestion::create([
            'live_game_id' => $game->id,
            'question' => 'What fuel?',
            'correct_answer' => 'Wood',
            'answer_type' => 'text',
            'answer1' => 'Sun',
            'answer2' => 'Wood',
            'answer3' => 'Rocks',
            'answer4' => 'Leaves',
            'sort_order' => 1,
        ]);

        return $game->fresh(['questions']);
    }

    private function insertStudent(int $id, int $classId, int $schoolId, string $status, string $name): Student
    {
        if (! Classes::query()->where('id', $classId)->exists()) {
            Classes::create(['id' => $classId, 'school_id' => $schoolId, 'name' => 'Class '.$classId]);
        }

        $existing = Student::query()->find($id);
        if ($existing) {
            return $existing;
        }

        return Student::create([
            'id' => $id,
            'name' => $name,
            'name_ar' => $name,
            'class_id' => $classId,
            'school_id' => $schoolId,
            'status' => $status,
        ]);
    }

    private function methodBody(string $source, string $method): string
    {
        $start = strpos($source, 'function '.$method);
        $this->assertNotFalse($start, $method.' is missing');
        $brace = strpos($source, '{', $start);
        $this->assertNotFalse($brace);
        $depth = 0;
        $end = $brace;
        $length = strlen($source);
        for ($i = $brace; $i < $length; $i++) {
            if ($source[$i] === '{') {
                $depth++;
            } elseif ($source[$i] === '}') {
                $depth--;
                if ($depth === 0) {
                    $end = $i;
                    break;
                }
            }
        }

        return substr($source, $brace, $end - $brace + 1);
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
        Schema::create('live_game_session_teams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->string('name');
            $table->string('color')->default('#f4c430');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('coins')->default(0);
            $table->timestamps();
        });
        Schema::create('live_game_session_players', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('coins')->default(0);
            $table->unsignedTinyInteger('character_slot')->default(0);
            $table->boolean('answered_current')->default(false);
            $table->string('hack_password')->nullable();
            $table->json('password_options')->nullable();
            $table->string('reward_type')->nullable();
            $table->json('reward_data')->nullable();
            $table->boolean('reward_pending')->default(false);
            $table->unsignedInteger('streak')->default(0);
            $table->unsignedInteger('best_streak')->default(0);
            $table->string('power')->nullable();
            $table->boolean('power_used')->default(false);
            $table->timestamp('frozen_until')->nullable();
            $table->boolean('shield')->default(false);
            $table->unsignedBigInteger('team_id')->nullable();
            $table->json('retry_queue')->nullable();
            $table->unsignedInteger('answers_since_retry')->default(0);
            $table->boolean('pending_reinforce')->default(false);
            $table->unsignedBigInteger('reinforce_question_id')->nullable();
            $table->timestamp('question_started_at')->nullable();
            $table->unsignedInteger('fastest_ms')->nullable();
            $table->integer('progress_penalty')->default(0);
            $table->string('last_protocol')->nullable();
            $table->timestamps();
            $table->unique(['live_game_session_id', 'student_id']);
        });
        Schema::create('live_game_session_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('live_game_session_question_id');
            $table->string('answer');
            $table->boolean('correct')->default(false);
            $table->integer('coins_delta')->default(0);
            $table->unsignedInteger('elapsed_ms')->nullable();
            $table->boolean('timed_out')->default(false);
            $table->boolean('is_retry')->default(false);
            $table->boolean('is_reinforce')->default(false);
            $table->unsignedTinyInteger('attempt')->default(1);
            $table->timestamps();
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
