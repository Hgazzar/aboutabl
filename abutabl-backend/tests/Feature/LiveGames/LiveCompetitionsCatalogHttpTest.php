<?php

namespace Tests\Feature\LiveGames;

use App\Http\Kernel;
use App\Http\Middleware\EnsureLiveCompetitionsAdminOnly;
use App\Http\Middleware\EnsureLiveCompetitionsEnabled;
use App\Support\Ownership\OwnershipGate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class LiveCompetitionsCatalogHttpTest extends TestCase
{
    private function apiSecret(): string
    {
        return (string) env('API_SECRET', 'OASzRok654E0AJ20KH');
    }

    public function test_catalog_routes_are_registered_behind_flag_and_admin_middleware(): void
    {
        $aliases = app(Kernel::class)->getRouteMiddleware();
        $this->assertSame(EnsureLiveCompetitionsEnabled::class, $aliases['ensureLiveCompetitionsEnabled'] ?? null);
        $this->assertSame(EnsureLiveCompetitionsAdminOnly::class, $aliases['ensureLiveCompetitionsAdminOnly'] ?? null);

        $uris = collect(Route::getRoutes())->map(function ($route) {
            return $route->uri();
        });

        foreach ([
            'api/live-competitions',
            'api/live-competitions/available',
            'api/live-competitions/sessions',
            'api/live-competitions/sessions/{id}',
            'api/live-competitions/sessions/{id}/students',
            'api/live-competitions/sessions/{id}/begin',
            'api/live-competitions/template',
            'api/live-competitions/import/preview',
            'api/live-competitions/import/confirm',
            'api/live-competitions/{id}',
            'api/live-competitions/{id}/publish',
            'api/live-competitions/{id}/unpublish',
            'api/live-competitions/{id}/schools',
        ] as $uri) {
            $this->assertTrue($uris->contains($uri), 'Missing route '.$uri);
        }

        // Legacy Interactive Games APIs retired (DELIVERY-005); catalog coexists with SCORM only.
        $this->assertFalse($uris->contains('api/interactive-games'));
        $this->assertFalse(
            $uris->contains(function ($uri) {
                if ($uri === 'api/live-competitions/sessions/{id}/begin') {
                    return false;
                }

                return str_contains($uri, 'live-competitions') && (
                    str_contains($uri, 'compete') ||
                    str_contains($uri, 'begin') ||
                    str_contains($uri, 'invite')
                );
            })
        );
    }

    public function test_unauthenticated_catalog_access_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => $this->apiSecret(),
            'Accept' => 'application/json',
        ])->getJson('/api/live-competitions');

        $response->assertStatus(401)
            ->assertJson([
                'status' => false,
                'errNum' => 'E3001',
            ]);
    }

    public function test_missing_api_secret_is_rejected(): void
    {
        $response = $this->withHeaders([
            'Accept' => 'application/json',
        ])->getJson('/api/live-competitions');

        $response->assertStatus(403)
            ->assertJson([
                'status' => false,
                'errNum' => 'E3000',
            ]);
    }

    public function test_admin_only_gate_rejects_non_admin_users(): void
    {
        $this->assertFalse(OwnershipGate::isAdminUser((object) ['type' => 'user']));
        $this->assertFalse(OwnershipGate::isAdminUser((object) ['type' => 'teacher']));
        $this->assertFalse(OwnershipGate::isAdminUser(null));
        $this->assertTrue(OwnershipGate::isAdminUser((object) ['type' => 'admin']));
    }

    public function test_disabled_flag_still_blocks_catalog_middleware(): void
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
            $this->assertSame('Live competitions are disabled.', $response->getData(true)['msg']);
        } finally {
            config(['live_competitions.enabled' => $previous]);
        }
    }
}
