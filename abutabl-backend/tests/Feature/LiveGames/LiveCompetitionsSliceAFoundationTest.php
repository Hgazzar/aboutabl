<?php

namespace Tests\Feature\LiveGames;

use App\Http\Kernel;
use App\Http\Middleware\EnsureLiveCompetitionsEnabled;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * LIVE-GAMES-001 Slice A — feature flag, middleware, additive migration files.
 *
 * Does not run migrations or open a database connection.
 * Teacher Begin (C.5) is the only gameplay mutation route on the teacher API.
 */
class LiveCompetitionsSliceAFoundationTest extends TestCase
{
    /**
     * @return string[]
     */
    private function expectedTables(): array
    {
        return [
            'live_games',
            'live_game_questions',
            'live_game_schools',
            'live_game_sessions',
            'live_game_session_questions',
            'live_game_session_players',
            'live_game_session_answers',
            'live_game_session_teams',
        ];
    }

    /**
     * @return string[]
     */
    private function migrationFiles(): array
    {
        return [
            '2026_10_29_140001_create_live_games_table.php',
            '2026_10_29_140002_create_live_game_questions_table.php',
            '2026_10_29_140003_create_live_game_schools_table.php',
            '2026_10_29_140004_create_live_game_sessions_table.php',
            '2026_10_29_140005_create_live_game_session_questions_table.php',
            '2026_10_29_140006_create_live_game_session_teams_table.php',
            '2026_10_29_140007_create_live_game_session_players_table.php',
            '2026_10_29_140008_create_live_game_session_answers_table.php',
        ];
    }

    public function test_live_competitions_flag_defaults_to_false(): void
    {
        $this->assertFileExists(config_path('live_competitions.php'));
        $this->assertArrayHasKey('enabled', config('live_competitions'));
        $this->assertFalse((bool) config('live_competitions.enabled'));

        $source = file_get_contents(config_path('live_competitions.php'));
        $this->assertNotFalse($source);
        $this->assertStringContainsString("env('LIVE_COMPETITIONS_ENABLED', false)", $source);
    }

    public function test_env_example_documents_the_flag_as_false(): void
    {
        $example = file_get_contents(base_path('.env.example'));
        $this->assertNotFalse($example);
        $this->assertStringContainsString('LIVE_COMPETITIONS_ENABLED=false', $example);
        $this->assertStringContainsString('INTERACTIVE_GAMES_ENABLED=false', $example);
    }

    public function test_kernel_registers_live_competitions_middleware_alias(): void
    {
        $aliases = app(Kernel::class)->getRouteMiddleware();

        $this->assertSame(
            EnsureLiveCompetitionsEnabled::class,
            $aliases['ensureLiveCompetitionsEnabled'] ?? null
        );
        $this->assertSame(
            \App\Http\Middleware\EnsureInteractiveGamesEnabled::class,
            $aliases['ensureInteractiveGamesEnabled'] ?? null
        );
    }

    public function test_middleware_returns_404_when_flag_is_disabled(): void
    {
        $previous = config('live_competitions.enabled');
        config(['live_competitions.enabled' => false]);

        try {
            $response = (new EnsureLiveCompetitionsEnabled())->handle(
                Request::create('/api/live-competitions', 'GET'),
                function () {
                    return response('ok', 200);
                }
            );

            $this->assertSame(404, $response->getStatusCode());
            $this->assertSame([
                'status' => false,
                'errNum' => '404',
                'msg' => 'Live competitions are disabled.',
            ], $response->getData(true));
        } finally {
            config(['live_competitions.enabled' => $previous]);
        }
    }

    public function test_middleware_passes_when_flag_is_enabled(): void
    {
        $previous = config('live_competitions.enabled');
        config(['live_competitions.enabled' => true]);

        try {
            $response = (new EnsureLiveCompetitionsEnabled())->handle(
                Request::create('/api/live-competitions', 'GET'),
                function () {
                    return response('ok', 200);
                }
            );

            $this->assertSame(200, $response->getStatusCode());
            $this->assertSame('ok', $response->getContent());
        } finally {
            config(['live_competitions.enabled' => $previous]);
        }
    }

    public function test_teacher_begin_is_the_only_registered_gameplay_mutation_route(): void
    {
        $uris = collect(Route::getRoutes())->map(function ($route) {
            return $route->uri();
        });

        $this->assertTrue($uris->contains('api/live-competitions/sessions/{id}/begin'));
        $this->assertTrue($uris->contains('api/student/live-competitions/sessions/{id}/answers'));
        $this->assertTrue($uris->contains('api/student/live-competitions/sessions/{id}/reinforce'));
        $this->assertTrue($uris->contains('api/student/live-competitions/sessions/{id}/claim-reward'));
        $this->assertTrue($uris->contains('api/student/live-competitions/sessions/{id}/use-power'));
        $this->assertTrue($uris->contains('api/student/live-competitions/sessions/{id}/pick-password'));
        $this->assertTrue($uris->contains('api/student/live-competitions/sessions/{id}/current'));
        $this->assertTrue($uris->contains('api/student/live-competitions/sessions/{id}/start-question-clock'));
        $this->assertTrue($uris->contains('api/student/live-competitions/sessions/{id}/timeout'));
        $this->assertTrue($uris->contains('api/live-competitions/sessions/{id}/end'));
        $this->assertTrue($uris->contains('api/live-competitions/sessions/{id}/host'));
        $this->assertFalse(
            $uris->contains(function ($uri) {
                if (in_array($uri, [
                    'api/live-competitions/sessions/{id}/begin',
                    'api/live-competitions/sessions/{id}/end',
                    'api/live-competitions/sessions/{id}/host',
                    'api/live-competitions/sessions/{id}/players/{studentId}/answers',
                    'api/student/live-competitions/sessions/{id}/answers',
                    'api/student/live-competitions/sessions/{id}/timeout',
                    'api/student/live-competitions/sessions/{id}/reinforce',
                    'api/student/live-competitions/sessions/{id}/claim-reward',
                    'api/student/live-competitions/sessions/{id}/use-power',
                    'api/student/live-competitions/sessions/{id}/pick-password',
                    'api/student/live-competitions/sessions/{id}/current',
                    'api/student/live-competitions/sessions/{id}/start-question-clock',
                ], true)) {
                    return false;
                }

                return str_contains($uri, 'live-competitions/') && (
                    str_contains($uri, 'compete') ||
                    str_contains($uri, 'start-competition') ||
                    str_contains($uri, 'begin') ||
                    str_contains($uri, 'invite') ||
                    str_contains($uri, 'answer') ||
                    str_contains($uri, 'timeout') ||
                    str_contains($uri, 'reinforce')
                );
            })
        );
    }

    public function test_additive_live_table_migration_files_exist(): void
    {
        foreach ($this->migrationFiles() as $filename) {
            $this->assertFileExists(database_path('migrations/'.$filename));
        }

        $combined = '';
        foreach ($this->migrationFiles() as $filename) {
            $combined .= file_get_contents(database_path('migrations/'.$filename));
        }

        foreach ($this->expectedTables() as $table) {
            $this->assertStringContainsString("Schema::create('{$table}'", $combined);
        }
    }

    public function test_session_question_snapshots_are_independent_of_catalog_rows(): void
    {
        $snapshot = file_get_contents(database_path(
            'migrations/2026_10_29_140005_create_live_game_session_questions_table.php'
        ));
        $this->assertNotFalse($snapshot);
        $this->assertStringContainsString("\$table->unsignedBigInteger('live_game_question_id')->nullable()", $snapshot);
        $this->assertStringContainsString('nullOnDelete()', $snapshot);
        $this->assertStringContainsString("\$table->string('correct_answer')", $snapshot);
        $this->assertStringContainsString("\$table->string('answer1')", $snapshot);
        $this->assertStringContainsString("\$table->string('answer2')", $snapshot);
        $this->assertStringContainsString("\$table->string('answer3')", $snapshot);
        $this->assertStringContainsString("\$table->string('answer4')", $snapshot);

        $answers = file_get_contents(database_path(
            'migrations/2026_10_29_140008_create_live_game_session_answers_table.php'
        ));
        $this->assertNotFalse($answers);
        $this->assertStringContainsString('live_game_session_question_id', $answers);
        $this->assertStringNotContainsString('live_game_question_id', $answers);
    }

    public function test_session_identities_reference_abutabl_users_students_classes_and_schools(): void
    {
        $sessions = file_get_contents(database_path(
            'migrations/2026_10_29_140004_create_live_game_sessions_table.php'
        ));
        $this->assertNotFalse($sessions);
        $this->assertStringContainsString("->on('users')", $sessions);
        $this->assertStringContainsString("->on('classes')", $sessions);
        $this->assertStringContainsString("->on('schools')", $sessions);
        $this->assertStringContainsString('host_user_id', $sessions);
        $this->assertStringNotContainsString('host_student_id', $sessions);

        $players = file_get_contents(database_path(
            'migrations/2026_10_29_140007_create_live_game_session_players_table.php'
        ));
        $this->assertNotFalse($players);
        $this->assertStringContainsString("->on('students')", $players);
        $this->assertStringContainsString("\$table->unsignedInteger('coins')->default(0)", $players);
        $this->assertStringNotContainsString('games_coins', $players);
    }

    public function test_new_migrations_do_not_alter_legacy_or_wallet_tables(): void
    {
        $combined = '';
        foreach ($this->migrationFiles() as $filename) {
            $combined .= file_get_contents(database_path('migrations/'.$filename));
        }

        $this->assertStringNotContainsString('interactive_games', $combined);
        $this->assertStringNotContainsString('interactive_game_questions', $combined);
        $this->assertStringNotContainsString('interactive_student_answers', $combined);
        $this->assertStringNotContainsString('games_coins', $combined);
        $this->assertStringNotContainsString("Schema::table('students'", $combined);
        $this->assertStringNotContainsString("Schema::table('games'", $combined);
        $this->assertStringNotContainsString("Schema::table('questions'", $combined);
    }
}
