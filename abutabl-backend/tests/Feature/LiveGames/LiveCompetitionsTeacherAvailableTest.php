<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\AdminControllers\LiveCompetitionsTeacherController;
use App\Http\Middleware\EnsureLiveCompetitionsAdminOnly;
use App\Http\Middleware\EnsureLiveCompetitionsEnabled;
use App\Models\LiveGame;
use App\Models\LiveGameSchool;
use App\Models\SchoolsRoles;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\LiveCompetitions\LiveCompetitionCatalogService;
use App\Support\Ownership\OwnershipGate;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.1 — teacher available catalog. sqlite :memory: only; no migrate, no onesave.
 */
class LiveCompetitionsTeacherAvailableTest extends TestCase
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
    }

    protected function tearDown(): void
    {
        config(['database.default' => $this->previousDefault]);
        DB::purge('live_competitions_test');
        parent::tearDown();
    }

    public function test_published_entitled_game_is_returned_for_the_teacher_school(): void
    {
        $game = $this->insertGame('Entitled Classic', LiveGame::STATUS_PUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 5]);

        $rows = (new LiveCompetitionCatalogService())->availableForSchools([5]);

        $this->assertCount(1, $rows);
        $this->assertSame($game->id, $rows[0]['id']);
        $this->assertTrue($rows[0]['is_published']);
        $this->assertSame([5], $rows[0]['entitled_school_ids']);
        $this->assertTrue($rows[0]['selectable_for_new_competition']);
        $this->assertArrayNotHasKey('school_ids', $rows[0]);
    }

    public function test_unpublished_game_is_hidden_even_when_entitled(): void
    {
        $game = $this->insertGame('Draft', LiveGame::STATUS_UNPUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 5]);

        $this->assertSame([], (new LiveCompetitionCatalogService())->availableForSchools([5]));
    }

    public function test_game_entitled_only_to_another_school_is_hidden(): void
    {
        $game = $this->insertGame('Other school', LiveGame::STATUS_PUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 99]);

        $this->assertSame([], (new LiveCompetitionCatalogService())->availableForSchools([5]));
    }

    public function test_empty_entitlements_are_not_selectable(): void
    {
        $this->insertGame('No schools', LiveGame::STATUS_PUBLISHED);

        $this->assertSame([], (new LiveCompetitionCatalogService())->availableForSchools([5]));
    }

    public function test_teacher_with_no_authorized_school_gets_an_empty_list(): void
    {
        $game = $this->insertGame('Entitled Classic', LiveGame::STATUS_PUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 5]);

        $this->assertSame([], (new LiveCompetitionCatalogService())->availableForSchools([]));
        $this->assertSame([], (new LiveCompetitionCatalogService())->availableForSchools([0]));
    }

    public function test_other_school_ids_are_not_leaked_on_an_entitled_game(): void
    {
        $game = $this->insertGame('Shared', LiveGame::STATUS_PUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 5]);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 99]);

        $rows = (new LiveCompetitionCatalogService())->availableForSchools([5]);

        $this->assertCount(1, $rows);
        $this->assertSame([5], $rows[0]['entitled_school_ids']);
    }

    public function test_available_route_is_flagged_but_not_admin_only(): void
    {
        foreach ([
            'api/live-competitions/available',
            'api/live-competitions/sessions',
            'api/live-competitions/sessions/{id}',
            'api/live-competitions/sessions/{id}/students',
        ] as $uri) {
            $route = collect(Route::getRoutes())->first(function ($route) use ($uri) {
                return $route->uri() === $uri;
            });
            $this->assertNotNull($route, 'Missing '.$uri);
            $middleware = $route->gatherMiddleware();
            $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
            $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
            $this->assertContains('checkUserToken:admin-api', $middleware);
        }
    }

    public function test_admin_management_routes_still_require_admin_middleware(): void
    {
        foreach ([
            'api/live-competitions/template',
            'api/live-competitions/import/preview',
            'api/live-competitions/import/confirm',
            'api/live-competitions/{id}/publish',
            'api/live-competitions/{id}/unpublish',
            'api/live-competitions/{id}/schools',
        ] as $uri) {
            $route = collect(Route::getRoutes())->first(function ($route) use ($uri) {
                return $route->uri() === $uri;
            });
            $this->assertNotNull($route, 'Missing '.$uri);
            $this->assertContains(
                'ensureLiveCompetitionsAdminOnly',
                $route->gatherMiddleware(),
                $uri.' lost admin-only middleware'
            );
        }
    }

    public function test_admin_only_gate_still_rejects_teachers(): void
    {
        $this->assertFalse(OwnershipGate::isAdminUser((object) ['type' => 'teacher']));
        $this->assertTrue(OwnershipGate::isTeacherUser((object) ['type' => 'teacher']));
    }

    public function test_unauthenticated_available_request_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->getJson('/api/live-competitions/available');

        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_disabled_flag_blocks_the_teacher_available_endpoint(): void
    {
        $previous = config('live_competitions.enabled');
        config(['live_competitions.enabled' => false]);
        try {
            $response = (new EnsureLiveCompetitionsEnabled())->handle(
                Request::create('/api/live-competitions/available', 'GET'),
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

    public function test_admin_only_middleware_rejects_a_teacher_user(): void
    {
        $this->actingTeacher(8);

        $response = (new EnsureLiveCompetitionsAdminOnly())->handle(
            Request::create('/api/live-competitions/import/preview', 'POST'),
            function () {
                return response('ok', 200);
            }
        );

        $this->assertSame(403, $response->getStatusCode());
    }

    public function test_teacher_controller_returns_entitled_published_games_for_schools_ids(): void
    {
        $teacher = $this->actingTeacher(10, ['school_id' => null]);
        SchoolsRoles::create(['user_id' => $teacher->id, 'school_id' => 5, 'role_id' => 1, 'status' => 1]);

        $game = $this->insertGame('Entitled Classic', LiveGame::STATUS_PUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 5]);
        $other = $this->insertGame('Other school', LiveGame::STATUS_PUBLISHED);
        LiveGameSchool::create(['live_game_id' => $other->id, 'school_id' => 99]);
        $draft = $this->insertGame('Draft', LiveGame::STATUS_UNPUBLISHED);
        LiveGameSchool::create(['live_game_id' => $draft->id, 'school_id' => 5]);

        $response = $this->teacherAvailable();
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['status']);
        $this->assertCount(1, $payload['games']);
        $this->assertSame($game->id, $payload['games'][0]['id']);
        $this->assertSame([5], $payload['games'][0]['entitled_school_ids']);
    }

    public function test_teacher_controller_uses_teachers_grades_school_scope(): void
    {
        $teacher = $this->actingTeacher(11, ['school_id' => null]);
        TeachersGrades::create([
            'user_id' => $teacher->id,
            'school_id' => 7,
            'grade_id' => 1,
            'class_id' => 1,
            'subject_id' => 1,
            'status' => 1,
        ]);

        $game = $this->insertGame('Grades entitled', LiveGame::STATUS_PUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 7]);

        $payload = $this->teacherAvailable()->getData(true);
        $this->assertCount(1, $payload['games']);
        $this->assertSame($game->id, $payload['games'][0]['id']);
    }

    public function test_teacher_without_authorized_school_gets_empty_games(): void
    {
        $this->actingTeacher(12, ['school_id' => null]);
        $game = $this->insertGame('Entitled Classic', LiveGame::STATUS_PUBLISHED);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => 5]);

        $response = $this->teacherAvailable();
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame([], $response->getData(true)['games']);
    }

    public function test_admin_user_is_rejected_from_teacher_available_action(): void
    {
        $admin = User::create(['id' => 1, 'type' => 'admin', 'name' => 'Admin']);
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($admin);

        $response = $this->app->make(LiveCompetitionsTeacherController::class)
            ->available(Request::create('/api/live-competitions/available', 'GET'));

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame('E403', $response->getData(true)['errNum']);
    }

    private function actingTeacher(int $id, array $attrs = []): User
    {
        $teacher = User::create(array_merge([
            'id' => $id,
            'type' => 'teacher',
            'name' => 'Teacher '.$id,
            'school_id' => null,
        ], $attrs));
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($teacher);

        return $teacher;
    }

    private function teacherAvailable()
    {
        return $this->app->make(LiveCompetitionsTeacherController::class)
            ->available(Request::create('/api/live-competitions/available', 'GET'));
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

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->string('name')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
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
            $table->string('correct_answer')->nullable();
            $table->string('answer1')->nullable();
            $table->string('answer2')->nullable();
            $table->string('answer3')->nullable();
            $table->string('answer4')->nullable();
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
    }
}
