<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\StudentControllers\LiveCompetitionsStudentController;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionAnswer;
use App\Models\LiveGameSessionPlayer;
use App\Models\LiveGameSessionQuestion;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Student;
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
 * Slice C.6B — student reinforce. sqlite :memory: only; no migrate, no onesave.
 *
 * SQLite does not honor MySQL FOR UPDATE row locks, so these tests cannot
 * prove real concurrent-reinforce safety. Lock ordering is asserted by
 * inspecting reinforceSessionQuestion source.
 */
class LiveCompetitionsStudentReinforceTest extends TestCase
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

    public function test_correct_reinforce_after_wrong_answer_awards_three_coins(): void
    {
        $playing = $this->openPlaying([21]);
        $first = $this->snapshots()[0];
        $this->actingStudent(21);
        $this->wrongAnswer($playing['id'], $first);

        $response = $this->reinforce($playing['id'], [
            'answer' => 'Wood',
            'live_game_session_question_id' => 999,
            'student_id' => 22,
        ]);
        $payload = $response->getData(true);
        $player = LiveGameSessionPlayer::first();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['reinforce']['correct']);
        $this->assertSame(3, $payload['reinforce']['coins_awarded']);
        $this->assertSame(23, $payload['reinforce']['coins']);
        $this->assertFalse($payload['reinforce']['pending_reinforce']);
        $this->assertSame((int) $first->id, $payload['reinforce']['live_game_session_question_id']);
        $this->assertSame(0, (int) $player->score);
        $this->assertSame(0, (int) $player->streak);
        $this->assertSame(23, (int) $player->coins);
        $this->assertFalse((bool) $player->pending_reinforce);
        $this->assertNull($player->reinforce_question_id);
        $this->assertSame([], $player->lockInState());
        $this->assertContains((int) $first->id, $player->retryQueue());
        $this->assertSame(0, (int) $player->answers_since_retry);
        $row = LiveGameSessionAnswer::query()->where('is_reinforce', true)->first();
        $this->assertNotNull($row);
        $this->assertSame((int) $first->id, (int) $row->live_game_session_question_id);
        $this->assertTrue((bool) $row->is_reinforce);
        $this->assertFalse((bool) $row->is_retry);
        $this->assertSame(1, (int) $row->attempt);
        $this->assertSame(3, (int) $row->coins_delta);
        $this->assertArrayNotHasKey('players', $payload['reinforce']);
    }

    public function test_incorrect_reinforce_awards_zero_coins(): void
    {
        $playing = $this->openPlaying([21]);
        $first = $this->snapshots()[0];
        $this->actingStudent(21);
        $this->wrongAnswer($playing['id'], $first);
        $wrong = $this->lockInWrongChoice();

        $response = $this->reinforce($playing['id'], ['answer' => $wrong]);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($payload['reinforce']['correct']);
        $this->assertSame(0, $payload['reinforce']['coins_awarded']);
        $this->assertSame(20, $payload['reinforce']['coins']);
        $this->assertSame(0, (int) LiveGameSessionPlayer::first()->score);
        $this->assertSame(20, (int) LiveGameSessionPlayer::first()->coins);
        $this->assertSame(0, (int) LiveGameSessionAnswer::query()->where('is_reinforce', true)->first()->coins_delta);
    }

    public function test_student_can_submit_a_normal_answer_after_reinforce(): void
    {
        $playing = $this->openPlaying([21]);
        $snapshots = $this->snapshots();
        $this->actingStudent(21);
        $this->wrongAnswer($playing['id'], $snapshots[0]);
        $this->assertSame(200, $this->reinforce($playing['id'], ['answer' => 'Wood'])->getStatusCode());
        $this->startClock($playing['id']);

        $next = $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshots[1]->id,
            'answer' => 'Water',
        ]);
        $this->assertSame(200, $next->getStatusCode());
        $this->assertTrue($next->getData(true)['answer']['correct']);
        $this->assertSame(1, (int) LiveGameSessionPlayer::first()->score);
        $this->assertContains((int) $snapshots[0]->id, LiveGameSessionPlayer::first()->retryQueue());
        $this->assertSame(2, LiveGameSessionAnswer::query()->where('is_reinforce', false)->count());
    }

    public function test_no_pending_lock_in_returns_409(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingStudent(21);

        $response = $this->reinforce($playing['id'], ['answer' => 'Wood']);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());
    }

    public function test_lobby_session_cannot_be_reinforced(): void
    {
        $lobby = $this->openLobbyWithStudents([21]);
        $this->joinStudents($lobby['id'], [21]);
        LiveGameSessionPlayer::query()->update([
            'pending_reinforce' => true,
            'reinforce_question_id' => LiveGameSessionQuestion::query()->first()->id,
        ]);
        $this->actingStudent(21);

        $response = $this->reinforce($lobby['id'], ['answer' => 'Wood']);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());
    }

    public function test_catalog_and_foreign_snapshot_ids_are_rejected(): void
    {
        $playing = $this->openPlaying([21]);
        $other = $this->openPlaying([22], 2);
        $foreign = LiveGameSessionQuestion::query()
            ->where('live_game_session_id', $other['id'])
            ->first();
        $orphan = LiveGameQuestion::create([
            'live_game_id' => $playing['live_game_id'],
            'question' => 'Orphan',
            'correct_answer' => 'Wood',
            'answer_type' => 'text',
            'answer1' => 'Sun',
            'answer2' => 'Wood',
            'answer3' => 'Rocks',
            'answer4' => 'Leaves',
            'sort_order' => 99,
        ]);
        $first = $this->snapshots($playing['id'])[0];
        $this->actingStudent(21);
        $this->wrongAnswer($playing['id'], $first);

        LiveGameSessionPlayer::query()->where('student_id', 21)->update([
            'reinforce_question_id' => $orphan->id,
        ]);
        $this->assertSame(404, $this->reinforce($playing['id'], ['answer' => 'Wood'])->getStatusCode());

        LiveGameSessionPlayer::query()->where('student_id', 21)->update([
            'pending_reinforce' => true,
            'reinforce_question_id' => $foreign->id,
        ]);
        $this->assertSame(404, $this->reinforce($playing['id'], ['answer' => 'Wood'])->getStatusCode());
        $this->assertSame(1, LiveGameSessionAnswer::count());
    }

    public function test_student_cannot_reinforce_another_players_lock_in(): void
    {
        $playing = $this->openPlaying([21, 22]);
        $first = $this->snapshots()[0];
        $this->actingStudent(21);
        $this->wrongAnswer($playing['id'], $first);
        $this->actingStudent(22);

        $response = $this->reinforce($playing['id'], ['answer' => 'Wood']);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertTrue((bool) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->pending_reinforce);
        $this->assertSame(1, LiveGameSessionAnswer::count());
    }

    public function test_missing_lock_in_choices_fall_back_to_fifty_fifty(): void
    {
        $playing = $this->openPlaying([21]);
        $first = $this->snapshots()[0];
        $this->actingStudent(21);
        $this->wrongAnswer($playing['id'], $first);
        $player = LiveGameSessionPlayer::first();
        $data = $player->reward_data ?: [];
        unset($data['lock_in']['choices']);
        $player->reward_data = $data;
        $player->save();

        $response = $this->reinforce($playing['id'], ['answer' => 'Wood']);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($response->getData(true)['reinforce']['correct']);
    }

    public function test_choice_outside_lock_in_is_rejected(): void
    {
        $playing = $this->openPlaying([21]);
        $first = $this->snapshots()[0];
        $this->actingStudent(21);
        $this->wrongAnswer($playing['id'], $first);
        $allowed = LiveGameSessionPlayer::first()->lockInState()['choices'] ?? [];
        $outside = collect(['Sun', 'Wood', 'Rocks', 'Leaves'])->first(function ($choice) use ($allowed) {
            return ! in_array($choice, $allowed, true);
        });
        $this->assertNotNull($outside);

        $response = $this->reinforce($playing['id'], ['answer' => $outside]);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(1, LiveGameSessionAnswer::count());
        $this->assertTrue((bool) LiveGameSessionPlayer::first()->pending_reinforce);
    }

    public function test_reinforce_failure_rolls_back_player_and_answer(): void
    {
        $playing = $this->openPlaying([21]);
        $first = $this->snapshots()[0];
        $this->actingStudent(21);
        $this->wrongAnswer($playing['id'], $first);

        LiveGameSessionAnswer::creating(function (LiveGameSessionAnswer $row) {
            if ($row->is_reinforce) {
                throw new \RuntimeException('forced reinforce failure');
            }
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->reinforceSessionQuestion(21, (int) $playing['id'], 'Wood');
            $this->fail('Expected reinforce failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced reinforce failure', $ex->getMessage());
        } finally {
            LiveGameSessionAnswer::flushEventListeners();
        }

        $player = LiveGameSessionPlayer::first();
        $this->assertTrue((bool) $player->pending_reinforce);
        $this->assertSame(20, (int) $player->coins);
        $this->assertSame(1, LiveGameSessionAnswer::count());
        $this->assertSame(0, LiveGameSessionAnswer::query()->where('is_reinforce', true)->count());
    }

    public function test_reinforce_locks_session_before_player_rows(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $this->assertNotFalse($source);
        $body = $this->methodBody($source, 'reinforceSessionQuestion');
        $sessionQuery = strpos($body, 'LiveGameSession::query()');
        $sessionLock = strpos($body, 'lockForUpdate');
        $playerQuery = strpos($body, 'LiveGameSessionPlayer::query()');
        $this->assertLessThan($sessionLock, $sessionQuery);
        $this->assertLessThan($playerQuery, $sessionLock);
        $this->assertLessThan(strpos($body, 'reinforce('), $playerQuery);
        $this->assertFalse(str_contains($body, 'recordPlay'));
    }

    public function test_unauthenticated_reinforce_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->postJson('/api/student/live-competitions/sessions/1/reinforce', [
            'answer' => 'Wood',
        ]);
        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_reinforce_route_is_flagged_student_post(): void
    {
        $route = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/student/live-competitions/sessions/{id}/reinforce'
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
     * @return LiveGameSessionQuestion[]
     */
    private function snapshots(?int $sessionId = null): array
    {
        $query = LiveGameSessionQuestion::query()->orderBy('sort_order')->orderBy('id');
        if ($sessionId) {
            $query->where('live_game_session_id', $sessionId);
        }

        return $query->get()->all();
    }

    private function wrongAnswer($sessionId, LiveGameSessionQuestion $snapshot): void
    {
        $this->startClock($sessionId);
        $this->assertSame(200, $this->answer($sessionId, [
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Sun',
        ])->getStatusCode());
        $this->assertTrue((bool) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->pending_reinforce);
    }

    private function startClock($sessionId)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/start-question-clock',
            'POST'
        );

        return $this->app->make(LiveCompetitionsStudentController::class)
            ->startQuestionClock($sessionId, $request);
    }

    private function lockInWrongChoice(): string
    {
        $choices = LiveGameSessionPlayer::first()->lockInState()['choices'] ?? [];
        $wrong = collect($choices)->first(function ($choice) {
            return $choice !== 'Wood';
        });
        $this->assertNotNull($wrong);

        return $wrong;
    }

    private function reinforce($sessionId, array $body)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/reinforce',
            'POST',
            $body
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->reinforce($sessionId, $request);
    }

    private function answer($sessionId, array $body)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/answers',
            'POST',
            $body
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->answer($sessionId, $request);
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
