<?php

namespace Tests\Feature\LiveGames;

use App\Support\LiveCompetitions\LiveCompetitionPreviewTokenGuard;
use Illuminate\Support\Carbon;
use RuntimeException;
use Tests\TestCase;

class LiveCompetitionsPreviewTokenTest extends TestCase
{
    /** @var string[] */
    private $markerFiles = [];

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        foreach ($this->markerFiles as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
        parent::tearDown();
    }

    public function test_expired_token_is_rejected(): void
    {
        config(['live_competitions.preview_token_ttl_seconds' => 60]);
        $guard = new LiveCompetitionPreviewTokenGuard();
        $payload = $this->payload();
        $token = $guard->issue(7, $payload['game'], $payload['questions']);
        $this->rememberMarker($token, $guard);

        Carbon::setTestNow(Carbon::now()->addMinutes(2));

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Preview token has expired.');
        $guard->consume($token, 7, $payload['game'], $payload['questions']);
    }

    public function test_invalid_token_is_rejected(): void
    {
        $guard = new LiveCompetitionPreviewTokenGuard();
        $payload = $this->payload();
        $token = $guard->issue(7, $payload['game'], $payload['questions']);
        $this->rememberMarker($token, $guard);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Preview token is invalid.');
        $guard->consume($token.'x', 7, $payload['game'], $payload['questions']);
    }

    public function test_cross_admin_reuse_is_rejected(): void
    {
        $guard = new LiveCompetitionPreviewTokenGuard();
        $payload = $this->payload();
        $token = $guard->issue(7, $payload['game'], $payload['questions']);
        $this->rememberMarker($token, $guard);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Preview token does not belong to this admin.');
        $guard->consume($token, 8, $payload['game'], $payload['questions']);
    }

    public function test_altered_workbook_is_rejected(): void
    {
        $guard = new LiveCompetitionPreviewTokenGuard();
        $payload = $this->payload();
        $token = $guard->issue(7, $payload['game'], $payload['questions']);
        $this->rememberMarker($token, $guard);

        $changed = $payload;
        $changed['game']['name'] = 'Hacking';

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Workbook does not match the validated preview.');
        $guard->consume($token, 7, $changed['game'], $changed['questions']);
    }

    public function test_replay_is_rejected_after_successful_consume(): void
    {
        $guard = new LiveCompetitionPreviewTokenGuard();
        $payload = $this->payload();
        $token = $guard->issue(7, $payload['game'], $payload['questions']);
        $this->rememberMarker($token, $guard);

        $guard->consume($token, 7, $payload['game'], $payload['questions']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Preview token has already been used.');
        $guard->consume($token, 7, $payload['game'], $payload['questions']);
    }

    public function test_flock_serializes_consume_so_the_second_caller_sees_used(): void
    {
        $guard = new LiveCompetitionPreviewTokenGuard();
        $payload = $this->payload();
        $token = $guard->issue(7, $payload['game'], $payload['questions']);
        $this->rememberMarker($token, $guard);

        $guard->consume($token, 7, $payload['game'], $payload['questions']);
        $claims = $guard->parse($token);
        $path = storage_path('framework/cache/live-competitions-preview/'.$claims['jti'].'.json');
        $state = json_decode((string) file_get_contents($path), true);

        $this->assertSame('used', $state['status'] ?? null);

        try {
            $guard->consume($token, 7, $payload['game'], $payload['questions']);
            $this->fail('Second consume should fail.');
        } catch (RuntimeException $e) {
            $this->assertSame('Preview token has already been used.', $e->getMessage());
        }
    }

    /**
     * @return array{game:array<string,mixed>,questions:list<array<string,mixed>>}
     */
    private function payload(): array
    {
        return [
            'game' => [
                'name' => 'Classic',
                'time' => '10:00',
                'logo' => null,
                'type' => 'classic',
                'level' => 1,
                'background' => null,
                'status' => 0,
            ],
            'questions' => [[
                'sort_order' => 1,
                'question' => 'What do we need to start a campfire?',
                'image' => null,
                'voice_url' => null,
                'answer_type' => 'text',
                'correct_answer' => 'Wood',
                'answer1' => 'Sun',
                'answer2' => 'Rocks',
                'answer3' => 'Wood',
                'answer4' => 'Leaves',
                'explanation' => 'Fuel',
            ]],
        ];
    }

    private function rememberMarker(string $token, LiveCompetitionPreviewTokenGuard $guard): void
    {
        $claims = $guard->parse($token);
        $this->markerFiles[] = storage_path('framework/cache/live-competitions-preview/'.$claims['jti'].'.json');
    }
}
