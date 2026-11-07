<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\StudentControllers\LiveCompetitionsStudentController;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionAnswer;
use App\Models\LiveGameSessionPlayer;
use App\Models\LiveGameSessionQuestion;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.7B — current question + clock. sqlite :memory: only; no migrate, no onesave.
 *
 * SQLite does not honor MySQL FOR UPDATE row locks, so these tests cannot
 * prove real concurrent clock-start safety. Lock ordering is asserted by
 * inspecting startQuestionClock source.
 */
class LiveCompetitionsStudentCurrentQuestionTest extends TestCase
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
        Carbon::setTestNow();
        config(['database.default' => $this->previousDefault]);
        DB::purge('live_competitions_test');
        parent::tearDown();
    }

    public function test_first_question_follows_snapshot_sort_order(): void
    {
        $playing = $this->openPlaying([21], 1, 'classic', 3);
        $ordered = LiveGameSessionQuestion::query()
            ->where('live_game_session_id', $playing['id'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
        $this->assertCount(3, $ordered);
        $this->actingStudent(21);

        $response = $this->current($playing['id']);
        $payload = $response->getData(true)['current'];

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('question', $payload['mode']);
        $this->assertSame((int) $ordered[0]->id, $payload['live_game_session_question_id']);
        $this->assertFalse($payload['clock_started']);
        $this->assertSame(20, $payload['question_seconds']);
        $this->assertSame(20.0, (float) $payload['seconds_left']);
        $this->assertFalse($payload['is_retry']);
        $this->assertArrayNotHasKey('correct_answer', $payload);
        $this->assertSame(['Sun', 'Wood', 'Rocks', 'Leaves'], $payload['choices']);
    }

    public function test_next_unseen_question_after_first_attempt(): void
    {
        $playing = $this->openPlaying([21], 1, 'classic', 3);
        $snapshots = $this->snapshots($playing['id']);
        $this->actingStudent(21);
        $this->startClock($playing['id']);
        $this->assertSame(200, $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshots[0]->id,
            'answer' => 'Wood',
        ])->getStatusCode());

        $payload = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame('question', $payload['mode']);
        $this->assertSame((int) $snapshots[1]->id, $payload['live_game_session_question_id']);
        $this->assertFalse($payload['is_retry']);
    }

    public function test_retry_due_after_two_later_answers(): void
    {
        $playing = $this->openPlaying([21], 1, 'classic', 3);
        $snapshots = $this->snapshots($playing['id']);
        $this->actingStudent(21);

        $this->startClock($playing['id']);
        $this->assertSame(200, $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshots[0]->id,
            'answer' => 'Sun',
        ])->getStatusCode());
        $this->assertSame(200, $this->reinforce($playing['id'], ['answer' => 'Wood'])->getStatusCode());

        $this->startClock($playing['id']);
        $this->assertSame(200, $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshots[1]->id,
            'answer' => 'Water',
        ])->getStatusCode());
        $this->startClock($playing['id']);
        $this->assertSame(200, $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshots[2]->id,
            'answer' => 'Air',
        ])->getStatusCode());

        $player = LiveGameSessionPlayer::first();
        $this->assertTrue($player->dueForRetry());
        $this->assertContains((int) $snapshots[0]->id, $player->retryQueue());

        $payload = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame('question', $payload['mode']);
        $this->assertSame((int) $snapshots[0]->id, $payload['live_game_session_question_id']);
        $this->assertTrue($payload['is_retry']);
    }

    public function test_retry_when_no_unseen_remains(): void
    {
        $playing = $this->openPlaying([21], 1, 'classic', 2);
        $snapshots = $this->snapshots($playing['id']);
        $this->actingStudent(21);

        $this->startClock($playing['id']);
        $this->assertSame(200, $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshots[0]->id,
            'answer' => 'Sun',
        ])->getStatusCode());
        $this->assertSame(200, $this->reinforce($playing['id'], ['answer' => 'Wood'])->getStatusCode());

        $this->startClock($playing['id']);
        $this->assertSame(200, $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshots[1]->id,
            'answer' => 'Water',
        ])->getStatusCode());

        $player = LiveGameSessionPlayer::first();
        $this->assertSame(1, (int) $player->answers_since_retry);
        $this->assertFalse($player->dueForRetry());

        $payload = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame((int) $snapshots[0]->id, $payload['live_game_session_question_id']);
        $this->assertTrue($payload['is_retry']);
    }

    public function test_retry_queue_filters_foreign_snapshot_ids(): void
    {
        $playing = $this->openPlaying([21], 1, 'classic', 2);
        $other = $this->openPlaying([22], 2, 'classic', 2);
        $foreign = LiveGameSessionQuestion::query()
            ->where('live_game_session_id', $other['id'])
            ->first();
        $snapshots = $this->snapshots($playing['id']);
        $player = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $player->retry_queue = [$foreign->id, $snapshots[0]->id];
        $player->answers_since_retry = 2;
        $player->save();
        LiveGameSessionAnswer::create([
            'live_game_session_id' => $playing['id'],
            'student_id' => 21,
            'live_game_session_question_id' => $snapshots[1]->id,
            'answer' => 'Water',
            'correct' => true,
            'is_retry' => false,
            'is_reinforce' => false,
            'attempt' => 1,
        ]);
        $this->actingStudent(21);

        $payload = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame((int) $snapshots[0]->id, $payload['live_game_session_question_id']);
        $this->assertTrue($payload['is_retry']);
    }

    public function test_need_password_seeds_options_when_empty(): void
    {
        $hacking = $this->openPlaying([21], 1, 'hacking', 2);
        LiveGameSessionPlayer::query()->where('student_id', 21)->update([
            'hack_password' => null,
            'password_options' => null,
        ]);
        $this->actingStudent(21);
        $payload = $this->current($hacking['id'])->getData(true)['current'];
        $this->assertSame('need_password', $payload['mode']);
        $this->assertCount(5, $payload['password_options']);
        $again = $this->current($hacking['id'])->getData(true)['current'];
        $this->assertSame($payload['password_options'], $again['password_options']);
    }

    public function test_reinforce_reward_and_password_modes(): void
    {
        $hacking = $this->openPlaying([21], 1, 'hacking', 2);
        LiveGameSessionPlayer::query()->where('student_id', 21)->update([
            'hack_password' => null,
            'password_options' => null,
        ]);
        $player = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $player->password_options = ['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o'];
        $player->save();
        $this->actingStudent(21);
        $needPw = $this->current($hacking['id'])->getData(true)['current'];
        $this->assertSame('need_password', $needPw['mode']);
        $this->assertSame(['Ab12c', 'De34f', 'Gh56i', 'Jk78l', 'Mn90o'], $needPw['password_options']);
        $this->assertArrayNotHasKey('choices', $needPw);

        // Reinforce coverage (wrong answer → reinforce mode).
        $playing = $this->openPlaying([23], 2, 'gold_quest', 2);
        $snapshot = $this->snapshots($playing['id'])[0];
        $this->actingStudent(23);
        $this->startClock($playing['id']);
        $this->assertSame(200, $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Sun',
        ])->getStatusCode());
        $reinforce = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame('reinforce', $reinforce['mode']);
        $this->assertCount(2, $reinforce['choices']);
        $this->assertArrayNotHasKey('correct_answer', $reinforce);
        $this->assertSame('Sun', $reinforce['wrong_answer']);
        $this->assertSame(200, $this->reinforce($playing['id'], ['answer' => 'Wood'])->getStatusCode());

        // Gold Quest REWARD-002: chest after every 3 cumulative correct answers (fixed_trio).
        $rewardSession = $this->openPlaying([24], 3, 'gold_quest', 3);
        $this->actingStudent(24);
        $correctByIndex = ['Wood', 'Water', 'Air'];
        foreach ($this->snapshots($rewardSession['id']) as $index => $quest) {
            $this->startClock($rewardSession['id']);
            $this->assertSame(200, $this->answer($rewardSession['id'], [
                'live_game_session_question_id' => $quest->id,
                'answer' => $correctByIndex[$index],
            ])->getStatusCode());
        }
        $reward = $this->current($rewardSession['id'])->getData(true)['current'];
        $this->assertSame('reward', $reward['mode']);
        $this->assertSame('chest', $reward['reward_type']);
        $this->assertCount(3, $reward['reward_options']);
        foreach ($reward['reward_options'] as $opt) {
            $this->assertArrayHasKey('index', $opt);
            $this->assertArrayHasKey('image', $opt);
            $this->assertArrayNotHasKey('risk', $opt);
            $this->assertArrayNotHasKey('coins', $opt);
        }
        $this->assertArrayNotHasKey('reward_data', $reward);
    }

    public function test_get_current_never_mutates_clock_or_version(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingStudent(21);
        $beforeVersion = (int) LiveGameSession::query()->find($playing['id'])->live_version;
        $this->assertNull(LiveGameSessionPlayer::first()->question_started_at);

        $this->assertSame(200, $this->current($playing['id'])->getStatusCode());
        $this->assertSame(200, $this->current($playing['id'])->getStatusCode());

        $this->assertNull(LiveGameSessionPlayer::first()->question_started_at);
        $this->assertSame($beforeVersion, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_start_clock_initializes_once_and_is_idempotent(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-03 12:00:00'));
        $playing = $this->openPlaying([21]);
        $this->actingStudent(21);
        $beforeVersion = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $first = $this->startClock($playing['id']);
        $payload = $first->getData(true)['current'];
        $player = LiveGameSessionPlayer::first();
        $this->assertSame(200, $first->getStatusCode());
        $this->assertTrue($payload['clock_started']);
        $this->assertNotNull($player->question_started_at);
        $started = $player->question_started_at->toDateTimeString();
        $this->assertSame(
            Carbon::parse('2026-11-03 12:00:00')->toDateTimeString(),
            $started
        );
        $afterFirst = (int) LiveGameSession::query()->find($playing['id'])->live_version;
        $this->assertGreaterThan($beforeVersion, $afterFirst);

        Carbon::setTestNow(Carbon::parse('2026-11-03 12:00:05'));
        $second = $this->startClock($playing['id']);
        $this->assertSame(200, $second->getStatusCode());
        $this->assertTrue($second->getData(true)['current']['clock_started']);
        $this->assertSame(
            $started,
            LiveGameSessionPlayer::first()->question_started_at->toDateTimeString()
        );
        $this->assertSame($afterFirst, (int) LiveGameSession::query()->find($playing['id'])->live_version);
        $this->assertSame(15.0, (float) $second->getData(true)['current']['seconds_left']);
    }

    public function test_fifty_fifty_filters_displayed_choices_only(): void
    {
        $playing = $this->openPlaying([21]);
        $snapshot = $this->snapshots($playing['id'])[0];
        $player = LiveGameSessionPlayer::first();
        $player->power = 'fifty_fifty';
        $player->power_used = true;
        $player->save();
        $this->actingStudent(21);

        $payload = $this->current($playing['id'])->getData(true)['current'];
        $this->assertCount(2, $payload['choices']);
        $this->assertContains('Wood', $payload['choices']);
        $this->assertSame('Sun', $snapshot->fresh()->answer1);
        $this->assertSame('Wood', $snapshot->fresh()->answer2);
        $this->assertSame('Rocks', $snapshot->fresh()->answer3);
        $this->assertSame('Leaves', $snapshot->fresh()->answer4);
    }

    public function test_frozen_player_receives_question_and_can_start_clock(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-03 12:00:00'));
        $playing = $this->openPlaying([21]);
        $player = LiveGameSessionPlayer::first();
        $player->frozen_until = now()->addSeconds(8);
        $player->save();
        $this->actingStudent(21);

        $current = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame('question', $current['mode']);
        $this->assertTrue($current['frozen']);
        $this->assertSame(8, $current['frozen_seconds']);

        $started = $this->startClock($playing['id'])->getData(true)['current'];
        $this->assertTrue($started['clock_started']);
        $this->assertNotNull(LiveGameSessionPlayer::first()->question_started_at);
    }

    public function test_start_clock_rejects_reward_and_reinforce(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingStudent(21);
        LiveGameSessionPlayer::query()->update([
            'pending_reinforce' => true,
            'reinforce_question_id' => $this->snapshots($playing['id'])[0]->id,
        ]);
        $this->assertSame(409, $this->startClock($playing['id'])->getStatusCode());
        $this->assertNull(LiveGameSessionPlayer::first()->question_started_at);

        LiveGameSessionPlayer::query()->update([
            'pending_reinforce' => false,
            'reinforce_question_id' => null,
            'reward_pending' => true,
            'reward_type' => 'chest',
        ]);
        $this->assertSame(409, $this->startClock($playing['id'])->getStatusCode());
    }

    public function test_done_mode_when_no_question_remains(): void
    {
        $playing = $this->openPlaying([21], 1, 'classic', 1);
        $snapshot = $this->snapshots($playing['id'])[0];
        $this->actingStudent(21);
        $this->startClock($playing['id']);
        $this->assertSame(200, $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
        ])->getStatusCode());

        $payload = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame('done', $payload['mode']);
        $this->assertTrue($payload['done']);
        $this->assertSame(200, $this->startClock($playing['id'])->getStatusCode());
        $this->assertNull(LiveGameSessionPlayer::first()->question_started_at);
    }

    public function test_student_and_session_isolation(): void
    {
        $first = $this->openPlaying([21, 22]);
        $other = $this->openPlaying([23], 2);
        $this->actingStudent(22);
        $payload = $this->current($first['id'])->getData(true)['current'];
        $this->assertSame('question', $payload['mode']);

        $this->actingStudent(21);
        $this->assertSame(403, $this->current($other['id'])->getStatusCode());
    }

    public function test_start_clock_failure_rolls_back(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        LiveGameSessionPlayer::updating(function (LiveGameSessionPlayer $row) {
            if ($row->isDirty('question_started_at') && $row->question_started_at) {
                throw new \RuntimeException('forced clock failure');
            }
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->startQuestionClock(21, (int) $playing['id']);
            $this->fail('Expected clock failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced clock failure', $ex->getMessage());
        } finally {
            LiveGameSessionPlayer::flushEventListeners();
        }

        $this->assertNull(LiveGameSessionPlayer::first()->question_started_at);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_start_clock_locks_session_before_player(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $body = $this->methodBody($source, 'startQuestionClock');
        $sessionQuery = strpos($body, 'LiveGameSession::query()');
        $sessionLock = strpos($body, 'lockForUpdate');
        $playerQuery = strpos($body, 'LiveGameSessionPlayer::query()');
        $this->assertLessThan($sessionLock, $sessionQuery);
        $this->assertLessThan($playerQuery, $sessionLock);
        $this->assertLessThan(strpos($body, 'nextQuestionFor'), $playerQuery);
        $this->assertTrue(str_contains($body, 'STATUS_PLAYING'));

        $getBody = $this->methodBody($source, 'getCurrentQuestion');
        $this->assertTrue(str_contains($getBody, 'autoEndIfExpired'));
        $this->assertFalse(str_contains($getBody, 'lockForUpdate'));
        $this->assertFalse(str_contains($getBody, 'question_started_at'));
        $this->assertFalse(str_contains($getBody, 'live_version'));
    }

    public function test_reward_steal_options_omit_private_fields(): void
    {
        $playing = $this->openPlaying([21]);
        $player = LiveGameSessionPlayer::first();
        $player->reward_pending = true;
        $player->reward_type = 'steal';
        $player->reward_data = [
            'options' => [
                ['password' => 'Real1', 'owner_id' => 99, 'real' => true, 'hint' => 'Re'],
                ['password' => 'Fake0', 'owner_id' => null, 'real' => false, 'hint' => 'Fa'],
            ],
        ];
        $player->save();
        $this->actingStudent(21);

        $payload = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame('reward', $payload['mode']);
        $this->assertSame([
            ['password' => 'Real1', 'hint' => 'Re'],
            ['password' => 'Fake0', 'hint' => 'Fa'],
        ], $payload['reward_options']);
        $this->assertArrayNotHasKey('owner_id', $payload['reward_options'][0]);
        $this->assertArrayNotHasKey('real', $payload['reward_options'][0]);
    }

    public function test_grant_reward_steal_hints_are_indistinguishable_for_real_and_fake(): void
    {
        $playing = $this->openPlaying([21, 22], 1, 'hacking', 2);
        $session = LiveGameSession::query()->find($playing['id']);
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $rival = LiveGameSessionPlayer::query()->where('student_id', 22)->first();
        $rival->hack_password = 'Ab12xy';
        $rival->save();
        $me->hack_password = 'Cd34zw';
        $me->streak = 3;
        $me->reward_pending = false;
        $me->reward_type = null;
        $me->reward_data = null;
        $me->save();

        $engine = $this->app->make(\App\Support\LiveCompetitions\LiveCompetitionEngine::class);
        $steal = null;
        for ($i = 0; $i < 40; $i++) {
            $candidate = $me->fresh();
            $candidate->reward_pending = false;
            $candidate->reward_type = null;
            $candidate->reward_data = null;
            $candidate->streak = 3;
            $engine->grantReward($session->fresh(['game']), $candidate);
            if ($candidate->reward_type === 'steal') {
                $steal = $candidate->reward_data['options'] ?? null;
                $me = $candidate;
                break;
            }
        }
        $this->assertNotNull($steal, 'expected steal reward within retries');
        $this->assertGreaterThanOrEqual(2, count($steal));

        $hintPresence = [];
        $hintLengths = [];
        foreach ($steal as $opt) {
            $hasHint = array_key_exists('hint', $opt) && $opt['hint'] !== null && $opt['hint'] !== '';
            $hintPresence[] = $hasHint;
            if ($hasHint) {
                $hintLengths[] = strlen((string) $opt['hint']);
                $this->assertSame(
                    substr((string) $opt['password'], 0, strlen((string) $opt['hint'])),
                    (string) $opt['hint']
                );
            }
            $this->assertArrayHasKey('real', $opt);
        }
        $this->assertSame(1, count(array_unique($hintPresence)), 'hint presence must match for all steal options');
        if ($hintPresence[0]) {
            $this->assertSame(1, count(array_unique($hintLengths)), 'hint lengths must match for all steal options');
        }

        $me->reward_pending = true;
        $me->reward_type = 'steal';
        $me->reward_data = ['options' => $steal];
        $me->save();
        $this->actingStudent(21);
        $payload = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame('reward', $payload['mode']);
        foreach ($payload['reward_options'] as $opt) {
            $this->assertArrayNotHasKey('owner_id', $opt);
            $this->assertArrayNotHasKey('real', $opt);
            $this->assertArrayHasKey('password', $opt);
        }
        $serializedPresence = array_map(function ($opt) {
            return array_key_exists('hint', $opt) && $opt['hint'] !== null && $opt['hint'] !== '';
        }, $payload['reward_options']);
        $this->assertSame(1, count(array_unique($serializedPresence)));
    }

    public function test_unauthenticated_current_and_clock_are_rejected(): void
    {
        $headers = [
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ];
        $this->withHeaders($headers)->getJson('/api/student/live-competitions/sessions/1/current')
            ->assertStatus(401)->assertJson(['status' => false, 'errNum' => 'E3001']);
        $this->withHeaders($headers)->postJson('/api/student/live-competitions/sessions/1/start-question-clock')
            ->assertStatus(401)->assertJson(['status' => false, 'errNum' => 'E3001']);
    }

    public function test_current_routes_are_flagged_student(): void
    {
        foreach ([
            ['api/student/live-competitions/sessions/{id}/current', 'GET'],
            ['api/student/live-competitions/sessions/{id}/start-question-clock', 'POST'],
        ] as [$uri, $method]) {
            $route = collect(Route::getRoutes())->first(function ($route) use ($uri, $method) {
                return $route->uri() === $uri && in_array($method, $route->methods(), true);
            });
            $this->assertNotNull($route, $uri);
            $middleware = $route->gatherMiddleware();
            $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
            $this->assertContains('checkStudentToken:user-api', $middleware);
            $this->assertContains('checkSecretApi', $middleware);
        }
    }

    public function test_lobby_mode_for_joined_student(): void
    {
        $lobby = $this->openLobbyWithStudents([21]);
        $this->joinStudents($lobby['id'], [21]);
        $this->actingStudent(21);
        $payload = $this->current($lobby['id'])->getData(true)['current'];
        $this->assertSame('lobby', $payload['mode']);
        $this->assertSame(409, $this->startClock($lobby['id'])->getStatusCode());
    }

    /**
     * @return LiveGameSessionQuestion[]
     */
    private function snapshots(?int $sessionId = null): array
    {
        $query = LiveGameSessionQuestion::query()->orderBy('sort_order')->orderBy('id');
        if ($sessionId) {
            $query->where('live_game_session_id', $sessionId);
        }

        return $query->get()->all();
    }

    private function current($sessionId)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/current',
            'GET'
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->current($sessionId, $request);
    }

    private function startClock($sessionId)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/start-question-clock',
            'POST'
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->startQuestionClock($sessionId, $request);
    }

    private function answer($sessionId, array $body)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/answers',
            'POST',
            $body
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->answer($sessionId, $request);
    }

    private function reinforce($sessionId, array $body)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/reinforce',
            'POST',
            $body
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->reinforce($sessionId, $request);
    }

    /**
     * @param  int[]  $joinStudentIds
     * @return array<string,mixed>
     */
    private function openPlaying(array $joinStudentIds, int $classId = 1, string $type = 'classic', int $questionCount = 2): array
    {
        $lobby = $this->openLobbyWithStudents($joinStudentIds, '10:00', $classId, $type, $questionCount);
        $this->joinStudents($lobby['id'], $joinStudentIds);
        $this->actingTeacher(10);
        $this->app->make(LiveCompetitionSessionService::class)
            ->beginLobbySession(10, (int) $lobby['id']);

        return LiveGameSession::query()->find($lobby['id'])->toArray();
    }

    /**
     * @param  int[]  $studentIds
     * @return array<string,mixed>
     */
    private function openLobbyWithStudents(
        array $studentIds,
        string $time = '10:00',
        int $classId = 1,
        string $type = 'classic',
        int $questionCount = 2
    ): array {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, $classId, 5);
        foreach ($studentIds as $id) {
            $this->insertStudent($id, $classId, 5, '1', 'Student '.$id);
        }
        $game = $this->publishedEntitledGame(5, $time, $type, $questionCount);

        return $this->app->make(LiveCompetitionSessionService::class)
            ->createLobbySession($teacher->id, $game->id, $classId, [5]);
    }

    /**
     * @param  int[]  $studentIds
     */
    private function joinStudents($sessionId, array $studentIds): void
    {
        $service = $this->app->make(LiveCompetitionSessionService::class);
        foreach ($studentIds as $studentId) {
            $service->joinLobbySession((int) $studentId, (int) $sessionId);
        }
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

    private function publishedEntitledGame(
        int $schoolId,
        string $time = '10:00',
        string $type = 'classic',
        int $questionCount = 2
    ): LiveGame {
        $game = LiveGame::create([
            'name' => 'Entitled '.$type,
            'time' => $time,
            'type' => $type,
            'level' => 1,
            'status' => LiveGame::STATUS_PUBLISHED,
            'created_by' => 1,
        ]);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => $schoolId]);
        $bank = [
            ['What fuel?', 'Wood', 'Sun', 'Wood', 'Rocks', 'Leaves'],
            ['What to drink?', 'Water', 'Sand', 'Water', 'Oil', 'Smoke'],
            ['What to breathe?', 'Air', 'Mud', 'Air', 'Stone', 'Ice'],
        ];
        for ($i = 0; $i < $questionCount; $i++) {
            $row = $bank[$i];
            LiveGameQuestion::create([
                'live_game_id' => $game->id,
                'question' => $row[0],
                'correct_answer' => $row[1],
                'answer_type' => 'text',
                'answer1' => $row[2],
                'answer2' => $row[3],
                'answer3' => $row[4],
                'answer4' => $row[5],
                'sort_order' => $i + 1,
            ]);
        }

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

    private function methodBody(string $source, string $method): string
    {
        $start = strpos($source, 'function '.$method);
        $this->assertNotFalse($start, $method.' is missing');
        $brace = strpos($source, '{', $start);
        $depth = 0;
        $end = $brace;
        $length = strlen($source);
        for ($i = $brace; $i < $length; $i++) {
            if ($source[$i] === '{') {
                $depth++;
            } elseif ($source[$i] === '}') {
                $depth--;
                if ($depth === 0) {
                    $end = $i;
                    break;
                }
            }
        }

        return substr($source, $brace, $end - $brace + 1);
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
        Schema::create('live_game_session_teams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->string('name');
            $table->string('color')->default('#f4c430');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('coins')->default(0);
            $table->timestamps();
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
        Schema::create('live_game_session_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('live_game_session_question_id');
            $table->string('answer');
            $table->boolean('correct')->default(false);
            $table->integer('coins_delta')->default(0);
            $table->unsignedInteger('elapsed_ms')->nullable();
            $table->boolean('timed_out')->default(false);
            $table->boolean('is_retry')->default(false);
            $table->boolean('is_reinforce')->default(false);
            $table->unsignedTinyInteger('attempt')->default(1);
            $table->timestamps();
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
