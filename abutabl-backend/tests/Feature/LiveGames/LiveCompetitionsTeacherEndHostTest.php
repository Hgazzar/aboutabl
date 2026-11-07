<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\AdminControllers\LiveCompetitionsTeacherController;
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
 * Slice C.9 + C.10 — teacher end/finalize and host payload; student ended results.
 * sqlite :memory: only; no migrate, no onesave.
 *
 * SQLite does not honor MySQL FOR UPDATE row locks, so these tests cannot
 * prove real concurrent End-vs-answer safety. Lock ordering is asserted by
 * inspecting endSession source.
 */
class LiveCompetitionsTeacherEndHostTest extends TestCase
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

    public function test_owning_teacher_can_end_playing_session(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21, 22]);
        $version = (int) LiveGameSession::first()->live_version;
        $this->actingTeacher(10);

        $response = $this->end($playing['id']);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['status']);
        $this->assertSame(LiveGameSession::STATUS_ENDED, $payload['host']['status']);
        $session = LiveGameSession::first();
        $this->assertSame(LiveGameSession::STATUS_ENDED, $session->status);
        $this->assertEquals($now, $session->ends_at);
        $this->assertSame($version + 1, (int) $session->live_version);
        $this->assertNotNull($session->class_accuracy);
    }

    public function test_non_owner_teacher_with_class_access_cannot_end(): void
    {
        $playing = $this->openPlaying([21]);
        $other = $this->actingTeacher(11);
        $this->assignClass($other->id, 1, 5);

        $response = $this->end($playing['id']);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_PLAYING, LiveGameSession::first()->status);
    }

    public function test_owner_without_current_class_access_cannot_end(): void
    {
        $playing = $this->openPlaying([21]);
        TeachersGrades::query()->where('user_id', 10)->delete();
        $this->actingTeacher(10);

        $response = $this->end($playing['id']);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_PLAYING, LiveGameSession::first()->status);
    }

    public function test_lobby_end_returns_409(): void
    {
        $lobby = $this->openLobbyWithStudents([21]);
        $this->actingTeacher(10);
        $response = $this->end($lobby['id']);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_LOBBY, LiveGameSession::first()->status);
    }

    public function test_owning_teacher_can_cancel_lobby_before_begin(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $lobby = $this->openLobbyWithStudents([21, 22]);
        $this->joinStudents($lobby['id'], [21]);
        $this->actingTeacher(10);

        $pendingBefore = \App\Models\LiveGameSessionInvite::query()
            ->where('live_game_session_id', $lobby['id'])
            ->where('status', \App\Models\LiveGameSessionInvite::STATUS_PENDING)
            ->count();
        $this->assertGreaterThan(0, $pendingBefore);

        $response = $this->cancelLobby($lobby['id']);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['status']);
        $this->assertSame(LiveGameSession::STATUS_ENDED, $payload['host']['status']);
        $this->assertTrue($payload['host']['cancelled']);
        $session = LiveGameSession::first();
        $this->assertSame(LiveGameSession::STATUS_ENDED, $session->status);
        $this->assertNull($session->started_at);
        $this->assertEquals($now, $session->ends_at);
        $this->assertSame(
            0,
            \App\Models\LiveGameSessionInvite::query()
                ->where('live_game_session_id', $lobby['id'])
                ->where('status', \App\Models\LiveGameSessionInvite::STATUS_PENDING)
                ->count()
        );

        $this->actingStudent(21);
        $current = $this->current($lobby['id'])->getData(true);
        $this->assertTrue($current['status']);
        $this->assertSame(LiveGameSession::STATUS_ENDED, $current['current']['status']);
        $this->assertTrue($current['current']['cancelled']);
    }

    public function test_cancel_lobby_rejects_playing_session(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingTeacher(10);
        $response = $this->cancelLobby($playing['id']);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_PLAYING, LiveGameSession::first()->status);
    }

    public function test_cancel_lobby_is_idempotent_when_already_ended(): void
    {
        $lobby = $this->openLobbyWithStudents([21]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->cancelLobby($lobby['id'])->getStatusCode());
        $version = (int) LiveGameSession::first()->live_version;

        $second = $this->cancelLobby($lobby['id']);
        $this->assertSame(200, $second->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_ENDED, $second->getData(true)['host']['status']);
        $this->assertTrue($second->getData(true)['host']['cancelled']);
        $this->assertSame($version, (int) LiveGameSession::first()->live_version);
    }

    public function test_repeated_end_is_idempotent(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->end($playing['id'])->getStatusCode());
        $version = (int) LiveGameSession::first()->live_version;
        $endsAt = LiveGameSession::first()->ends_at->toDateTimeString();
        $accuracy = LiveGameSession::first()->class_accuracy;

        $second = $this->end($playing['id']);
        $this->assertSame(200, $second->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_ENDED, $second->getData(true)['host']['status']);
        $this->assertSame($version, (int) LiveGameSession::first()->live_version);
        $this->assertSame($endsAt, LiveGameSession::first()->ends_at->toDateTimeString());
        $this->assertEquals($accuracy, LiveGameSession::first()->class_accuracy);
    }

    public function test_pending_reward_and_reinforce_cleared_without_settlement(): void
    {
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::first();
        LiveGameSessionPlayer::query()->update([
            'coins' => 55,
            'reward_pending' => true,
            'reward_type' => 'chest',
            'reward_data' => ['options' => [['risk' => 'safe']]],
            'pending_reinforce' => true,
            'reinforce_question_id' => $snapshot->id,
        ]);
        $this->actingTeacher(10);

        $this->assertSame(200, $this->end($playing['id'])->getStatusCode());
        $player = LiveGameSessionPlayer::first();
        $this->assertSame(55, (int) $player->coins);
        $this->assertFalse((bool) $player->reward_pending);
        $this->assertFalse((bool) $player->pending_reinforce);
        $this->assertNull($player->reinforce_question_id);
    }

    public function test_report_uses_snapshot_ids_and_first_attempt_formula(): void
    {
        $playing = $this->openPlaying([21, 22]);
        $snapshot = LiveGameSessionQuestion::first();
        LiveGameSessionAnswer::create([
            'live_game_session_id' => $playing['id'],
            'student_id' => 21,
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
            'correct' => true,
            'is_retry' => false,
            'is_reinforce' => false,
            'attempt' => 1,
        ]);
        LiveGameSessionAnswer::create([
            'live_game_session_id' => $playing['id'],
            'student_id' => 22,
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Sun',
            'correct' => false,
            'is_retry' => false,
            'is_reinforce' => false,
            'attempt' => 1,
        ]);
        LiveGameSessionAnswer::create([
            'live_game_session_id' => $playing['id'],
            'student_id' => 21,
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
            'correct' => true,
            'is_retry' => false,
            'is_reinforce' => true,
            'attempt' => 1,
            'coins_delta' => 3,
        ]);
        // Mutate catalog; report must keep frozen snapshot text + snapshot PK.
        LiveGameQuestion::query()->update(['question' => 'Catalog mutated']);
        $this->actingTeacher(10);

        $host = $this->app->make(LiveCompetitionSessionService::class)
            ->endSession(10, (int) $playing['id']);
        $this->assertEquals(50.0, (float) $host['class_accuracy']);
        $this->assertSame(2, (int) $host['answers_total']);
        $this->assertSame(1, (int) $host['answers_correct']);
        $this->assertSame((int) $snapshot->id, (int) $host['hardest'][0]['id']);
        $this->assertSame('What fuel?', $host['hardest'][0]['question']);
        $this->assertNotSame('Catalog mutated', $host['hardest'][0]['question']);
        $this->assertSame(1, (int) $host['hardest'][0]['wrong']);
        $this->assertSame(50, (int) $host['hardest'][0]['miss_rate']);
        $this->assertEquals(50.0, (float) LiveGameSession::first()->class_accuracy);
    }

    public function test_fire_lit_true_and_false_conditions(): void
    {
        $playing = $this->openPlaying([21, 22]);
        $snapshot = LiveGameSessionQuestion::first();
        LiveGameSessionAnswer::create([
            'live_game_session_id' => $playing['id'],
            'student_id' => 21,
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
            'correct' => true,
            'is_retry' => false,
            'is_reinforce' => false,
            'attempt' => 1,
        ]);
        LiveGameSession::query()->update(['firewood' => 0]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->end($playing['id'])->getStatusCode());
        $this->assertFalse((bool) LiveGameSession::first()->fire_lit);

        $again = $this->openPlaying([31, 32], 2);
        $snap2 = LiveGameSessionQuestion::query()->where('live_game_session_id', $again['id'])->first();
        LiveGameSessionAnswer::create([
            'live_game_session_id' => $again['id'],
            'student_id' => 31,
            'live_game_session_question_id' => $snap2->id,
            'answer' => 'Wood',
            'correct' => true,
            'is_retry' => false,
            'is_reinforce' => false,
            'attempt' => 1,
        ]);
        LiveGameSession::query()->where('id', $again['id'])->update(['firewood' => 2]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->end($again['id'])->getStatusCode());
        $this->assertTrue((bool) LiveGameSession::query()->find($again['id'])->fire_lit);
    }

    public function test_team_totals_and_stable_ranking(): void
    {
        $lobby = $this->openLobbyWithStudents([21, 22, 23]);
        LiveGameSession::query()->where('id', $lobby['id'])->update(['team_mode' => true]);
        $this->joinStudents($lobby['id'], [21, 22, 23]);
        $this->actingTeacher(10);
        $this->app->make(LiveCompetitionSessionService::class)
            ->beginLobbySession(10, (int) $lobby['id']);

        LiveGameSessionPlayer::query()->where('student_id', 21)->update(['score' => 2, 'coins' => 10]);
        LiveGameSessionPlayer::query()->where('student_id', 22)->update(['score' => 2, 'coins' => 30]);
        LiveGameSessionPlayer::query()->where('student_id', 23)->update(['score' => 1, 'coins' => 99]);

        $host = $this->end($lobby['id'])->getData(true)['host'];
        $this->assertSame(22, (int) $host['players'][0]['id']);
        $this->assertSame(1, (int) $host['players'][0]['rank']);
        $this->assertSame(21, (int) $host['players'][1]['id']);
        $this->assertSame(2, (int) $host['players'][1]['rank']);
        $this->assertSame(23, (int) $host['players'][2]['id']);
        $this->assertNotEmpty($host['teams']);
        $teamScore = collect($host['teams'])->sum('score');
        $this->assertSame(5, (int) $teamScore);
    }

    public function test_new_session_allowed_after_end(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->end($playing['id'])->getStatusCode());

        $created = $this->app->make(LiveCompetitionSessionService::class)
            ->createLobbySession(10, (int) LiveGame::first()->id, 1, [5]);
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $created['status']);
        $this->assertSame(2, LiveGameSession::count());
    }

    public function test_student_mutations_rejected_after_end(): void
    {
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::first();
        $this->actingTeacher(10);
        $this->assertSame(200, $this->end($playing['id'])->getStatusCode());
        $this->actingStudent(21);

        $service = $this->app->make(LiveCompetitionSessionService::class);
        $version = (int) LiveGameSession::first()->live_version;
        $coins = (int) LiveGameSessionPlayer::first()->coins;
        $answers = LiveGameSessionAnswer::count();

        foreach ([
            function () use ($service, $playing, $snapshot) {
                $service->answerSessionQuestion(21, (int) $playing['id'], (int) $snapshot->id, 'Wood');
            },
            function () use ($service, $playing, $snapshot) {
                $service->timeoutSessionQuestion(21, (int) $playing['id'], (int) $snapshot->id);
            },
            function () use ($service, $playing) {
                $service->reinforceSessionQuestion(21, (int) $playing['id'], 'Wood');
            },
            function () use ($service, $playing) {
                $service->claimSessionReward(21, (int) $playing['id'], ['choice' => 0]);
            },
            function () use ($service, $playing) {
                $service->useSessionPower(21, (int) $playing['id']);
            },
            function () use ($service, $playing) {
                $service->startQuestionClock(21, (int) $playing['id']);
            },
        ] as $call) {
            try {
                $call();
                $this->fail('Post-end student write should be rejected');
            } catch (\RuntimeException $ex) {
                $this->assertGreaterThanOrEqual(400, (int) $ex->getCode());
            }
        }

        $this->assertSame($version, (int) LiveGameSession::first()->live_version);
        $this->assertSame($coins, (int) LiveGameSessionPlayer::first()->coins);
        $this->assertSame($answers, LiveGameSessionAnswer::count());
        $this->assertSame(LiveGameSession::STATUS_ENDED, LiveGameSession::first()->status);
    }

    public function test_ended_hacking_pick_password_does_not_mutate(): void
    {
        $playing = $this->openPlaying([21], 1, 'hacking');
        LiveGameSessionPlayer::query()->update([
            'hack_password' => null,
            'password_options' => null,
        ]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->end($playing['id'])->getStatusCode());

        $player = LiveGameSessionPlayer::first();
        $this->assertNull($player->hack_password);
        $this->assertTrue(empty($player->password_options));
        $version = (int) LiveGameSession::first()->live_version;
        $answers = LiveGameSessionAnswer::count();
        $coins = (int) $player->coins;
        $power = $player->power;
        $powerUsed = (bool) $player->power_used;

        $this->actingStudent(21);
        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->pickSessionPassword(21, (int) $playing['id'], 'Aa1Bb');
            $this->fail('Expected ended hacking pick-password rejection');
        } catch (\RuntimeException $ex) {
            $this->assertSame(409, (int) $ex->getCode());
            $this->assertSame('Competition is not active.', $ex->getMessage());
        }

        $player = LiveGameSessionPlayer::first()->fresh();
        $this->assertNull($player->hack_password);
        $this->assertTrue(empty($player->password_options));
        $this->assertSame($coins, (int) $player->coins);
        $this->assertSame($power, $player->power);
        $this->assertSame($powerUsed, (bool) $player->power_used);
        $this->assertSame($version, (int) LiveGameSession::first()->live_version);
        $this->assertSame(LiveGameSession::STATUS_ENDED, LiveGameSession::first()->status);
        $this->assertSame($answers, LiveGameSessionAnswer::count());
    }

    public function test_ended_claim_with_cleared_pending_does_not_mutate(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->end($playing['id'])->getStatusCode());

        $player = LiveGameSessionPlayer::first();
        $this->assertFalse((bool) $player->reward_pending);
        $version = (int) LiveGameSession::first()->live_version;
        $coins = (int) $player->coins;
        $answers = LiveGameSessionAnswer::count();
        $rewardType = $player->reward_type;
        $rewardData = $player->reward_data;

        $this->actingStudent(21);
        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->claimSessionReward(21, (int) $playing['id'], ['choice' => 0]);
            $this->fail('Expected ended claim rejection');
        } catch (\RuntimeException $ex) {
            $this->assertSame(409, (int) $ex->getCode());
            $this->assertSame('Competition is not active.', $ex->getMessage());
        }

        $player = LiveGameSessionPlayer::first()->fresh();
        $this->assertSame($coins, (int) $player->coins);
        $this->assertFalse((bool) $player->reward_pending);
        $this->assertSame($rewardType, $player->reward_type);
        $this->assertEquals($rewardData, $player->reward_data);
        $this->assertSame($version, (int) LiveGameSession::first()->live_version);
        $this->assertSame($answers, LiveGameSessionAnswer::count());
        $this->assertSame(LiveGameSession::STATUS_ENDED, LiveGameSession::first()->status);
    }

    public function test_ended_claim_with_stale_pending_still_rejects_before_engine(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->end($playing['id'])->getStatusCode());

        LiveGameSessionPlayer::query()->update([
            'coins' => 44,
            'reward_pending' => true,
            'reward_type' => 'chest',
            'reward_data' => ['options' => [['risk' => 'safe', 'label' => 'Safe 5']]],
        ]);
        $version = (int) LiveGameSession::first()->live_version;
        $answers = LiveGameSessionAnswer::count();

        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $body = $this->methodBody($source, 'claimSessionReward');
        $statusPos = strpos($body, 'STATUS_PLAYING');
        $pendingPos = strpos($body, 'reward_pending');
        $enginePos = strpos($body, 'claimReward');
        $this->assertNotFalse($statusPos);
        $this->assertNotFalse($pendingPos);
        $this->assertNotFalse($enginePos);
        $this->assertLessThan($pendingPos, $statusPos);
        $this->assertLessThan($enginePos, $statusPos);

        $this->actingStudent(21);
        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->claimSessionReward(21, (int) $playing['id'], ['choice' => 0]);
            $this->fail('Expected stale-pending ended claim rejection');
        } catch (\RuntimeException $ex) {
            $this->assertSame(409, (int) $ex->getCode());
            $this->assertSame('Competition is not active.', $ex->getMessage());
        }

        $player = LiveGameSessionPlayer::first();
        $this->assertSame(44, (int) $player->coins);
        $this->assertTrue((bool) $player->reward_pending);
        $this->assertSame('chest', $player->reward_type);
        $this->assertSame($version, (int) LiveGameSession::first()->live_version);
        $this->assertSame($answers, LiveGameSessionAnswer::count());
        $this->assertSame(LiveGameSession::STATUS_ENDED, LiveGameSession::first()->status);
    }

    public function test_pick_password_status_guard_precedes_engine(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $body = $this->methodBody($source, 'pickSessionPassword');
        $statusPos = strpos($body, 'STATUS_PLAYING');
        $themePos = strpos($body, 'themeType');
        $enginePos = strpos($body, 'pickPassword');
        $this->assertNotFalse($statusPos);
        $this->assertNotFalse($themePos);
        $this->assertNotFalse($enginePos);
        $this->assertLessThan($themePos, $statusPos);
        $this->assertLessThan($enginePos, $statusPos);
    }

    public function test_end_failure_rolls_back(): void
    {
        $playing = $this->openPlaying([21]);
        LiveGameSessionPlayer::query()->update([
            'reward_pending' => true,
            'coins' => 40,
        ]);
        $version = (int) LiveGameSession::first()->live_version;

        LiveGameSession::saving(function ($session) {
            if ($session->isDirty('status') && $session->status === LiveGameSession::STATUS_ENDED) {
                throw new \RuntimeException('forced end failure');
            }
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->endSession(10, (int) $playing['id']);
            $this->fail('Expected end failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced end failure', $ex->getMessage());
        } finally {
            LiveGameSession::flushEventListeners();
        }

        $session = LiveGameSession::first();
        $this->assertSame(LiveGameSession::STATUS_PLAYING, $session->status);
        $this->assertSame($version, (int) $session->live_version);
        $this->assertTrue((bool) LiveGameSessionPlayer::first()->reward_pending);
        $this->assertSame(40, (int) LiveGameSessionPlayer::first()->coins);
    }

    public function test_end_locks_session_first(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $body = $this->methodBody($source, 'endSession');
        $sessionQuery = strpos($body, 'LiveGameSession::query()');
        $sessionLock = strpos($body, 'lockForUpdate');
        $finalize = strpos($body, 'finalize');
        $this->assertNotFalse($sessionQuery);
        $this->assertNotFalse($sessionLock);
        $this->assertNotFalse($finalize);
        $this->assertLessThan($sessionLock, $sessionQuery);
        $this->assertLessThan($finalize, $sessionLock);
    }

    public function test_host_payload_lobby_playing_ended_and_read_only(): void
    {
        $lobby = $this->openLobbyWithStudents([21]);
        $this->joinStudents($lobby['id'], [21]);
        $this->actingTeacher(10);
        $lobbyHost = $this->host($lobby['id'])->getData(true)['host'];
        $this->assertSame(LiveGameSession::STATUS_LOBBY, $lobbyHost['status']);
        $this->assertSame(1, (int) $lobbyHost['joined_total']);
        $this->assertSame(1, (int) $lobbyHost['invited_total']);

        $this->app->make(LiveCompetitionSessionService::class)
            ->beginLobbySession(10, (int) $lobby['id']);
        LiveGameSessionPlayer::query()->update([
            'hack_password' => 'Secret1',
            'score' => 1,
        ]);
        $version = (int) LiveGameSession::first()->live_version;
        $playingHost = $this->host($lobby['id'])->getData(true)['host'];
        $encoded = json_encode($playingHost);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, $playingHost['status']);
        $this->assertSame('S', $playingHost['players'][0]['password_hint']);
        $this->assertStringNotContainsString('Secret1', $encoded);
        $this->assertStringNotContainsString('correct_answer', $encoded);
        $this->assertStringNotContainsString('Wood', $encoded);
        $this->assertSame($version, (int) LiveGameSession::first()->live_version);

        $this->end($lobby['id']);
        $endedVersion = (int) LiveGameSession::first()->live_version;
        $endedHost = $this->host($lobby['id'])->getData(true)['host'];
        $this->assertSame(LiveGameSession::STATUS_ENDED, $endedHost['status']);
        $this->assertArrayHasKey('class_accuracy', $endedHost);
        $this->assertArrayHasKey('hardest', $endedHost);
        $this->assertSame($endedVersion, (int) LiveGameSession::first()->live_version);
    }

    public function test_host_rejects_non_owner_and_keeps_lobby_contract(): void
    {
        $playing = $this->openPlaying([21]);
        $other = $this->actingTeacher(11);
        $this->assignClass($other->id, 1, 5);
        $this->assertSame(403, $this->host($playing['id'])->getStatusCode());

        $lobby = $this->openLobbyWithStudents([31], '10:00', 2);
        $this->actingTeacher(10);
        $legacy = $this->app->make(LiveCompetitionsTeacherController::class)->showSession($lobby['id']);
        $this->assertSame(200, $legacy->getStatusCode());
        $this->assertArrayHasKey('lobby', $legacy->getData(true));
        $this->assertArrayHasKey('eligible_students', $legacy->getData(true)['lobby']);
    }

    public function test_owner_without_current_class_access_cannot_host(): void
    {
        $playing = $this->openPlaying([21]);
        TeachersGrades::query()->where('user_id', 10)->delete();
        $this->actingTeacher(10);

        $this->assertSame(403, $this->host($playing['id'])->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_PLAYING, LiveGameSession::first()->status);
    }

    public function test_student_ended_current_is_personal_only(): void
    {
        $playing = $this->openPlaying([21, 22]);
        LiveGameSessionPlayer::query()->where('student_id', 21)->update([
            'score' => 2,
            'coins' => 40,
            'best_streak' => 2,
            'fastest_ms' => 1200,
        ]);
        LiveGameSessionPlayer::query()->where('student_id', 22)->update([
            'score' => 1,
            'coins' => 99,
            'best_streak' => 9,
            'hack_password' => 'PeerPass',
        ]);
        $this->actingTeacher(10);
        $this->end($playing['id']);

        $this->actingStudent(21);
        $mine = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame('done', $mine['mode']);
        $this->assertTrue($mine['done']);
        $this->assertSame(1, (int) $mine['rank']);
        $this->assertSame(2, (int) $mine['score']);
        $this->assertSame(40, (int) $mine['coins']);
        $this->assertSame(2, (int) $mine['best_streak']);
        $this->assertArrayHasKey('class_accuracy', $mine);
        $this->assertArrayHasKey('fire_lit', $mine);
        $this->assertArrayNotHasKey('players', $mine);
        $this->assertArrayNotHasKey('password_hint', $mine);
        $this->assertArrayNotHasKey('hardest', $mine);
        $encoded = json_encode($mine);
        $this->assertStringNotContainsString('PeerPass', $encoded);
        $this->assertStringNotContainsString('Student 22', $encoded);

        $this->actingStudent(22);
        $peer = $this->current($playing['id'])->getData(true)['current'];
        $this->assertSame(2, (int) $peer['rank']);
        $this->assertSame(1, (int) $peer['score']);
        $this->assertSame(99, (int) $peer['coins']);
        $this->assertArrayNotHasKey('password_hint', $peer);
    }

    public function test_routes_are_flagged_teacher(): void
    {
        foreach ([
            ['api/live-competitions/sessions/{id}/end', 'POST'],
            ['api/live-competitions/sessions/{id}/host', 'GET'],
        ] as [$uri, $method]) {
            $route = collect(Route::getRoutes())->first(function ($route) use ($uri, $method) {
                return $route->uri() === $uri && in_array($method, $route->methods(), true);
            });
            $this->assertNotNull($route, $uri);
            $middleware = $route->gatherMiddleware();
            $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
            $this->assertContains('checkUserToken:admin-api', $middleware);
            $this->assertContains('checkSecretApi', $middleware);
            $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
        }
    }

    public function test_get_host_source_delegates_writes_to_auto_end_helper(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $body = $this->methodBody($source, 'getHostPayload');
        $this->assertTrue(str_contains($body, 'autoEndIfExpired'));
        $this->assertFalse(str_contains($body, 'lockForUpdate'));
        $this->assertFalse(str_contains($body, '->finalize('));
        $this->assertFalse(str_contains($body, 'increment'));
        $this->assertFalse(str_contains($body, '->update('));
        $this->assertFalse(str_contains($body, '->save('));
    }

    public function test_host_auto_ends_when_duration_expires(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $version = (int) LiveGameSession::first()->live_version;
        LiveGameSession::query()->where('id', $playing['id'])->update([
            'ends_at' => $now->copy()->subSecond(),
        ]);
        $this->actingTeacher(10);

        $payload = $this->host($playing['id'])->getData(true);
        $this->assertTrue($payload['status']);
        $this->assertSame(LiveGameSession::STATUS_ENDED, $payload['host']['status']);
        $this->assertFalse($payload['host']['cancelled']);
        $session = LiveGameSession::first();
        $this->assertSame(LiveGameSession::STATUS_ENDED, $session->status);
        $this->assertSame($version + 1, (int) $session->live_version);
        $this->assertNotNull($session->class_accuracy);
    }

    public function test_student_current_auto_ends_when_duration_expires(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        LiveGameSession::query()->where('id', $playing['id'])->update([
            'ends_at' => $now->copy()->subMinute(),
        ]);
        $this->actingStudent(21);

        $payload = $this->current($playing['id'])->getData(true);
        $this->assertTrue($payload['status']);
        $this->assertSame(LiveGameSession::STATUS_ENDED, $payload['current']['status']);
        $this->assertSame('done', $payload['current']['mode']);
        $this->assertFalse($payload['current']['cancelled']);
        $this->assertArrayHasKey('rank', $payload['current']);
        $this->assertSame(LiveGameSession::STATUS_ENDED, LiveGameSession::first()->status);
    }

    public function test_invitations_list_auto_ends_expired_playing_session(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        LiveGameSession::query()->where('id', $playing['id'])->update([
            'ends_at' => $now->copy()->subMinutes(2),
        ]);
        $this->actingStudent(21);

        $request = Request::create('/api/student/live-competitions/invitations', 'GET');
        $this->app->instance('request', $request);
        $response = $this->app->make(LiveCompetitionsStudentController::class)->invitations();
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['status']);
        $row = collect($payload['invitations'])->firstWhere('session.id', $playing['id']);
        $this->assertNotNull($row);
        $this->assertSame(LiveGameSession::STATUS_ENDED, $row['session']['status']);
        $this->assertTrue($row['joined']);
        $this->assertFalse($row['can_join']);
        $this->assertSame(LiveGameSession::STATUS_ENDED, LiveGameSession::first()->status);
    }

    public function test_answer_rejected_after_duration_expires_and_session_ends(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshotId = (int) LiveGameSessionQuestion::first()->id;
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(2),
        ]);
        LiveGameSession::query()->where('id', $playing['id'])->update([
            'ends_at' => $now->copy()->subSecond()->toDateTimeString(),
        ]);
        $fresh = LiveGameSession::query()->find($playing['id']);
        $this->assertTrue(
            $fresh->ends_at->lte(now()),
            'fixture ends_at must be expired before answer'
        );
        $this->actingStudent(21);

        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$playing['id'].'/answer',
            'POST',
            [
                'live_game_session_question_id' => $snapshotId,
                'answer' => 'Wood',
            ]
        );
        $this->app->instance('request', $request);
        $response = $this->app->make(LiveCompetitionsStudentController::class)
            ->answer($playing['id'], $request);
        $payload = $response->getData(true);

        $this->assertSame(409, $response->getStatusCode(), json_encode($payload));
        $this->assertSame('Competition is not active.', $payload['msg'] ?? null);
        $this->assertSame(LiveGameSession::STATUS_ENDED, LiveGameSession::first()->status);
    }

    public function test_future_ends_at_does_not_auto_end(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $this->assertTrue(
            LiveGameSession::first()->ends_at->gt($now),
            'begin should schedule ends_at in the future'
        );
        $this->actingTeacher(10);

        $payload = $this->host($playing['id'])->getData(true);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, $payload['host']['status']);
        $this->assertSame(LiveGameSession::STATUS_PLAYING, LiveGameSession::first()->status);
    }

    public function test_auto_end_is_idempotent_with_teacher_end(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        LiveGameSession::query()->where('id', $playing['id'])->update([
            'ends_at' => $now->copy()->subSecond(),
        ]);
        $this->actingTeacher(10);
        $this->assertSame(200, $this->host($playing['id'])->getStatusCode());
        $version = (int) LiveGameSession::first()->live_version;
        $endsAt = LiveGameSession::first()->ends_at->toDateTimeString();

        $second = $this->end($playing['id']);
        $this->assertSame(200, $second->getStatusCode());
        $this->assertSame(LiveGameSession::STATUS_ENDED, $second->getData(true)['host']['status']);
        $this->assertSame($version, (int) LiveGameSession::first()->live_version);
        $this->assertSame($endsAt, LiveGameSession::first()->ends_at->toDateTimeString());
    }

    /**
     * @param  int[]  $joinStudentIds
     * @return array<string,mixed>
     */
    private function openPlaying(array $joinStudentIds, int $classId = 1, string $type = 'classic'): array
    {
        $lobby = $this->openLobbyWithStudents($joinStudentIds, '10:00', $classId, $type);
        $this->joinStudents($lobby['id'], $joinStudentIds);
        $this->actingTeacher(10);
        $this->app->make(LiveCompetitionSessionService::class)
            ->beginLobbySession(10, (int) $lobby['id']);

        return LiveGameSession::query()->find($lobby['id'])->toArray();
    }

    private function end($sessionId)
    {
        return $this->app->make(LiveCompetitionsTeacherController::class)->endSession($sessionId);
    }

    private function cancelLobby($sessionId)
    {
        return $this->app->make(LiveCompetitionsTeacherController::class)->cancelLobbySession($sessionId);
    }

    private function host($sessionId)
    {
        return $this->app->make(LiveCompetitionsTeacherController::class)->hostSession($sessionId);
    }

    private function current($sessionId)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/current',
            'GET'
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->current($sessionId, $request);
    }

    /**
     * @param  int[]  $studentIds
     * @return array<string,mixed>
     */
    private function openLobbyWithStudents(
        array $studentIds,
        string $time = '10:00',
        int $classId = 1,
        string $type = 'classic'
    ): array {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, $classId, 5);
        foreach ($studentIds as $id) {
            $this->insertStudent($id, $classId, 5, '1', 'Student '.$id);
        }
        $game = $this->publishedEntitledGame(5, $time, $type);

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
        string $type = 'classic'
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
        LiveGameQuestion::create([
            'live_game_id' => $game->id,
            'question' => 'What fuel?',
            'correct_answer' => 'Wood',
            'answer_type' => 'text',
            'answer1' => 'Sun',
            'answer2' => 'Wood',
            'answer3' => 'Rocks',
            'answer4' => 'Leaves',
            'explanation' => 'Trees burn.',
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

    private function methodBody(string $source, string $method): string
    {
        $start = strpos($source, 'function '.$method);
        $this->assertNotFalse($start, $method.' is missing');
        $brace = strpos($source, '{', $start);
        $this->assertNotFalse($brace);
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
