<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\StudentControllers\LiveCompetitionsStudentController;
use App\Http\Middleware\EnsureLiveCompetitionsEnabled;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionInvite;
use App\Models\LiveGameSessionPlayer;
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
 * F.3.0a — student invite preview. sqlite :memory: only; no migrate, no onesave.
 */
class LiveCompetitionsStudentInvitePreviewTest extends TestCase
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

    public function test_pending_lobby_active_returns_200_can_join(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->actingStudent(21);

        $beforeInvites = LiveGameSessionInvite::count();
        $beforePlayers = LiveGameSessionPlayer::count();
        $beforeSessions = LiveGameSession::count();
        $inviteRow = LiveGameSessionInvite::query()->where('student_id', 21)->first();
        $inviteUpdatedAt = (string) $inviteRow->updated_at;
        $sessionUpdatedAt = (string) LiveGameSession::query()->find($session['id'])->updated_at;

        $response = $this->preview($session['id']);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['status']);
        $preview = $payload['preview'];
        $this->assertFalse($preview['joined']);
        $this->assertTrue($preview['can_join']);
        $this->assertNull($preview['block_reason']);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $preview['session']['status']);
        $this->assertSame('classic', $preview['session']['theme']);
        $this->assertSame('Entitled Classic', $preview['session']['game_name']);
        $this->assertSame(1, $preview['session']['question_total']);
        $this->assertSame('Comprehension', $preview['session']['goal_label']);
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, $preview['invite']['status']);
        $this->assertArrayNotHasKey('id', $preview['invite']);
        $this->assertArrayNotHasKey('class_id', $preview['session']);
        $this->assertArrayNotHasKey('live_game_id', $preview['session']);
        $this->assertSafePreview($payload);

        $this->assertSame($beforeInvites, LiveGameSessionInvite::count());
        $this->assertSame($beforePlayers, LiveGameSessionPlayer::count());
        $this->assertSame($beforeSessions, LiveGameSession::count());
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(
            LiveGameSessionInvite::STATUS_PENDING,
            LiveGameSessionInvite::query()->where('student_id', 21)->first()->status
        );
        $this->assertSame(
            $inviteUpdatedAt,
            (string) LiveGameSessionInvite::query()->where('student_id', 21)->first()->updated_at
        );
        $this->assertSame(
            $sessionUpdatedAt,
            (string) LiveGameSession::query()->find($session['id'])->updated_at
        );
    }

    public function test_no_invitation_returns_404(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSessionInvite::query()->delete();
        $this->actingStudent(21);

        $response = $this->preview($session['id']);
        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame('Invitation not found.', $response->getData(true)['msg']);
        $this->assertSame(0, LiveGameSessionPlayer::count());
    }

    public function test_foreign_invitation_returns_404(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->insertStudent(22, 1, 5, '1', 'Other');
        $this->actingStudent(22);

        $response = $this->preview($session['id']);
        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame('Invitation not found.', $response->getData(true)['msg']);
        $this->assertSame(
            LiveGameSessionInvite::STATUS_PENDING,
            LiveGameSessionInvite::query()->where('student_id', 21)->first()->status
        );
    }

    public function test_revoked_invitation_returns_422(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSessionInvite::query()->update([
            'status' => LiveGameSessionInvite::STATUS_REVOKED,
            'revoked_at' => now(),
        ]);
        $this->actingStudent(21);

        $response = $this->preview($session['id']);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame('Invitation is not pending.', $response->getData(true)['msg']);
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(LiveGameSessionInvite::STATUS_REVOKED, LiveGameSessionInvite::first()->status);
    }

    public function test_expired_pending_returns_422_without_mutating_status(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSessionInvite::query()->update([
            'expires_at' => now()->subMinute(),
        ]);
        $this->actingStudent(21);

        $response = $this->preview($session['id']);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame('Invitation has expired.', $response->getData(true)['msg']);
        $invite = LiveGameSessionInvite::first();
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, $invite->status);
        $this->assertNotSame(LiveGameSessionInvite::STATUS_EXPIRED, $invite->status);
        $this->assertSame(0, LiveGameSessionPlayer::count());
    }

    public function test_inactive_or_wrong_class_returns_422(): void
    {
        $session = $this->openLobbyWithStudents([21, 22]);
        Student::query()->where('id', 21)->update(['status' => '0']);
        Student::query()->where('id', 22)->update(['class_id' => 2]);

        $this->actingStudent(21);
        $inactive = $this->preview($session['id']);
        $this->assertSame(422, $inactive->getStatusCode());
        $this->assertSame(
            'You are not an active member of this class.',
            $inactive->getData(true)['msg']
        );

        $this->actingStudent(22);
        $moved = $this->preview($session['id']);
        $this->assertSame(422, $moved->getStatusCode());
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(2, LiveGameSessionInvite::query()
            ->where('status', LiveGameSessionInvite::STATUS_PENDING)
            ->count());
    }

    public function test_pending_playing_session_returns_200_cannot_join(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_PLAYING,
        ]);
        $this->actingStudent(21);

        $response = $this->preview($session['id']);
        $payload = $response->getData(true)['preview'];

        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($payload['joined']);
        $this->assertFalse($payload['can_join']);
        $this->assertSame('session_not_joinable', $payload['block_reason']);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, $payload['session']['status']);
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSafePreview($response->getData(true));
    }

    public function test_pending_ended_session_returns_200_cannot_join(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_ENDED,
        ]);
        $this->actingStudent(21);

        $response = $this->preview($session['id']);
        $payload = $response->getData(true)['preview'];

        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($payload['joined']);
        $this->assertFalse($payload['can_join']);
        $this->assertSame('session_not_joinable', $payload['block_reason']);
        $this->assertSame(LiveGameSession::STATUS_ENDED, $payload['session']['status']);
        $this->assertSame(0, LiveGameSessionPlayer::count());
    }

    public function test_accepted_with_player_returns_joined_true(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->actingStudent(21);
        $this->assertSame(201, $this->join($session['id'])->getStatusCode());

        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_PLAYING,
        ]);

        $playersBefore = LiveGameSessionPlayer::count();
        $response = $this->preview($session['id']);
        $payload = $response->getData(true)['preview'];

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['joined']);
        $this->assertFalse($payload['can_join']);
        $this->assertSame('invitation_already_accepted', $payload['block_reason']);
        $this->assertSame(LiveGameSessionInvite::STATUS_ACCEPTED, $payload['invite']['status']);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, $payload['session']['status']);
        $this->assertSame($playersBefore, LiveGameSessionPlayer::count());
        $this->assertSafePreview($response->getData(true));
    }

    public function test_accepted_without_player_in_lobby_returns_can_join_true(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSessionInvite::query()->where('student_id', 21)->update([
            'status' => LiveGameSessionInvite::STATUS_ACCEPTED,
            'accepted_at' => now(),
        ]);
        $this->actingStudent(21);

        $playersBefore = LiveGameSessionPlayer::count();
        $inviteUpdatedAt = (string) LiveGameSessionInvite::query()->where('student_id', 21)->first()->updated_at;

        $response = $this->preview($session['id']);
        $payload = $response->getData(true)['preview'];

        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($payload['joined']);
        $this->assertTrue($payload['can_join']);
        $this->assertNull($payload['block_reason']);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $payload['session']['status']);
        $this->assertSame($playersBefore, LiveGameSessionPlayer::count());
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(
            $inviteUpdatedAt,
            (string) LiveGameSessionInvite::query()->where('student_id', 21)->first()->updated_at
        );

        // Join repair path still succeeds; Preview did not create the player.
        $this->assertSame(201, $this->join($session['id'])->getStatusCode());
        $this->assertSame(1, LiveGameSessionPlayer::count());
    }

    public function test_accepted_without_player_playing_or_ended_cannot_join(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSessionInvite::query()->where('student_id', 21)->update([
            'status' => LiveGameSessionInvite::STATUS_ACCEPTED,
            'accepted_at' => now(),
        ]);

        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_PLAYING,
        ]);
        $this->actingStudent(21);
        $playing = $this->preview($session['id'])->getData(true)['preview'];
        $this->assertFalse($playing['joined']);
        $this->assertFalse($playing['can_join']);
        $this->assertSame('session_not_joinable', $playing['block_reason']);
        $this->assertSame(0, LiveGameSessionPlayer::count());

        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_ENDED,
        ]);
        $ended = $this->preview($session['id'])->getData(true)['preview'];
        $this->assertFalse($ended['joined']);
        $this->assertFalse($ended['can_join']);
        $this->assertSame('session_not_joinable', $ended['block_reason']);
        $this->assertSame(0, LiveGameSessionPlayer::count());
    }

    public function test_accepted_player_preview_ignores_invite_expiry(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->actingStudent(21);
        $this->assertSame(201, $this->join($session['id'])->getStatusCode());
        LiveGameSessionInvite::query()->where('student_id', 21)->update([
            'expires_at' => now()->subHour(),
        ]);

        $response = $this->preview($session['id']);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($response->getData(true)['preview']['joined']);
        $this->assertFalse($response->getData(true)['preview']['can_join']);
    }

    public function test_unauthenticated_preview_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->getJson('/api/student/live-competitions/sessions/1/preview');

        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_disabled_flag_blocks_preview_middleware(): void
    {
        $previous = config('live_competitions.enabled');
        config(['live_competitions.enabled' => false]);
        try {
            $response = (new EnsureLiveCompetitionsEnabled())->handle(
                Request::create('/api/student/live-competitions/sessions/1/preview', 'GET'),
                function () {
                    return response('ok', 200);
                }
            );
            $this->assertSame(404, $response->getStatusCode());
            $this->assertSame('Live competitions are disabled.', $response->getData(true)['msg']);
        } finally {
            config(['live_competitions.enabled' => $previous]);
        }
    }

    public function test_preview_route_is_flagged_student_get(): void
    {
        $route = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/student/live-competitions/sessions/{id}/preview'
                && in_array('GET', $route->methods(), true);
        });
        $this->assertNotNull($route);
        $middleware = $route->gatherMiddleware();
        $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
        $this->assertContains('checkStudentToken:user-api', $middleware);
        $this->assertContains('checkSecretApi', $middleware);
        $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
    }

    private function assertSafePreview(array $payload): void
    {
        $encoded = json_encode($payload);
        $this->assertStringNotContainsString('correct_answer', $encoded);
        $this->assertStringNotContainsString('hack_password', $encoded);
        $this->assertStringNotContainsString('"code"', $encoded);
        $this->assertStringNotContainsString('"questions"', $encoded);
        $this->assertStringNotContainsString('"choices"', $encoded);
        $this->assertStringNotContainsString('"players"', $encoded);
        $this->assertStringNotContainsString('"report"', $encoded);
        $this->assertStringNotContainsString('reward_pending', $encoded);
        $this->assertStringNotContainsString('Wood', $encoded);
    }

    private function preview($sessionId)
    {
        Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/preview',
            'GET'
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->preview($sessionId);
    }

    private function join($sessionId, array $extra = [])
    {
        Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/join',
            'POST',
            $extra
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->join($sessionId);
    }

    /**
     * @param  int[]  $studentIds
     * @return array<string,mixed>
     */
    private function openLobbyWithStudents(array $studentIds): array
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        foreach ($studentIds as $id) {
            $this->insertStudent($id, 1, 5, '1', 'Student '.$id);
        }
        $game = $this->publishedEntitledGame(5);

        return $this->app->make(LiveCompetitionSessionService::class)
            ->createLobbySession($teacher->id, $game->id, 1, [5]);
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

    private function publishedEntitledGame(int $schoolId): LiveGame
    {
        $game = LiveGame::create([
            'name' => 'Entitled Classic',
            'time' => '10:00',
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
