<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\AdminControllers\LiveCompetitionsTeacherController;
use App\Models\Classes;
use App\Models\Grades;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.3 — teacher lobby reads. sqlite :memory: only.
 * Student Join is registered at POST /api/student/live-competitions/sessions/{id}/join.
 */
class LiveCompetitionsTeacherLobbyTest extends TestCase
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
        Grades::create(['id' => 1, 'name' => 'Grade 1', 'name_en' => 'Grade 1', 'name_ar' => 'Grade 1']);
        Schools::create(['id' => 5, 'name' => 'School Five']);
        Schools::create(['id' => 99, 'name' => 'School Other']);
    }

    protected function tearDown(): void
    {
        config(['database.default' => $this->previousDefault]);
        DB::purge('live_competitions_test');
        parent::tearDown();
    }

    public function test_teacher_lists_only_lobby_sessions_for_assigned_classes(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $other = $this->actingTeacher(11);
        $this->assignClass($other->id, 2, 5);
        $this->actingTeacher(10);

        $own = $this->createLobby($teacher->id, 1, 5);
        $this->createLobby($other->id, 2, 5);

        $response = $this->controller()->indexSessions();
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(1, $payload['sessions']);
        $this->assertSame($own['id'], $payload['sessions'][0]['id']);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $payload['sessions'][0]['status']);
        $this->assertArrayNotHasKey('questions', $payload['sessions'][0]);
    }

    public function test_host_lists_own_lobby_and_playing_for_recovery_without_mutation(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $this->assignClass($teacher->id, 2, 5);

        $lobby = $this->createLobby($teacher->id, 1, 5);
        $playing = $this->createLobby($teacher->id, 2, 5);
        LiveGameSession::query()->where('id', $playing['id'])->update([
            'status' => LiveGameSession::STATUS_PLAYING,
            'started_at' => now(),
            'live_version' => 7,
        ]);
        $versionBefore = (int) LiveGameSession::query()->where('id', $playing['id'])->value('live_version');
        $statusBefore = (string) LiveGameSession::query()->where('id', $playing['id'])->value('status');

        $response = $this->controller()->indexSessions();
        $payload = $response->getData(true);
        $ids = array_column($payload['sessions'], 'id');

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(2, $payload['sessions']);
        $this->assertContains($lobby['id'], $ids);
        $this->assertContains($playing['id'], $ids);

        $playingRow = collect($payload['sessions'])->firstWhere('id', $playing['id']);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, $playingRow['status']);
        $this->assertSame($versionBefore, (int) LiveGameSession::query()->where('id', $playing['id'])->value('live_version'));
        $this->assertSame($statusBefore, (string) LiveGameSession::query()->where('id', $playing['id'])->value('status'));
    }

    public function test_peer_teacher_with_same_class_access_does_not_list_others_session(): void
    {
        $owner = $this->actingTeacher(10);
        $this->assignClass($owner->id, 1, 5);
        $session = $this->createLobby($owner->id, 1, 5);

        $peer = $this->actingTeacher(11);
        $this->assignClass($peer->id, 1, 5);

        $response = $this->controller()->indexSessions();
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(0, $payload['sessions']);
        $this->assertSame(10, (int) LiveGameSession::query()->where('id', $session['id'])->value('host_user_id'));
    }

    public function test_host_who_lost_class_access_does_not_list_session(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $session = $this->createLobby($teacher->id, 1, 5);
        TeachersGrades::query()->where('user_id', 10)->delete();
        $this->actingTeacher(10);

        $response = $this->controller()->indexSessions();
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(0, $payload['sessions']);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, LiveGameSession::query()->where('id', $session['id'])->value('status'));
    }

    public function test_ended_sessions_are_not_listed_for_active_recovery(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $session = $this->createLobby($teacher->id, 1, 5);
        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_ENDED,
        ]);

        $response = $this->controller()->indexSessions();
        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(0, $response->getData(true)['sessions']);
    }

    public function test_teacher_cannot_view_another_teachers_class_session(): void
    {
        $owner = $this->actingTeacher(10);
        $this->assignClass($owner->id, 1, 5);
        $session = $this->createLobby($owner->id, 1, 5);

        $stranger = $this->actingTeacher(11);
        $this->assignClass($stranger->id, 2, 5);

        $response = $this->controller()->showSession($session['id']);
        $this->assertSame(403, $response->getStatusCode());
    }

    public function test_eligible_students_are_only_active_members_of_the_session_class(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $session = $this->createLobby($teacher->id, 1, 5);

        $inClass = $this->insertStudent(21, 1, 5, '1', 'In Class');
        $this->insertStudent(22, 2, 5, '1', 'Other Class');
        $this->insertStudent(23, 1, 5, '0', 'Inactive');

        $response = $this->controller()->sessionStudents($session['id']);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(1, $payload['students']);
        $this->assertSame($inClass->id, $payload['students'][0]['id']);
        $this->assertSame(1, $payload['students'][0]['class_id']);
        $this->assertArrayNotHasKey('correct_answer', $payload['students'][0]);
    }

    public function test_lobby_payload_never_includes_questions_or_answers(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $session = $this->createLobby($teacher->id, 1, 5);
        $this->insertStudent(21, 1, 5, '1', 'In Class');

        $payload = $this->controller()->showSession($session['id'])->getData(true);
        $encoded = json_encode($payload);

        $this->assertArrayHasKey('session', $payload['lobby']);
        $this->assertArrayHasKey('eligible_students', $payload['lobby']);
        $this->assertArrayNotHasKey('questions', $payload['lobby']);
        $this->assertArrayNotHasKey('questions', $payload['lobby']['session']);
        $this->assertStringNotContainsString('correct_answer', $encoded);
        $this->assertStringNotContainsString('Wood', $encoded);
        $this->assertStringNotContainsString('explanation', $encoded);
    }

    public function test_non_lobby_session_rejects_lobby_reads(): void
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, 1, 5);
        $session = $this->createLobby($teacher->id, 1, 5);
        LiveGameSession::query()->where('id', $session['id'])->update([
            'status' => LiveGameSession::STATUS_PLAYING,
        ]);

        $this->assertSame(409, $this->controller()->showSession($session['id'])->getStatusCode());
        $this->assertSame(409, $this->controller()->sessionStudents($session['id'])->getStatusCode());
    }

    public function test_unauthenticated_lobby_request_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->getJson('/api/live-competitions/sessions');

        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_admin_cannot_use_teacher_lobby_endpoints(): void
    {
        $admin = User::create(['id' => 1, 'type' => 'admin', 'name' => 'Admin']);
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($admin);

        $this->assertSame(403, $this->controller()->indexSessions()->getStatusCode());
        $this->assertSame(403, $this->controller()->showSession(1)->getStatusCode());
        $this->assertSame(403, $this->controller()->sessionStudents(1)->getStatusCode());
    }

    public function test_only_the_student_session_join_route_is_registered(): void
    {
        $uris = collect(Route::getRoutes())->map(function ($route) {
            return $route->uri();
        });

        $this->assertTrue($uris->contains('api/student/live-competitions/sessions/{id}/join'));
        $this->assertFalse($uris->contains('api/live-competitions/sessions/{id}/invites'));
        $this->assertFalse($uris->contains('api/live-competitions/sessions/{id}/invite'));
        $this->assertFalse($uris->contains('api/live-competitions/sessions/{id}/join'));
        $this->assertFalse($uris->contains('api/student/live-competitions/sessions'));
        $this->assertFalse($uris->contains('api/student/live-competitions/join'));
        $this->assertFalse(
            $uris->contains(function ($uri) {
                return str_contains($uri, 'live-competitions') && str_contains($uri, 'invite');
            })
        );
        $this->assertFalse(
            $uris->contains(function ($uri) {
                return str_contains($uri, 'live-competitions')
                    && str_contains($uri, 'join')
                    && $uri !== 'api/student/live-competitions/sessions/{id}/join';
            })
        );
    }

    public function test_players_migration_has_no_joined_or_invited_discriminator(): void
    {
        $source = file_get_contents(database_path(
            'migrations/2026_10_29_140007_create_live_game_session_players_table.php'
        ));
        $this->assertNotFalse($source);
        $this->assertStringNotContainsString('joined_at', $source);
        $this->assertStringNotContainsString('invited_at', $source);
        $this->assertStringNotContainsString('invitation', $source);
        $this->assertStringContainsString("unique(['live_game_session_id', 'student_id']", $source);
    }

    public function test_student_live_competitions_join_rejects_unauthenticated_requests(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->postJson('/api/student/live-competitions/sessions/1/join');

        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
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
            Classes::create([
                'id' => $classId,
                'school_id' => $schoolId,
                'grade_id' => 1,
                'name' => 'Class '.$classId,
            ]);
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
            'explanation' => 'Fuel',
            'sort_order' => 1,
        ]);

        return $game->fresh(['questions']);
    }

    private function insertStudent(int $id, int $classId, int $schoolId, string $status, string $name): Student
    {
        if (! Classes::query()->where('id', $classId)->exists()) {
            Classes::create([
                'id' => $classId,
                'school_id' => $schoolId,
                'grade_id' => 1,
                'name' => 'Class '.$classId,
            ]);
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
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('name_en')->nullable();
            $table->string('name_ar')->nullable();
            $table->timestamps();
        });
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('grade_id')->nullable();
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
        // F.1.1 lobby enrichment reads player rows; table must exist in this sqlite fixture.
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
