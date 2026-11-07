<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\StudentControllers\LiveCompetitionsStudentController;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionPlayer;
use App\Models\LiveGameSessionQuestion;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.6D — student use-power. sqlite :memory: only; no migrate, no onesave.
 *
 * SQLite does not honor MySQL FOR UPDATE row locks, so these tests cannot
 * prove real concurrent-power safety. Lock ordering is asserted by
 * inspecting useSessionPower source.
 */
class LiveCompetitionsStudentUsePowerTest extends TestCase
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

    public function test_fifty_fifty_marks_power_used_without_mutating_choices(): void
    {
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        $before = $snapshot->only(['answer1', 'answer2', 'answer3', 'answer4', 'correct_answer']);
        $this->setPower(21, 'fifty_fifty');
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->usePower($playing['id']);
        $payload = $response->getData(true);
        $player = LiveGameSessionPlayer::query()->where('student_id', 21)->first();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('fifty_fifty', $payload['power']['power']);
        $this->assertSame('50 / 50', $payload['power']['power_label']);
        $this->assertTrue($payload['power']['power_used']);
        $this->assertFalse($payload['power']['shield']);
        $this->assertSame('Power activated: 50 / 50', $payload['power']['message']);
        $this->assertArrayNotHasKey('players', $payload['power']);
        $this->assertArrayNotHasKey('frozen_until', $payload['power']);
        $this->assertTrue((bool) $player->power_used);
        $this->assertFalse((bool) $player->shield);
        $this->assertNull($player->frozen_until);
        $this->assertSame($before, $snapshot->fresh()->only(['answer1', 'answer2', 'answer3', 'answer4', 'correct_answer']));
        $this->assertGreaterThan($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_shield_sets_shield_and_power_used(): void
    {
        $playing = $this->openPlaying([21]);
        $this->setPower(21, 'shield');
        $this->actingStudent(21);

        $response = $this->usePower($playing['id']);
        $player = LiveGameSessionPlayer::query()->where('student_id', 21)->first();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($response->getData(true)['power']['shield']);
        $this->assertTrue((bool) $player->shield);
        $this->assertTrue((bool) $player->power_used);
        $this->assertSame('Power activated: Shield', $response->getData(true)['power']['message']);
    }

    public function test_freeze_sets_rival_frozen_until_eight_seconds(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-03 10:00:00'));
        $playing = $this->openPlaying([21, 22]);
        $this->setPower(21, 'freeze');
        $this->actingStudent(21);

        $response = $this->usePower($playing['id']);
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $rival = LiveGameSessionPlayer::query()->where('student_id', 22)->first();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue((bool) $me->power_used);
        $this->assertNull($me->frozen_until);
        $this->assertNotNull($rival->frozen_until);
        $this->assertTrue($rival->isFrozen());
        $this->assertSame(
            Carbon::parse('2026-11-03 10:00:08')->toDateTimeString(),
            $rival->frozen_until->toDateTimeString()
        );
        $this->assertSame('Power activated: Freeze', $response->getData(true)['power']['message']);
        $this->assertArrayNotHasKey('victim', $response->getData(true)['power']);
        $this->assertArrayNotHasKey('student_id', $response->getData(true)['power']);
    }

    public function test_freeze_without_rival_leaves_power_unused(): void
    {
        $playing = $this->openPlaying([21]);
        $this->setPower(21, 'freeze');
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->usePower($playing['id']);
        $player = LiveGameSessionPlayer::query()->where('student_id', 21)->first();

        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame('No rival to freeze.', $response->getData(true)['msg']);
        $this->assertFalse((bool) $player->power_used);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_already_used_power_is_rejected_without_mutation(): void
    {
        $playing = $this->openPlaying([21]);
        $this->setPower(21, 'shield', true);
        LiveGameSessionPlayer::query()->where('student_id', 21)->update(['shield' => false]);
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->usePower($playing['id']);
        $player = LiveGameSessionPlayer::query()->where('student_id', 21)->first();

        $this->assertSame(409, $response->getStatusCode());
        $this->assertFalse((bool) $player->shield);
        $this->assertTrue((bool) $player->power_used);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_empty_power_is_rejected_without_mutation(): void
    {
        $playing = $this->openPlaying([21]);
        LiveGameSessionPlayer::query()->where('student_id', 21)->update([
            'power' => null,
            'power_used' => false,
            'shield' => false,
        ]);
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->usePower($playing['id']);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertFalse((bool) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->power_used);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_unknown_power_returns_validation_error_without_consuming(): void
    {
        $playing = $this->openPlaying([21]);
        $this->setPower(21, 'laser');
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->usePower($playing['id']);
        $player = LiveGameSessionPlayer::query()->where('student_id', 21)->first();

        $this->assertSame(422, $response->getStatusCode());
        $this->assertFalse((bool) $player->power_used);
        $this->assertFalse((bool) $player->shield);
        $this->assertNull($player->frozen_until);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_lobby_session_cannot_use_power(): void
    {
        $lobby = $this->openLobbyWithStudents([21]);
        $this->joinStudents($lobby['id'], [21]);
        LiveGameSessionPlayer::query()->where('student_id', 21)->update([
            'power' => 'shield',
            'power_used' => false,
        ]);
        $this->actingStudent(21);

        $response = $this->usePower($lobby['id']);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertFalse((bool) LiveGameSessionPlayer::first()->power_used);
        $this->assertFalse((bool) LiveGameSessionPlayer::first()->shield);
    }

    public function test_student_cannot_use_another_players_power(): void
    {
        $playing = $this->openPlaying([21, 22]);
        $this->setPower(21, 'shield');
        $this->setPower(22, 'fifty_fifty');
        $this->actingStudent(22);

        $response = $this->usePower($playing['id']);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue((bool) LiveGameSessionPlayer::query()->where('student_id', 22)->first()->power_used);
        $this->assertFalse((bool) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->power_used);
        $this->assertFalse((bool) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->shield);
        $this->assertFalse((bool) LiveGameSessionPlayer::query()->where('student_id', 22)->first()->shield);
    }

    public function test_request_student_id_is_ignored(): void
    {
        $playing = $this->openPlaying([21, 22]);
        $this->setPower(21, 'shield');
        $this->setPower(22, 'freeze');
        $this->actingStudent(21);

        $response = $this->usePower($playing['id']);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue((bool) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->shield);
        $this->assertFalse((bool) LiveGameSessionPlayer::query()->where('student_id', 22)->first()->power_used);
        $this->assertNull(LiveGameSessionPlayer::query()->where('student_id', 21)->first()->frozen_until);
    }

    public function test_use_power_failure_rolls_back(): void
    {
        $playing = $this->openPlaying([21, 22]);
        $this->setPower(21, 'freeze');
        $this->actingStudent(21);

        LiveGameSessionPlayer::updating(function (LiveGameSessionPlayer $row) {
            if ($row->isDirty('power_used') && $row->power_used) {
                throw new \RuntimeException('forced power failure');
            }
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->useSessionPower(21, (int) $playing['id']);
            $this->fail('Expected power failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced power failure', $ex->getMessage());
        } finally {
            LiveGameSessionPlayer::flushEventListeners();
        }

        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $rival = LiveGameSessionPlayer::query()->where('student_id', 22)->first();
        $this->assertFalse((bool) $me->power_used);
        $this->assertNull($rival->frozen_until);
    }

    public function test_use_power_locks_session_before_player_rows(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $this->assertNotFalse($source);
        $body = $this->methodBody($source, 'useSessionPower');
        $sessionQuery = strpos($body, 'LiveGameSession::query()');
        $sessionLock = strpos($body, 'lockForUpdate');
        $playerQuery = strpos($body, 'LiveGameSessionPlayer::query()');
        $this->assertLessThan($sessionLock, $sessionQuery);
        $this->assertLessThan($playerQuery, $sessionLock);
        $this->assertLessThan(strpos($body, 'usePower('), $playerQuery);
        $this->assertTrue(str_contains($body, 'STATUS_PLAYING'));
        $this->assertFalse(str_contains($body, 'broadcast'));
        $this->assertFalse(str_contains($body, 'recordPlay'));

        $engine = file_get_contents(app_path('Support/LiveCompetitions/LiveCompetitionEngine.php'));
        $useBody = $this->methodBody($engine, 'usePower');
        $this->assertStringContainsString("\$player->power === 'fifty_fifty'", $useBody);
        $this->assertStringContainsString("\$player->power === 'shield'", $useBody);
        $this->assertStringContainsString("\$player->power === 'freeze'", $useBody);
        $this->assertStringContainsString('now()->addSeconds(8)', $useBody);
        $this->assertFalse(str_contains($useBody, 'choiceValues'));
        $this->assertFalse(str_contains($useBody, 'fiftyFiftyChoices'));
    }

    public function test_unauthenticated_use_power_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->postJson('/api/student/live-competitions/sessions/1/use-power');
        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_use_power_route_is_flagged_student_post(): void
    {
        $route = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/student/live-competitions/sessions/{id}/use-power'
                && in_array('POST', $route->methods(), true);
        });
        $this->assertNotNull($route);
        $middleware = $route->gatherMiddleware();
        $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
        $this->assertContains('checkStudentToken:user-api', $middleware);
        $this->assertContains('checkSecretApi', $middleware);
        $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
    }

    private function setPower(int $studentId, string $power, bool $used = false): void
    {
        LiveGameSessionPlayer::query()->where('student_id', $studentId)->update([
            'power' => $power,
            'power_used' => $used,
            'shield' => false,
            'frozen_until' => null,
        ]);
    }

    private function usePower($sessionId)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/use-power',
            'POST'
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->usePower($sessionId, $request);
    }

    /**
     * @param  int[]  $joinStudentIds
     * @return array<string,mixed>
     */
    private function openPlaying(array $joinStudentIds, int $classId = 1): array
    {
        $lobby = $this->openLobbyWithStudents($joinStudentIds, '10:00', $classId);
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
    private function openLobbyWithStudents(array $studentIds, string $time = '10:00', int $classId = 1): array
    {
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
