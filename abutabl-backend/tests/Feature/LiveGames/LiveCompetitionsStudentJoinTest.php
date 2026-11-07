<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\StudentControllers\LiveCompetitionsStudentController;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionInvite;
use App\Models\LiveGameSessionPlayer;
use App\Models\LiveGameSessionQuestion;
use App\Models\Notification;
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
 * Slice C.4C — student Join. sqlite :memory: only; no migrate, no onesave.
 *
 * SQLite does not honor MySQL FOR UPDATE row locks, so these tests cannot
 * prove real Join-vs-Begin or concurrent-Join lock ordering. They prove
 * status checks, unique-player idempotency, and transaction rollback.
 */
class LiveCompetitionsStudentJoinTest extends TestCase
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

    public function test_valid_join_returns_201_and_creates_one_player(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->actingStudent(21);

        $response = $this->join($session['id']);
        $payload = $response->getData(true);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertTrue($payload['status']);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $payload['join']['session']['status']);
        $this->assertSame($session['id'], $payload['join']['session']['id']);
        $this->assertSame(LiveGameSessionInvite::STATUS_ACCEPTED, $payload['join']['invite']['status']);
        $this->assertNotNull($payload['join']['invite']['accepted_at']);
        $this->assertSame(21, $payload['join']['player']['student_id']);
        $this->assertSame(1, LiveGameSessionPlayer::count());
        $this->assertSame(LiveGameSessionInvite::STATUS_ACCEPTED, LiveGameSessionInvite::first()->status);
        $this->assertArrayNotHasKey('questions', $payload['join']);
        $this->assertArrayNotHasKey('code', $payload['join']['session']);
        $encoded = json_encode($payload);
        $this->assertStringNotContainsString('correct_answer', $encoded);
        $this->assertStringNotContainsString('hack_password', $encoded);
        $this->assertStringNotContainsString('Wood', $encoded);
    }

    public function test_unauthenticated_join_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->postJson('/api/student/live-competitions/sessions/1/join');

        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
        $this->assertSame(0, LiveGameSessionPlayer::count());
    }

    public function test_client_supplied_student_id_is_ignored(): void
    {
        $session = $this->openLobbyWithStudents([21, 22]);
        $this->actingStudent(21);

        $response = $this->join($session['id'], ['student_id' => 22, 'student_ids' => [22]]);
        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame(1, LiveGameSessionPlayer::count());
        $this->assertSame(21, (int) LiveGameSessionPlayer::first()->student_id);
        $this->assertSame(21, (int) $response->getData(true)['join']['player']['student_id']);
    }

    public function test_foreign_invitation_returns_404(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->insertStudent(22, 1, 5, '1', 'Other');
        $this->actingStudent(22);

        $response = $this->join($session['id']);
        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, LiveGameSessionInvite::first()->status);
    }

    public function test_missing_invitation_returns_404(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSessionInvite::query()->delete();
        $this->actingStudent(21);

        $response = $this->join($session['id']);
        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionPlayer::count());
    }

    public function test_missing_session_returns_404(): void
    {
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $this->actingStudent(21);

        $response = $this->join(999);
        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionPlayer::count());
    }

    public function test_revoked_invitation_returns_422(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSessionInvite::query()->update([
            'status' => LiveGameSessionInvite::STATUS_REVOKED,
            'revoked_at' => now(),
        ]);
        $this->actingStudent(21);

        $response = $this->join($session['id']);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(LiveGameSessionInvite::STATUS_REVOKED, LiveGameSessionInvite::first()->status);
    }

    public function test_expired_timestamp_returns_422_without_stamping_expired(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGameSessionInvite::query()->update([
            'expires_at' => now()->subMinute(),
        ]);
        $this->actingStudent(21);

        $response = $this->join($session['id']);
        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, LiveGameSessionInvite::first()->status);
        $this->assertNotSame(LiveGameSessionInvite::STATUS_EXPIRED, LiveGameSessionInvite::first()->status);
    }

    public function test_inactive_or_wrong_class_membership_returns_422(): void
    {
        $session = $this->openLobbyWithStudents([21, 22]);
        Student::query()->where('id', 21)->update(['status' => '0']);
        Student::query()->where('id', 22)->update(['class_id' => 2]);

        $this->actingStudent(21);
        $inactive = $this->join($session['id']);
        $this->assertSame(422, $inactive->getStatusCode());

        $this->actingStudent(22);
        $moved = $this->join($session['id']);
        $this->assertSame(422, $moved->getStatusCode());
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(2, LiveGameSessionInvite::query()
            ->where('status', LiveGameSessionInvite::STATUS_PENDING)
            ->count());
    }

    public function test_repeated_join_returns_200_with_exactly_one_player(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->actingStudent(21);

        $first = $this->join($session['id']);
        $second = $this->join($session['id']);

        $this->assertSame(201, $first->getStatusCode());
        $this->assertSame(200, $second->getStatusCode());
        $this->assertSame(1, LiveGameSessionPlayer::count());
        $this->assertSame(
            $first->getData(true)['join']['player']['id'],
            $second->getData(true)['join']['player']['id']
        );
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $second->getData(true)['join']['session']['status']);
    }

    public function test_accepted_player_can_confirm_join_after_session_is_playing(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->actingStudent(21);
        $this->assertSame(201, $this->join($session['id'])->getStatusCode());

        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_PLAYING,
        ]);

        $confirm = $this->join($session['id']);
        $this->assertSame(200, $confirm->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_PLAYING, $confirm->getData(true)['join']['session']['status']);
        $this->assertSame(1, LiveGameSessionPlayer::count());
    }

    public function test_new_join_after_session_is_playing_returns_409(): void
    {
        $session = $this->openLobbyWithStudents([21, 22]);
        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_PLAYING,
        ]);
        $this->actingStudent(21);

        $response = $this->join($session['id']);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, LiveGameSessionInvite::query()
            ->where('student_id', 21)
            ->first()
            ->status);
    }

    public function test_player_insert_failure_rolls_back_invitation(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->actingStudent(21);

        LiveGameSessionPlayer::creating(function () {
            throw new \RuntimeException('forced player failure');
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->joinLobbySession(21, (int) $session['id']);
            $this->fail('Expected player failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced player failure', $ex->getMessage());
        } finally {
            LiveGameSessionPlayer::flushEventListeners();
        }

        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, LiveGameSessionInvite::first()->status);
        $this->assertNull(LiveGameSessionInvite::first()->accepted_at);
        $this->assertSame(1, LiveGameSession::count());
    }

    public function test_invitation_update_failure_rolls_back_player_creation(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        $this->actingStudent(21);

        LiveGameSessionInvite::updating(function () {
            throw new \RuntimeException('forced invite update failure');
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->joinLobbySession(21, (int) $session['id']);
            $this->fail('Expected invite update failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced invite update failure', $ex->getMessage());
        } finally {
            LiveGameSessionInvite::flushEventListeners();
        }

        $this->assertSame(0, LiveGameSessionPlayer::count());
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, LiveGameSessionInvite::first()->status);
        $this->assertNull(LiveGameSessionInvite::first()->accepted_at);
    }

    public function test_pending_invitation_notification_retry_still_works(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        Notification::query()->delete();

        $this->app->make(LiveCompetitionSessionService::class)
            ->deliverSessionInviteNotifications((int) $session['id'], 'Entitled Classic');

        $this->assertSame(1, Notification::count());
        $this->assertSame(
            (int) LiveGameSessionInvite::first()->id,
            (int) Notification::first()->type_id
        );
        $this->assertSame(LiveGameSessionInvite::NOTIFICATION_TYPE, Notification::first()->type);
        $this->assertSame('/live-games/sessions/'.$session['id'], Notification::first()->url);
    }

    public function test_non_pending_invitations_are_skipped_by_notification_retry(): void
    {
        $session = $this->openLobbyWithStudents([21, 22, 23]);
        $pending = LiveGameSessionInvite::query()->where('student_id', 21)->first();
        $accepted = LiveGameSessionInvite::query()->where('student_id', 22)->first();
        $revoked = LiveGameSessionInvite::query()->where('student_id', 23)->first();

        $accepted->status = LiveGameSessionInvite::STATUS_ACCEPTED;
        $accepted->accepted_at = now();
        $accepted->save();
        $revoked->status = LiveGameSessionInvite::STATUS_REVOKED;
        $revoked->revoked_at = now();
        $revoked->save();

        Notification::query()->delete();
        $this->app->make(LiveCompetitionSessionService::class)
            ->deliverSessionInviteNotifications((int) $session['id'], 'Entitled Classic');

        $this->assertSame(1, Notification::count());
        $this->assertSame((int) $pending->id, (int) Notification::first()->type_id);
        $this->assertSame(21, (int) Notification::first()->to_user_id);
        $this->assertSame(0, Notification::query()->where('type_id', $accepted->id)->count());
        $this->assertSame(0, Notification::query()->where('type_id', $revoked->id)->count());
    }

    public function test_join_route_is_flagged_student_post(): void
    {
        $route = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/student/live-competitions/sessions/{id}/join'
                && in_array('POST', $route->methods(), true);
        });
        $this->assertNotNull($route);
        $middleware = $route->gatherMiddleware();
        $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
        $this->assertContains('checkStudentToken:user-api', $middleware);
        $this->assertContains('checkSecretApi', $middleware);
        $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
        $this->assertNotContains('checkUserToken:admin-api', $middleware);
    }

    public function test_unpublished_catalog_game_does_not_block_existing_lobby_join(): void
    {
        $session = $this->openLobbyWithStudents([21]);
        LiveGame::query()->update(['status' => LiveGame::STATUS_UNPUBLISHED]);
        $this->actingStudent(21);

        $response = $this->join($session['id']);
        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame(1, LiveGameSessionPlayer::count());
    }

    private function join($sessionId, array $extra = [])
    {
        $request = Request::create(
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
