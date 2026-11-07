<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\AdminControllers\LiveCompetitionsTeacherController;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionInvite;
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
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.4B — automatic invitations + inbox notifications on session create.
 * sqlite :memory: only; no migrate, no onesave.
 */
class LiveCompetitionsTeacherInviteTest extends TestCase
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

    public function test_session_create_invites_all_active_class_students(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active A');
        $this->insertStudent(22, 1, 5, '1', 'Active B');
        $game = $this->publishedEntitledGame(5);

        $response = $this->storeSession($game->id, 1);
        $sessionId = (int) $response->getData(true)['session']['id'];

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame(1, LiveGameSession::count());
        $this->assertSame(2, LiveGameSessionInvite::count());
        $this->assertEqualsCanonicalizing(
            [21, 22],
            LiveGameSessionInvite::query()->pluck('student_id')->map(function ($id) {
                return (int) $id;
            })->all()
        );
        $this->assertSame(2, Notification::query()
            ->where('type', LiveGameSessionInvite::NOTIFICATION_TYPE)
            ->where('to_user_type', 'student')
            ->count());
        $this->assertSame($sessionId, (int) LiveGameSession::first()->id);
    }

    public function test_inactive_and_non_member_students_are_not_invited(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $this->insertStudent(22, 1, 5, '0', 'Inactive');
        $this->insertStudent(23, 2, 5, '1', 'Other class');
        $game = $this->publishedEntitledGame(5);

        $this->storeSession($game->id, 1);

        $this->assertSame(1, LiveGameSessionInvite::count());
        $this->assertSame(21, (int) LiveGameSessionInvite::first()->student_id);
        $this->assertSame(1, Notification::count());
        $this->assertSame(21, (int) Notification::first()->to_user_id);
    }

    public function test_client_supplied_student_ids_do_not_change_recipients(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $this->insertStudent(99, 2, 5, '1', 'Injected');
        $game = $this->publishedEntitledGame(5);

        $this->storeSession($game->id, 1, [
            'student_ids' => [99, 21],
            'student_id' => 99,
        ]);

        $this->assertSame(1, LiveGameSessionInvite::count());
        $this->assertSame(21, (int) LiveGameSessionInvite::first()->student_id);
        $this->assertSame(0, LiveGameSessionInvite::query()->where('student_id', 99)->count());
    }

    public function test_empty_active_class_creates_session_with_zero_invitations(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(22, 1, 5, '0', 'Inactive');
        $game = $this->publishedEntitledGame(5);

        $response = $this->storeSession($game->id, 1);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame(1, LiveGameSession::count());
        $this->assertSame(1, LiveGameSessionQuestion::count());
        $this->assertSame(0, LiveGameSessionInvite::count());
        $this->assertSame(0, Notification::count());
        $this->assertArrayNotHasKey('questions', $response->getData(true)['session']);
    }

    public function test_invitation_persistence_failure_rolls_back_session_and_snapshots(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $game = $this->publishedEntitledGame(5);

        LiveGameSessionInvite::creating(function () {
            throw new \RuntimeException('forced invite failure');
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->createLobbySession($teacher->id, $game->id, 1, [5]);
            $this->fail('Expected invite failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced invite failure', $ex->getMessage());
        } finally {
            LiveGameSessionInvite::flushEventListeners();
        }

        $this->assertSame(0, LiveGameSession::count());
        $this->assertSame(0, LiveGameSessionQuestion::count());
        $this->assertSame(0, LiveGameSessionInvite::count());
        $this->assertSame(0, Notification::count());
    }

    public function test_invitation_fields_match_pending_host_and_null_expiry(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $game = $this->publishedEntitledGame(5);
        $before = now()->subSecond();

        $this->storeSession($game->id, 1);
        $invite = LiveGameSessionInvite::first();
        $after = now()->addSecond();

        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, $invite->status);
        $this->assertSame($teacher->id, (int) $invite->invited_by);
        $this->assertNull($invite->expires_at);
        $this->assertNull($invite->accepted_at);
        $this->assertNull($invite->revoked_at);
        $this->assertNotNull($invite->invited_at);
        $this->assertTrue($invite->invited_at->greaterThanOrEqualTo($before));
        $this->assertTrue($invite->invited_at->lessThanOrEqualTo($after));
        $this->assertSame((int) LiveGameSession::first()->id, (int) $invite->live_game_session_id);
    }

    public function test_inbox_notification_uses_approved_type_recipient_sender_and_url(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $game = $this->publishedEntitledGame(5);

        $sessionId = (int) $this->storeSession($game->id, 1)->getData(true)['session']['id'];
        $invite = LiveGameSessionInvite::first();
        $row = Notification::first();

        $this->assertSame(LiveGameSessionInvite::NOTIFICATION_TYPE, $row->type);
        $this->assertSame((int) $invite->id, (int) $row->type_id);
        $this->assertSame('student', $row->to_user_type);
        $this->assertSame(21, (int) $row->to_user_id);
        $this->assertSame('teacher', $row->from_user_type);
        $this->assertSame($teacher->id, (int) $row->from_user_id);
        $this->assertSame('/live-games/sessions/'.$sessionId, $row->url);
        $this->assertStringNotContainsString('/games/', (string) $row->url);
        $this->assertSame(0, (int) $row->is_read);
    }

    public function test_notification_failure_does_not_roll_back_invitations_or_session(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $game = $this->publishedEntitledGame(5);

        Notification::creating(function () {
            throw new \RuntimeException('forced inbox failure');
        });

        try {
            $response = $this->storeSession($game->id, 1);
        } finally {
            Notification::flushEventListeners();
        }

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame(1, LiveGameSession::count());
        $this->assertSame(1, LiveGameSessionQuestion::count());
        $this->assertSame(1, LiveGameSessionInvite::count());
        $this->assertSame(0, Notification::count());
        $this->assertSame(LiveGameSession::STATUS_LOBBY, LiveGameSession::first()->status);
    }

    public function test_retrying_notification_delivery_does_not_duplicate_inbox_rows(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $this->insertStudent(22, 1, 5, '1', 'Active B');
        $game = $this->publishedEntitledGame(5);

        $sessionId = (int) $this->storeSession($game->id, 1)->getData(true)['session']['id'];
        $this->assertSame(2, Notification::count());

        $this->app->make(LiveCompetitionSessionService::class)
            ->deliverSessionInviteNotifications($sessionId, $game->name);
        $this->app->make(LiveCompetitionSessionService::class)
            ->deliverSessionInviteNotifications($sessionId);

        $this->assertSame(2, Notification::count());
        $this->assertSame(2, LiveGameSessionInvite::count());
        $this->assertCount(2, Notification::query()
            ->where('type', LiveGameSessionInvite::NOTIFICATION_TYPE)
            ->pluck('type_id')
            ->unique()
            ->all());
    }

    public function test_existing_authorization_and_payload_shape_are_unchanged(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $game = $this->publishedEntitledGame(5);

        $other = $this->actingTeacher(11);
        $this->assignClass($other->id, 2, 5);
        $this->actingTeacher(10);
        $denied = $this->storeSession($game->id, 2);
        $this->assertSame(403, $denied->getStatusCode());
        $this->assertSame(0, LiveGameSession::count());

        $this->actingTeacher(10);
        $ok = $this->storeSession($game->id, 1, ['school_id' => 99]);
        $payload = $ok->getData(true);

        $this->assertSame(201, $ok->getStatusCode());
        $this->assertSame(5, $payload['session']['school_id']);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $payload['session']['status']);
        $this->assertArrayNotHasKey('questions', $payload['session']);
        $this->assertArrayNotHasKey('invites', $payload['session']);
        $this->assertSame(1, $payload['session']['questions_count']);

        $this->actingTeacher(11);
        $this->assignClass(11, 2, 5);
        $foreign = $this->storeSession($game->id, 1);
        $this->assertSame(403, $foreign->getStatusCode());
        $this->assertSame(1, LiveGameSession::count());
    }

    private function storeSession(int $gameId, int $classId, array $extra = [])
    {
        $request = Request::create('/api/live-competitions/sessions', 'POST', array_merge([
            'live_game_id' => $gameId,
            'class_id' => $classId,
        ], $extra));

        return $this->app->make(LiveCompetitionsTeacherController::class)->storeSession($request);
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
