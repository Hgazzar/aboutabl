<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\AdminControllers\GamesController;
use App\Http\Controllers\Api\AdminControllers\InteractiveGamesAdminController;
use App\Http\Controllers\Api\StudentControllers\InteractiveGamesStudentController;
use App\Models\InteractiveGame;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Models\games as ScormGame;
use App\Services\TeacherDashboardService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * LIVE-GAMES-001 Phase 1 — characterization / regression baseline.
 *
 * Does not create hosted competitions, mutate interactive_games, games, or questions
 * rows. Legacy Interactive Games HTTP routes are asserted unregistered (DELIVERY-005);
 * controllers/tables retained. SCORM and Live Competitions baselines stay green.
 */
class LiveGamesPhase1BaselineTest extends TestCase
{
    private const UNASSIGNED_CLASS_ID = 2147483646;

    private function apiSecret(): string
    {
        return (string) env('API_SECRET', 'OASzRok654E0AJ20KH');
    }

    /**
     * @return array<string, string>
     */
    private function secretHeaders(): array
    {
        return [
            'apiSecret' => $this->apiSecret(),
            'Accept' => 'application/json',
        ];
    }

    /**
     * @return array<string, string>
     */
    private function staffHeaders(User $user): array
    {
        $token = auth('admin-api')->login($user);

        return [
            'apiSecret' => $this->apiSecret(),
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ];
    }

    private function databaseReachable(): bool
    {
        try {
            Schema::hasTable('users');

            return true;
        } catch (Throwable $e) {
            return false;
        }
    }

    private function requireDatabase(): void
    {
        if (! $this->databaseReachable()) {
            $this->markTestSkipped('Database unavailable (local MySQL onesave not reachable).');
        }
    }

    /**
     * Prefer demo teacher 179 when present; otherwise any non-admin user with
     * an active teachers_grades row. Read-only lookup — no fixture writes.
     */
    private function baselineTeacher(): ?User
    {
        $this->requireDatabase();

        try {
            $preferred = User::query()->where('id', 179)->first();
            if ($preferred && ($preferred->type ?? '') !== 'admin') {
                return $preferred;
            }

            if (! Schema::hasTable('teachers_grades')) {
                return $preferred;
            }

            $assignedUserId = TeachersGrades::query()
                ->where('status', 1)
                ->whereNotNull('user_id')
                ->whereNotNull('class_id')
                ->orderBy('id')
                ->value('user_id');

            if (! $assignedUserId) {
                return $preferred;
            }

            $assigned = User::query()->where('id', $assignedUserId)->first();
            if ($assigned && ($assigned->type ?? '') !== 'admin') {
                return $assigned;
            }

            return $preferred;
        } catch (Throwable $e) {
            return null;
        }
    }

    /**
     * @return array<int, \Illuminate\Routing\Route>
     */
    private function routesForUri(string $uri): array
    {
        $matches = [];
        foreach (Route::getRoutes() as $route) {
            if ($route->uri() === $uri) {
                $matches[] = $route;
            }
        }

        return $matches;
    }

    private function assertRouteRegistered(string $method, string $uri, string $actionContains): void
    {
        $found = false;
        foreach ($this->routesForUri($uri) as $route) {
            $methods = array_map('strtoupper', $route->methods());
            if (! in_array(strtoupper($method), $methods, true)) {
                continue;
            }
            $this->assertStringContainsString($actionContains, $route->getActionName());
            $found = true;
            break;
        }

        $this->assertTrue($found, "Expected {$method} {$uri} → {$actionContains}");
    }

    // ------------------------------------------------------------------
    // 1. Teacher class authorization (teachers_grades + existing service)
    // ------------------------------------------------------------------

    public function test_resolve_class_access_uses_teachers_grades_and_rejects_unassigned_class(): void
    {
        $this->requireDatabase();

        if (! Schema::hasTable('teachers_grades')) {
            $this->markTestSkipped('teachers_grades table missing.');
        }

        $teacher = $this->baselineTeacher();
        if (! $teacher) {
            $this->markTestSkipped('No teacher user found for class-access baseline.');
        }

        $assignedClassId = (int) TeachersGrades::query()
            ->assignedToTeacher((int) $teacher->id)
            ->whereNotNull('class_id')
            ->value('class_id');

        $service = app(TeacherDashboardService::class);

        $denied = $service->resolveClassAccess((int) $teacher->id, [], self::UNASSIGNED_CLASS_ID);
        $this->assertNull($denied);

        if ($assignedClassId <= 0) {
            $this->markTestSkipped('Baseline teacher has no teachers_grades class assignment.');
        }

        $allowed = $service->resolveClassAccess((int) $teacher->id, [], $assignedClassId);
        $this->assertIsArray($allowed);
        $this->assertTrue($allowed['class_ids']->contains($assignedClassId));
        $this->assertSame((int) $teacher->id, (int) $allowed['teacher_id']);
    }

    public function test_teacher_class_overview_returns_e403_for_unassigned_class(): void
    {
        $teacher = $this->baselineTeacher();
        if (! $teacher) {
            $this->markTestSkipped('No teacher user found for class-access baseline.');
        }
        if (($teacher->type ?? '') === 'admin') {
            $this->markTestSkipped('Baseline user is admin; teacher-only endpoint would 403 for a different reason.');
        }

        $response = $this->withHeaders($this->staffHeaders($teacher))
            ->getJson('/api/dashboard/teacher/classes/'.self::UNASSIGNED_CLASS_ID.'/overview');

        $response->assertStatus(403)
            ->assertJson([
                'status' => false,
                'errNum' => 'E403',
                'msg' => 'The selected class is not assigned to this teacher.',
            ]);
    }

    public function test_teacher_class_standards_returns_e403_for_unassigned_class(): void
    {
        $teacher = $this->baselineTeacher();
        if (! $teacher) {
            $this->markTestSkipped('No teacher user found for class-access baseline.');
        }
        if (($teacher->type ?? '') === 'admin') {
            $this->markTestSkipped('Baseline user is admin; teacher-only endpoint would 403 for a different reason.');
        }

        $response = $this->withHeaders($this->staffHeaders($teacher))
            ->getJson('/api/dashboard/teacher/classes/'.self::UNASSIGNED_CLASS_ID.'/standards');

        $response->assertStatus(403)
            ->assertJson([
                'status' => false,
                'errNum' => 'E403',
                'msg' => 'The selected class is not assigned to this teacher.',
            ]);
    }

    // ------------------------------------------------------------------
    // 2. Legacy interactive-games routes — retired (LIVE-GAMES-DELIVERY-005)
    // ------------------------------------------------------------------

    public function test_admin_interactive_games_routes_are_unregistered(): void
    {
        $this->assertSame([], $this->routesForUri('api/interactive-games'));
        $this->assertSame([], $this->routesForUri('api/interactive-games/{id}'));
        $this->assertSame([], $this->routesForUri('api/interactive-games/{id}/start'));
        $this->assertSame([], $this->routesForUri('api/interactive-games/{id}/facts'));
        $this->assertSame([], $this->routesForUri('api/interactive-games/{id}/students/{studentId}/answers'));
    }

    public function test_student_interactive_games_routes_are_unregistered(): void
    {
        $this->assertSame([], $this->routesForUri('api/student/interactive-games'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/{id}'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/{id}/questions'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/answer'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/{id}/password'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/{id}/hacking'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/hacking'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/{id}/gifts'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/{id}/gifts/pull'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/gifts'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/{id}/facts'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/{id}/answer-list'));
    }

    public function test_admin_interactive_games_index_is_not_found(): void
    {
        $response = $this->withHeaders($this->secretHeaders())
            ->getJson('/api/interactive-games');

        $response->assertStatus(404);
    }

    public function test_student_interactive_games_index_is_not_found(): void
    {
        $response = $this->withHeaders($this->secretHeaders())
            ->getJson('/api/student/interactive-games');

        $response->assertStatus(404);
    }

    public function test_interactive_games_controllers_and_tables_are_retained(): void
    {
        $this->assertTrue(class_exists(InteractiveGamesAdminController::class));
        $this->assertTrue(class_exists(InteractiveGamesStudentController::class));
        $this->assertTrue(method_exists(InteractiveGamesAdminController::class, 'startRound'));
        $this->assertTrue(method_exists(InteractiveGamesStudentController::class, 'saveGift'));
        $this->assertSame('interactive_games', (new InteractiveGame())->getTable());
    }

    // ------------------------------------------------------------------
    // 3. SCORM /api/games/* independent of interactive_games
    // ------------------------------------------------------------------

    public function test_scorm_games_routes_remain_registered_on_games_controller(): void
    {
        $this->assertRouteRegistered('GET', 'api/games/list', 'GamesController@index');
        $this->assertRouteRegistered('GET', 'api/games/show/{id}', 'GamesController@show');
        $this->assertRouteRegistered('POST', 'api/games/store', 'GamesController@store');
        $this->assertRouteRegistered('POST', 'api/games/update/{id}', 'GamesController@update');
        $this->assertRouteRegistered('DELETE', 'api/games/delete/{id}', 'GamesController@destroy');
    }

    public function test_scorm_and_interactive_games_use_different_tables_and_controllers(): void
    {
        $this->assertSame('games', (new ScormGame())->getTable());
        $this->assertSame('interactive_games', (new InteractiveGame())->getTable());
        $this->assertNotSame(GamesController::class, InteractiveGamesAdminController::class);

        foreach ($this->routesForUri('api/games/list') as $route) {
            $this->assertStringNotContainsString('InteractiveGames', $route->getActionName());
        }
        // Interactive Games HTTP routes are retired; SCORM must stay on GamesController.
        $this->assertSame([], $this->routesForUri('api/interactive-games'));
    }

    public function test_scorm_games_list_requires_token_and_does_not_alias_interactive_index(): void
    {
        $response = $this->withHeaders($this->secretHeaders())
            ->getJson('/api/games/list');

        $response->assertStatus(401)
            ->assertJson([
                'status' => false,
                'errNum' => 'E3001',
            ]);
    }

    // ------------------------------------------------------------------
    // 4. Student notification inbox
    // ------------------------------------------------------------------

    public function test_student_notification_inbox_list_route_remains_registered(): void
    {
        $this->assertRouteRegistered('GET', 'api/student/notifications/list', 'NotificationsController@index');
        $this->assertRouteRegistered('POST', 'api/student/notifications/update_read/{id}', 'NotificationsController@update');
        $this->assertRouteRegistered('POST', 'api/student/notifications/mark_all_read', 'NotificationsController@mark_all_read');
        $this->assertRouteRegistered('DELETE', 'api/student/notifications/delete_all', 'NotificationsController@delete_all');
    }

    public function test_student_notification_list_requires_token(): void
    {
        $response = $this->withHeaders($this->secretHeaders())
            ->getJson('/api/student/notifications/list');

        $response->assertStatus(401)
            ->assertJson([
                'status' => false,
                'errNum' => 'E3001',
            ]);
    }

    // ------------------------------------------------------------------
    // 5. Retired Interactive Games: controllers retained; flag defaults off
    // ------------------------------------------------------------------

    public function test_save_gift_controller_contract_is_retained_without_http_route(): void
    {
        $this->assertTrue(method_exists(InteractiveGamesStudentController::class, 'saveGift'));
        $this->assertSame([], $this->routesForUri('api/student/interactive-games/gifts'));

        $source = file_get_contents(
            app_path('Http/Controllers/Api/StudentControllers/InteractiveGamesStudentController.php')
        );
        $this->assertNotFalse($source);
        $this->assertStringContainsString("if (\$request->filled('coins'))", $source);
        $this->assertStringContainsString('$user->games_coins = (int) $user->games_coins + (int) $request->coins;', $source);
        $this->assertStringContainsString('$user->games_coins = (int) $user->games_coins + 5;', $source);
        $this->assertStringContainsString("'games_coins' => (int) \$user->games_coins", $source);
    }

    public function test_interactive_games_feature_flag_defaults_to_disabled(): void
    {
        $this->assertArrayHasKey('enabled', config('interactive_games'));
        $this->assertFileExists(config_path('interactive_games.php'));

        $configSource = file_get_contents(config_path('interactive_games.php'));
        $this->assertNotFalse($configSource);
        // Product retirement: omitting the env var must not re-enable the old APIs.
        $this->assertStringContainsString("env('INTERACTIVE_GAMES_ENABLED', false)", $configSource);
        $this->assertStringNotContainsString("env('INTERACTIVE_GAMES_ENABLED', true)", $configSource);

        $example = file_get_contents(base_path('.env.example'));
        $this->assertNotFalse($example);
        $this->assertStringContainsString('INTERACTIVE_GAMES_ENABLED=false', $example);

        $middlewareSource = file_get_contents(
            app_path('Http/Middleware/EnsureInteractiveGamesEnabled.php')
        );
        $this->assertNotFalse($middlewareSource);
        $this->assertStringContainsString("config('interactive_games.enabled', false)", $middlewareSource);
    }

    public function test_interactive_games_middleware_returns_404_when_disabled(): void
    {
        $previous = config('interactive_games.enabled');
        config(['interactive_games.enabled' => false]);

        try {
            $response = (new \App\Http\Middleware\EnsureInteractiveGamesEnabled())->handle(
                \Illuminate\Http\Request::create('/api/interactive-games', 'GET'),
                function () {
                    return response('ok', 200);
                }
            );

            $this->assertSame(404, $response->getStatusCode());
            $this->assertSame([
                'status' => false,
                'errNum' => '404',
                'msg' => 'Interactive games are disabled.',
            ], $response->getData(true));
        } finally {
            config(['interactive_games.enabled' => $previous]);
        }
    }
}
