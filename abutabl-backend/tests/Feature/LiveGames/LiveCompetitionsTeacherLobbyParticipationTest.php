<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\AdminControllers\LiveCompetitionsTeacherController;
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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * F.1.1 — lobby participation visibility (invite_status / joined).
 * sqlite :memory: only. No migrations run against shared DBs.
 */
class LiveCompetitionsTeacherLobbyParticipationTest extends TestCase
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
    }

    protected function tearDown(): void
    {
        config(['database.default' => $this->previousDefault]);
        DB::purge('live_competitions_test');
        parent::tearDown();
    }

    public function test_pending_invite_without_player_is_not_joined(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Sara');
        $session = $this->createLobby($teacher->id, 1, 5);

        $invite = LiveGameSessionInvite::query()
            ->where('live_game_session_id', $session['id'])
            ->where('student_id', 21)
            ->first();
        $this->assertNotNull($invite);
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, $invite->status);
        $this->assertSame(0, LiveGameSessionPlayer::query()->where('live_game_session_id', $session['id'])->count());

        $row = $this->studentRow($session['id'], 21);
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, $row['invite_status']);
        $this->assertFalse($row['joined']);
        $this->assertNull($row['accepted_at']);
    }

    public function test_accepted_invite_with_player_is_joined(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Sara');
        $session = $this->createLobby($teacher->id, 1, 5);

        $this->app->make(LiveCompetitionSessionService::class)
            ->joinLobbySession(21, (int) $session['id']);

        $row = $this->studentRow($session['id'], 21);
        $this->assertSame(LiveGameSessionInvite::STATUS_ACCEPTED, $row['invite_status']);
        $this->assertTrue($row['joined']);
        $this->assertNotNull($row['accepted_at']);
    }

    public function test_accepted_invite_without_player_does_not_imply_joined(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Sara');
        $session = $this->createLobby($teacher->id, 1, 5);

        LiveGameSessionInvite::query()
            ->where('live_game_session_id', $session['id'])
            ->where('student_id', 21)
            ->update([
                'status' => LiveGameSessionInvite::STATUS_ACCEPTED,
                'accepted_at' => now(),
            ]);

        $this->assertSame(0, LiveGameSessionPlayer::query()
            ->where('live_game_session_id', $session['id'])
            ->where('student_id', 21)
            ->count());

        $row = $this->studentRow($session['id'], 21);
        $this->assertSame(LiveGameSessionInvite::STATUS_ACCEPTED, $row['invite_status']);
        $this->assertFalse($row['joined']);
        $this->assertNotNull($row['accepted_at']);
    }

    public function test_player_row_for_another_session_does_not_imply_joined(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->assignClass($teacher->id, 2, 5);
        $this->insertStudent(21, 1, 5, '1', 'Sara');
        $this->insertStudent(22, 2, 5, '1', 'Omar');

        $sessionA = $this->createLobby($teacher->id, 1, 5);
        LiveGameSession::query()->where('id', $sessionA['id'])->update([
            'status' => LiveGameSession::STATUS_ENDED,
        ]);
        $sessionB = $this->createLobby($teacher->id, 1, 5);

        LiveGameSessionPlayer::create([
            'live_game_session_id' => $sessionA['id'],
            'student_id' => 21,
        ]);

        $row = $this->studentRow($sessionB['id'], 21);
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, $row['invite_status']);
        $this->assertFalse($row['joined']);
    }

    public function test_eligible_filtering_and_legacy_fields_remain(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $inClass = $this->insertStudent(21, 1, 5, '1', 'In Class');
        $this->insertStudent(22, 2, 5, '1', 'Other Class');
        $this->insertStudent(23, 1, 5, '0', 'Inactive');
        $session = $this->createLobby($teacher->id, 1, 5);

        $response = $this->controller()->sessionStudents($session['id']);
        $payload = $response->getData(true);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(1, $payload['students']);
        $student = $payload['students'][0];
        $this->assertSame($inClass->id, $student['id']);
        $this->assertArrayHasKey('name', $student);
        $this->assertArrayHasKey('class_id', $student);
        $this->assertArrayHasKey('invite_status', $student);
        $this->assertArrayHasKey('joined', $student);
        $this->assertArrayHasKey('accepted_at', $student);
        $this->assertSame(LiveGameSessionInvite::STATUS_PENDING, $student['invite_status']);
        $this->assertFalse($student['joined']);
        $this->assertArrayNotHasKey('correct_answer', $student);
    }

    public function test_lobby_includes_participation_totals_and_keeps_structure(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Sara');
        $this->insertStudent(22, 1, 5, '1', 'Omar');
        $session = $this->createLobby($teacher->id, 1, 5);

        $this->app->make(LiveCompetitionSessionService::class)
            ->joinLobbySession(21, (int) $session['id']);

        $response = $this->controller()->showSession($session['id']);
        $payload = $response->getData(true);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertArrayHasKey('lobby', $payload);
        $this->assertArrayHasKey('session', $payload['lobby']);
        $this->assertArrayHasKey('eligible_students', $payload['lobby']);
        $this->assertSame(2, (int) $payload['lobby']['invited_total']);
        $this->assertSame(1, (int) $payload['lobby']['joined_total']);
        $this->assertSame(1, (int) $payload['lobby']['pending_total']);
        $this->assertArrayNotHasKey('questions', $payload['lobby']);
    }

    public function test_teacher_cannot_view_another_class_session_participation(): void
    {
        $owner = $this->actingTeacher(10);
        $this->assignClass($owner->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Sara');
        $session = $this->createLobby($owner->id, 1, 5);

        $stranger = $this->actingTeacher(11);
        $this->assignClass($stranger->id, 2, 5);

        $this->assertSame(403, $this->controller()->showSession($session['id'])->getStatusCode());
        $this->assertSame(403, $this->controller()->sessionStudents($session['id'])->getStatusCode());
    }

    public function test_inactive_invited_student_absent_from_list_but_counted_in_totals(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'Active');
        $inactive = $this->insertStudent(23, 1, 5, '1', 'Will Inactivate');
        $session = $this->createLobby($teacher->id, 1, 5);

        Student::query()->where('id', $inactive->id)->update(['status' => '0']);

        $payload = $this->controller()->showSession($session['id'])->getData(true);
        $ids = array_column($payload['lobby']['eligible_students'], 'id');
        $this->assertSame([21], $ids);
        $this->assertSame(2, (int) $payload['lobby']['invited_total']);
        $this->assertSame(2, (int) $payload['lobby']['pending_total']);
        $this->assertSame(0, (int) $payload['lobby']['joined_total']);
    }

    private function studentRow(int $sessionId, int $studentId): array
    {
        $payload = $this->controller()->sessionStudents($sessionId)->getData(true);
        foreach ($payload['students'] as $row) {
            if ((int) $row['id'] === $studentId) {
                return $row;
            }
        }
        $this->fail('Student '.$studentId.' missing from eligible list');
    }

    private function controller(): LiveCompetitionsTeacherController
    {
        return $this->app->make(LiveCompetitionsTeacherController::class);
    }

    private function createLobby(int $teacherId, int $classId, int $schoolId): array
    {
        $game = $this->publishedEntitledGame($schoolId);

        return $this->app->make(LiveCompetitionSessionService::class)
            ->createLobbySession($teacherId, $game->id, $classId, [$schoolId]);
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
            'explanation' => 'Fuel',
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
        Schema::create('live_game_session_players', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('coins')->default(0);
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
