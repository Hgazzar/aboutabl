<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\StudentControllers\LiveCompetitionsStudentController;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionPlayer;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\LiveCompetitions\LiveCompetitionEngine;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.6E — student pick-password. sqlite :memory: only; no migrate, no onesave.
 *
 * SQLite does not honor MySQL FOR UPDATE row locks, so these tests cannot
 * prove real concurrent-pick safety. Lock ordering is asserted by
 * inspecting pickSessionPassword source.
 *
 * Standalone pickPassword does not require status=playing.
 */
class LiveCompetitionsStudentPickPasswordTest extends TestCase
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

    public function test_hacking_theme_can_pick_password_from_options(): void
    {
        $playing = $this->openPlaying([21], 1, 'hacking');
        $options = ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o'];
        $this->setPasswordState(21, $options);
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->pick($playing['id'], [
            'password' => 'Gh56i',
            'student_id' => 99,
        ]);
        $payload = $response->getData(true);
        $player = LiveGameSessionPlayer::query()->where('student_id', 21)->first();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['password']['has_password']);
        $this->assertFalse($payload['password']['already_selected']);
        $this->assertSame($options, $payload['password']['password_options']);
        $this->assertArrayNotHasKey('hack_password', $payload['password']);
        $this->assertArrayNotHasKey('players', $payload['password']);
        $this->assertSame('Gh56i', $player->hack_password);
        $this->assertGreaterThan($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_non_hacking_theme_returns_404(): void
    {
        $playing = $this->openPlaying([21], 1, 'classic');
        $this->setPasswordState(21, ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o']);
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->pick($playing['id'], ['password' => 'Ab12c']);
        $this->assertSame(404, $response->getStatusCode());
        $this->assertNull(LiveGameSessionPlayer::first()->hack_password);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_missing_password_is_rejected(): void
    {
        $playing = $this->openPlaying([21], 1, 'hacking');
        $this->setPasswordState(21, ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o']);
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->pick($playing['id'], []);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertNull(LiveGameSessionPlayer::first()->hack_password);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_password_longer_than_sixteen_is_rejected(): void
    {
        $playing = $this->openPlaying([21], 1, 'hacking');
        $long = str_repeat('a', 17);
        $this->setPasswordState(21, [$long, 'De34f', 'Gh56i', 'Jk78l', 'Mn90o']);
        $this->actingStudent(21);

        $response = $this->pick($playing['id'], ['password' => $long]);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertNull(LiveGameSessionPlayer::first()->hack_password);
    }

    public function test_password_not_in_options_is_rejected(): void
    {
        $playing = $this->openPlaying([21], 1, 'hacking');
        $this->setPasswordState(21, ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o']);
        $this->actingStudent(21);

        $response = $this->pick($playing['id'], ['password' => 'nope1']);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame('Choose one of the five passwords.', $response->getData(true)['msg']);
        $this->assertNull(LiveGameSessionPlayer::first()->hack_password);
    }

    public function test_already_selected_password_is_not_replaced(): void
    {
        $playing = $this->openPlaying([21], 1, 'hacking');
        $this->setPasswordState(21, ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o'], 'Ab12c');
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->pick($playing['id'], ['password' => 'De34f']);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['password']['already_selected']);
        $this->assertTrue($payload['password']['has_password']);
        $this->assertSame('Ab12c', LiveGameSessionPlayer::first()->hack_password);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_absent_options_are_initialized_with_random_passwords_five(): void
    {
        $playing = $this->openPlaying([21], 1, 'hacking');
        $this->setPasswordState(21, null);
        $this->actingStudent(21);

        $response = $this->pick($playing['id'], ['password' => 'zzzzz']);
        $this->assertSame(422, $response->getStatusCode());

        $player = LiveGameSessionPlayer::first();
        $options = $player->password_options;
        $this->assertIsArray($options);
        $this->assertCount(5, $options);
        $this->assertSame(5, count(array_unique($options)));
        foreach ($options as $option) {
            $this->assertMatchesRegularExpression('/^[A-Za-z0-9]{5}$/', $option);
        }

        $engineSource = file_get_contents(app_path('Support/LiveCompetitions/LiveCompetitionEngine.php'));
        $ensureBody = $this->methodBody($engineSource, 'ensurePasswordOptions');
        $this->assertStringContainsString('randomPasswords(5)', $ensureBody);
        $randBody = $this->methodBody($engineSource, 'randomPasswords');
        $this->assertStringContainsString("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", $randBody);
        $this->assertStringContainsString('for ($i = 0; $i < 5; $i++)', $randBody);
    }

    public function test_options_are_stable_across_retries(): void
    {
        $playing = $this->openPlaying([21], 1, 'hacking');
        $this->setPasswordState(21, null);
        $this->actingStudent(21);

        $this->assertSame(422, $this->pick($playing['id'], ['password' => 'nope1'])->getStatusCode());
        $first = LiveGameSessionPlayer::first()->password_options;
        $this->assertCount(5, $first);

        $this->assertSame(422, $this->pick($playing['id'], ['password' => 'nope2'])->getStatusCode());
        $second = LiveGameSessionPlayer::first()->password_options;
        $this->assertSame($first, $second);

        $chosen = $first[0];
        $ok = $this->pick($playing['id'], ['password' => $chosen]);
        $this->assertSame(200, $ok->getStatusCode());
        $this->assertSame($chosen, LiveGameSessionPlayer::first()->hack_password);
        $this->assertSame($first, LiveGameSessionPlayer::first()->password_options);
    }

    public function test_student_cannot_pick_for_another_player(): void
    {
        $playing = $this->openPlaying([21, 22], 1, 'hacking');
        $this->setPasswordState(21, ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o']);
        $this->setPasswordState(22, ['Zx11a', 'Cv22b', 'Bn33c', 'Mq44d', 'Wp55e']);
        $this->actingStudent(22);

        $response = $this->pick($playing['id'], ['password' => 'Ab12c']);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertNull(LiveGameSessionPlayer::query()->where('student_id', 21)->first()->hack_password);
        $this->assertNull(LiveGameSessionPlayer::query()->where('student_id', 22)->first()->hack_password);

        $ok = $this->pick($playing['id'], ['password' => 'Zx11a']);
        $this->assertSame(200, $ok->getStatusCode());
        $this->assertSame('Zx11a', LiveGameSessionPlayer::query()->where('student_id', 22)->first()->hack_password);
        $this->assertNull(LiveGameSessionPlayer::query()->where('student_id', 21)->first()->hack_password);
    }

    public function test_lobby_hacking_session_cannot_pick_password(): void
    {
        $lobby = $this->openLobbyWithStudents([21], '10:00', 1, 'hacking');
        $this->joinStudents($lobby['id'], [21]);
        $this->setPasswordState(21, ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o']);
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($lobby['id'])->live_version;

        $source = file_get_contents(app_path('Support/LiveCompetitions/LiveCompetitionSessionService.php'));
        $body = $this->methodBody($source, 'pickSessionPassword');
        $this->assertTrue(str_contains($body, 'STATUS_PLAYING'));
        $this->assertLessThan(strpos($body, 'themeType'), strpos($body, 'STATUS_PLAYING'));
        $this->assertLessThan(strpos($body, 'pickPassword'), strpos($body, 'STATUS_PLAYING'));

        $response = $this->pick($lobby['id'], ['password' => 'Ab12c']);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame('Competition is not active.', $response->getData(true)['msg']);
        $this->assertNull(LiveGameSessionPlayer::first()->hack_password);
        $this->assertSame(
            ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o'],
            LiveGameSessionPlayer::first()->password_options
        );
        $this->assertSame($version, (int) LiveGameSession::query()->find($lobby['id'])->live_version);
    }

    public function test_pick_password_failure_rolls_back_selection(): void
    {
        $playing = $this->openPlaying([21], 1, 'hacking');
        $this->setPasswordState(21, ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o']);
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        LiveGameSessionPlayer::updating(function (LiveGameSessionPlayer $row) {
            if ($row->isDirty('hack_password') && $row->hack_password) {
                throw new \RuntimeException('forced pick failure');
            }
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->pickSessionPassword(21, (int) $playing['id'], 'Ab12c');
            $this->fail('Expected pick failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced pick failure', $ex->getMessage());
        } finally {
            LiveGameSessionPlayer::flushEventListeners();
        }

        $player = LiveGameSessionPlayer::first();
        $this->assertNull($player->hack_password);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_pick_password_locks_session_before_player_rows(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $this->assertNotFalse($source);
        $body = $this->methodBody($source, 'pickSessionPassword');
        $sessionQuery = strpos($body, 'LiveGameSession::query()');
        $sessionLock = strpos($body, 'lockForUpdate');
        $playerQuery = strpos($body, 'LiveGameSessionPlayer::query()');
        $this->assertLessThan($sessionLock, $sessionQuery);
        $this->assertLessThan($playerQuery, $sessionLock);
        $this->assertLessThan(strpos($body, 'pickPassword('), $playerQuery);
        $this->assertTrue(str_contains($body, "themeType() !== 'hacking'"));
        $this->assertFalse(str_contains($body, 'broadcast'));
    }

    public function test_random_passwords_matches_standalone_generator(): void
    {
        $engine = new LiveCompetitionEngine();
        $passwords = $engine->randomPasswords(5);
        $this->assertCount(5, $passwords);
        $this->assertSame(5, count(array_unique($passwords)));
        foreach ($passwords as $password) {
            $this->assertSame(5, strlen($password));
            $this->assertMatchesRegularExpression('/^[A-Za-z0-9]+$/', $password);
        }
    }

    public function test_unauthenticated_pick_password_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->postJson('/api/student/live-competitions/sessions/1/pick-password', [
            'password' => 'Ab12c',
        ]);
        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_pick_password_route_is_flagged_student_post(): void
    {
        $route = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/student/live-competitions/sessions/{id}/pick-password'
                && in_array('POST', $route->methods(), true);
        });
        $this->assertNotNull($route);
        $middleware = $route->gatherMiddleware();
        $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
        $this->assertContains('checkStudentToken:user-api', $middleware);
        $this->assertContains('checkSecretApi', $middleware);
        $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
    }

    /**
     * @param  string[]|null  $options
     */
    private function setPasswordState(int $studentId, ?array $options, ?string $hackPassword = null): void
    {
        $player = LiveGameSessionPlayer::query()->where('student_id', $studentId)->first();
        $player->password_options = $options;
        $player->hack_password = $hackPassword;
        $player->save();
    }

    private function pick($sessionId, array $body)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/pick-password',
            'POST',
            $body
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->pickPassword($sessionId, $request);
    }

    /**
     * @param  int[]  $joinStudentIds
     * @return array<string,mixed>
     */
    private function openPlaying(array $joinStudentIds, int $classId = 1, string $type = 'classic'): array
    {
        $lobby = $this->openLobbyWithStudents($joinStudentIds, '10:00', $classId, $type);
        $this->joinStudents($lobby['id'], $joinStudentIds);
        $this->actingTeacher(10);
        $this->app->make(LiveCompetitionSessionService::class)
            ->beginLobbySession(10, (int) $lobby['id']);

        return LiveGameSession::query()->find($lobby['id'])->toArray();
    }

    /**
     * @param  int[]  $studentIds
     * @return array<string,mixed>
     */
    private function openLobbyWithStudents(array $studentIds, string $time = '10:00', int $classId = 1, string $type = 'classic'): array
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, $classId, 5);
        foreach ($studentIds as $id) {
            $this->insertStudent($id, $classId, 5, '1', 'Student '.$id);
        }
        $game = $this->publishedEntitledGame(5, $time, $type);

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

    private function actingStudent(int $id): Student
    {
        $student = Student::query()->find($id);
        $this->app['auth']->shouldUse('user-api');
        $this->app['auth']->guard('user-api')->setUser($student);

        return $student;
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

    private function publishedEntitledGame(int $schoolId, string $time = '10:00', string $type = 'classic'): LiveGame
    {
        $game = LiveGame::create([
            'name' => 'Entitled '.$type,
            'time' => $time,
            'type' => $type,
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
        LiveGameQuestion::create([
            'live_game_id' => $game->id,
            'question' => 'What to drink?',
            'correct_answer' => 'Water',
            'answer_type' => 'text',
            'answer1' => 'Sand',
            'answer2' => 'Water',
            'answer3' => 'Oil',
            'answer4' => 'Smoke',
            'sort_order' => 2,
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
