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
use App\Support\LiveCompetitions\LiveCompetitionEngine;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.6C — student claim-reward. sqlite :memory: only; no migrate, no onesave.
 *
 * SQLite does not honor MySQL FOR UPDATE row locks, so these tests cannot
 * prove real concurrent-claim safety. Lock ordering is asserted by
 * inspecting claimSessionReward source.
 *
 * Standalone claimReward does not require session status=playing.
 */
class LiveCompetitionsStudentClaimRewardTest extends TestCase
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

    public function test_no_pending_reward_does_not_mutate(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingStudent(21);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->claim($playing['id'], ['choice' => 0]);
        $player = LiveGameSessionPlayer::first();

        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame(20, (int) $player->coins);
        $this->assertFalse((bool) $player->reward_pending);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
        $this->assertSame(0, LiveGameSessionAnswer::count());
    }

    public function test_gold_quest_correct_answer_awards_one_session_coin_without_chest(): void
    {
        $playing = $this->openPlaying([21], 1, 'gold_quest');
        $snapshot = LiveGameSessionQuestion::query()->first();
        $this->actingStudent(21);
        $this->startClock($playing['id']);
        $response = $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
        ]);
        $payload = $response->getData(true);
        $player = LiveGameSessionPlayer::first();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['answer']['correct']);
        $this->assertSame(1, $payload['answer']['coins_awarded']);
        $this->assertSame(21, $payload['answer']['coins']);
        $this->assertSame(1, $payload['answer']['score']);
        $this->assertFalse($payload['answer']['reward_pending']);
        $this->assertFalse((bool) $player->reward_pending);
        $this->assertNull($player->reward_type);
        $this->assertSame(21, (int) $player->coins);
        $this->assertSame(1, (int) LiveGameSessionAnswer::first()->coins_delta);
    }

    public function test_gold_quest_incorrect_answer_awards_zero_coins(): void
    {
        $playing = $this->openPlaying([21], 1, 'gold_quest');
        $snapshot = LiveGameSessionQuestion::query()->first();
        $this->actingStudent(21);
        $this->startClock($playing['id']);
        $response = $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Sun',
        ]);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($payload['answer']['correct']);
        $this->assertSame(0, $payload['answer']['coins_awarded']);
        $this->assertSame(20, $payload['answer']['coins']);
        $this->assertSame('Wood', $payload['answer']['correct_answer']);
        $this->assertSame(20, (int) LiveGameSessionPlayer::first()->coins);
        $this->assertSame(0, (int) LiveGameSessionAnswer::first()->coins_delta);
    }

    public function test_gold_quest_fixed_trio_chest_every_three_correct_answers(): void
    {
        $playing = $this->openPlaying([21], 1, 'gold_quest');
        $snapshot = LiveGameSessionQuestion::query()->first();
        $this->actingStudent(21);
        $player = LiveGameSessionPlayer::first();
        // Two prior corrects already counted; this answer reaches cumulative 3.
        $player->score = 2;
        $player->coins = 22;
        $player->save();

        $this->startClock($playing['id']);
        $response = $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
        ]);
        $payload = $response->getData(true);
        $player = $player->fresh();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(1, $payload['answer']['coins_awarded']);
        $this->assertSame(23, $payload['answer']['coins']);
        $this->assertTrue($payload['answer']['reward_pending']);
        $this->assertSame(3, (int) $player->score);
        $this->assertTrue((bool) $player->reward_pending);
        $this->assertSame('chest', $player->reward_type);
        $this->assertSame('fixed_trio', $player->reward_data['scheme'] ?? null);
        $opts = array_values($player->reward_data['options'] ?? []);
        $this->assertCount(3, $opts);
        $amounts = array_map(static fn ($o) => (int) ($o['coins'] ?? 0), $opts);
        sort($amounts);
        $this->assertSame([5, 10, 20], $amounts);

        $current = $this->app->make(LiveCompetitionsStudentController::class)
            ->current($playing['id']);
        $currentPayload = $current->getData(true)['current'];
        $this->assertSame('reward', $currentPayload['mode']);
        $this->assertCount(3, $currentPayload['reward_options']);
        foreach ($currentPayload['reward_options'] as $opt) {
            $this->assertArrayHasKey('index', $opt);
            $this->assertArrayNotHasKey('coins', $opt);
            $this->assertArrayNotHasKey('risk', $opt);
        }

        $choice = 1;
        $awarded = (int) ($player->reward_data['options'][$choice]['coins'] ?? 0);
        $claim = $this->claim($playing['id'], ['choice' => $choice, 'student_id' => 99]);
        $claimPayload = $claim->getData(true);
        $player = $player->fresh();

        $this->assertSame(200, $claim->getStatusCode());
        $this->assertSame('chest', $claimPayload['claim']['type']);
        $this->assertSame($awarded, $claimPayload['claim']['coins_awarded']);
        $this->assertContains($awarded, [5, 10, 20]);
        $this->assertSame(23 + $awarded, $claimPayload['claim']['coins']);
        $this->assertFalse($claimPayload['claim']['reward_pending']);
        $this->assertFalse((bool) $player->reward_pending);
        $this->assertNull($player->reward_type);
        $this->assertNull($player->reward_data);

        $dup = $this->claim($playing['id'], ['choice' => $choice]);
        $this->assertSame(409, $dup->getStatusCode());
        $this->assertSame(23 + $awarded, (int) LiveGameSessionPlayer::first()->coins);
    }

    public function test_gold_quest_fixed_trio_largest_reward_is_not_fixed_to_one_slot(): void
    {
        $positions = [];
        for ($i = 0; $i < 24; $i++) {
            $playing = $this->openPlaying([30 + $i], $i + 1, 'gold_quest');
            $this->actingStudent(30 + $i);
            $player = LiveGameSessionPlayer::query()->where('student_id', 30 + $i)->first();
            $player->score = 3;
            $player->coins = 20;
            $this->seedAnswer((int) $playing['id'], 30 + $i);
            $session = LiveGameSession::query()->find($playing['id']);
            $engine = new LiveCompetitionEngine();
            $engine->grantReward($session, $player);
            $player->save();
            $opts = array_values($player->reward_data['options'] ?? []);
            foreach ($opts as $index => $opt) {
                if ((int) ($opt['coins'] ?? 0) === 20) {
                    $positions[$index] = ($positions[$index] ?? 0) + 1;
                }
            }
        }
        $this->assertCount(3, $positions, '20-coin chest should appear in multiple slots across rounds');
        $this->assertGreaterThan(0, $positions[0] ?? 0);
        $this->assertGreaterThan(0, $positions[1] ?? 0);
        $this->assertGreaterThan(0, $positions[2] ?? 0);
    }

    public function test_chest_medium_jackpot_empty_and_cursed_outcomes(): void
    {
        $cases = [
            ['coins' => 20, 'message' => 'YOU WIN 20 Coins', 'cursed' => false, 'slip' => 0, 'expect_coins' => 40, 'expect_delta' => 20, 'penalty' => 0],
            ['coins' => 5, 'message' => 'The chest was light — 5 coins', 'cursed' => false, 'slip' => 0, 'expect_coins' => 25, 'expect_delta' => 5, 'penalty' => 0],
            ['coins' => 50, 'message' => 'JACKPOT 50 Coins', 'cursed' => false, 'slip' => 0, 'expect_coins' => 70, 'expect_delta' => 50, 'penalty' => 0],
            ['coins' => 0, 'message' => 'Empty chest!', 'cursed' => false, 'slip' => 0, 'expect_coins' => 20, 'expect_delta' => 0, 'penalty' => 0],
            ['coins' => -15, 'message' => 'Cursed chest! You slip back on the bridge', 'cursed' => true, 'slip' => 15, 'expect_coins' => 5, 'expect_delta' => -15, 'penalty' => 15],
        ];

        foreach ($cases as $i => $case) {
            $playing = $this->openPlaying([21 + $i], $i + 1, 'gold_quest');
            $this->actingStudent(21 + $i);
            $player = LiveGameSessionPlayer::query()->where('student_id', 21 + $i)->first();
            $this->seedAnswer((int) $playing['id'], 21 + $i);
            $this->seedPending($player, 'chest', [
                ['risk' => 'jackpot'],
                ['risk' => 'medium'],
                ['risk' => 'safe'],
            ]);
            $this->forceChest([
                'coins' => $case['coins'],
                'message' => $case['message'],
                'cursed' => $case['cursed'],
                'slip' => $case['slip'],
            ]);

            $response = $this->claim($playing['id'], ['choice' => 0]);
            $payload = $response->getData(true);
            $player = $player->fresh();

            $this->assertSame(200, $response->getStatusCode(), $case['message']);
            $this->assertSame($case['coins'] === -15 ? -15 : ($case['coins'] > 0 ? $case['coins'] : 0), $payload['claim']['coins_awarded']);
            $this->assertSame($case['expect_coins'], $payload['claim']['coins']);
            $this->assertSame($case['message'], $payload['claim']['message']);
            $this->assertFalse((bool) $player->reward_pending);
            $this->assertSame($case['penalty'], (int) $player->progress_penalty);
            $this->assertSame($case['expect_delta'], (int) LiveGameSessionAnswer::query()->where('student_id', 21 + $i)->first()->coins_delta);
        }
    }

    public function test_cursed_chest_uses_bridge_broken_slip(): void
    {
        $playing = $this->openPlaying([21], 1, 'gold_quest');
        LiveGameSession::query()->where('id', $playing['id'])->update(['bridge_broken' => true]);
        $this->actingStudent(21);
        $player = LiveGameSessionPlayer::first();
        $this->seedPending($player, 'chest', [['risk' => 'jackpot'], ['risk' => 'safe'], ['risk' => 'medium']]);
        $this->forceChest([
            'coins' => -15,
            'message' => 'Cursed chest! You slip back on the bridge',
            'cursed' => true,
            'slip' => 20,
        ]);

        $this->assertSame(200, $this->claim($playing['id'], ['choice' => 0])->getStatusCode());
        $this->assertSame(20, (int) LiveGameSessionPlayer::first()->progress_penalty);
        $this->assertSame(5, (int) LiveGameSessionPlayer::first()->coins);
    }

    public function test_chest_streak_multiplier_applies_only_to_positive_coins(): void
    {
        $playing = $this->openPlaying([21], 1, 'gold_quest');
        $this->actingStudent(21);
        $player = LiveGameSessionPlayer::first();
        $player->streak = 3;
        $this->seedPending($player, 'chest', [['risk' => 'safe'], ['risk' => 'medium'], ['risk' => 'jackpot']]);
        $this->seedAnswer((int) $playing['id'], 21);

        $response = $this->claim($playing['id'], ['choice' => 0]);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(10, $payload['claim']['coins_awarded']);
        $this->assertSame(30, $payload['claim']['coins']);
        $this->assertSame('YOU WIN 5 Coins · streak x2', $payload['claim']['message']);
        $this->assertSame(10, (int) LiveGameSessionAnswer::first()->coins_delta);
    }

    public function test_resolve_chest_formulas_match_standalone(): void
    {
        $engine = new LiveCompetitionEngine();
        $safe = $engine->resolveChest(['risk' => 'safe']);
        $this->assertSame(['coins' => 5, 'message' => 'YOU WIN 5 Coins', 'cursed' => false, 'slip' => 0], $safe);

        $source = file_get_contents(app_path('Support/LiveCompetitions/LiveCompetitionEngine.php'));
        $body = $this->methodBody($source, 'resolveChest');
        $this->assertStringContainsString('$chance = $bridgeBroken ? 60 : 80', $body);
        $this->assertStringContainsString("['coins' => 20, 'message' => 'YOU WIN 20 Coins'", $body);
        $this->assertStringContainsString("['coins' => 5, 'message' => 'The chest was light — 5 coins'", $body);
        $this->assertStringContainsString('$jackpot = $bridgeBroken ? 35 : 50', $body);
        $this->assertStringContainsString('$emptyUntil = $bridgeBroken ? 60 : 75', $body);
        $this->assertStringContainsString("['coins' => 50, 'message' => 'JACKPOT 50 Coins'", $body);
        $this->assertStringContainsString("['coins' => 0, 'message' => 'Empty chest!'", $body);
        $this->assertStringContainsString("'coins' => -15", $body);
        $this->assertStringContainsString('$bridgeBroken ? 20 : 15', $body);
        $this->assertFalse(str_contains($this->methodBody($source, 'grantReward'), "'gift'"));
        $this->assertTrue(str_contains($this->methodBody($source, 'claimReward'), "\$type === 'gift'"));
    }

    public function test_protocol_gold_luck_and_hacked_shield_behavior(): void
    {
        $playing = $this->openPlaying([21, 22], 1, 'hacking');
        $this->actingStudent(21);
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $other = LiveGameSessionPlayer::query()->where('student_id', 22)->first();
        $this->seedPending($me, 'protocol', [
            ['protocol' => 'gold'],
            ['protocol' => 'luck'],
            ['protocol' => 'hacked'],
        ]);

        $gold = $this->claim($playing['id'], ['choice' => 0]);
        $me = $me->fresh();
        $this->assertSame(200, $gold->getStatusCode());
        $this->assertSame(40, (int) $me->coins);
        $this->assertSame('gold', $me->last_protocol);
        $this->assertSame(0, (int) LiveGameSessionAnswer::count());
        $this->assertSame('GOLD protocol: +20 coins', $gold->getData(true)['claim']['message']);
        $this->assertSame(0, $gold->getData(true)['claim']['coins_awarded']);

        $this->seedPending($me, 'protocol', [
            ['protocol' => 'gold'],
            ['protocol' => 'luck'],
            ['protocol' => 'hacked'],
        ], ['streak' => 3]);
        $luck = $this->claim($playing['id'], ['choice' => 1]);
        $me = $me->fresh();
        $this->assertTrue((bool) $me->shield);
        $this->assertSame(64, (int) $me->coins);
        $this->assertSame('LUCK protocol: +24 coins and a shield (streak x2)', $luck->getData(true)['claim']['message']);

        $other->shield = true;
        $other->save();
        $this->seedPending($me, 'protocol', [
            ['protocol' => 'gold'],
            ['protocol' => 'luck'],
            ['protocol' => 'hacked'],
        ]);
        $hacked = $this->claim($playing['id'], ['choice' => 2]);
        $me = $me->fresh();
        $other = $other->fresh();
        $this->assertSame('HACKED protocol: virus hit the class', $hacked->getData(true)['claim']['message']);
        $this->assertSame(58, (int) $me->coins);
        $this->assertFalse((bool) $other->shield);
        $this->assertSame(20, (int) $other->coins);

        $this->seedPending($me, 'protocol', [
            ['protocol' => 'gold'],
            ['protocol' => 'luck'],
            ['protocol' => 'hacked'],
        ]);
        $this->claim($playing['id'], ['choice' => 2]);
        $this->assertSame(16, (int) LiveGameSessionPlayer::query()->where('student_id', 22)->first()->coins);
        $this->assertSame(52, (int) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->coins);
    }

    public function test_steal_correct_password_transfers_capped_coins(): void
    {
        $playing = $this->openPlaying([21, 22], 1, 'hacking');
        $this->actingStudent(21);
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $victim = LiveGameSessionPlayer::query()->where('student_id', 22)->first();
        $victim->coins = 5;
        $victim->hack_password = 'Real1';
        $victim->save();
        $this->seedAnswer((int) $playing['id'], 21);
        $this->seedPending($me, 'steal', [
            ['password' => 'Fake0', 'owner_id' => null, 'real' => false],
            ['password' => 'Real1', 'owner_id' => 22, 'real' => true],
            ['password' => 'Fake2', 'owner_id' => null, 'real' => false],
        ]);

        $response = $this->claim($playing['id'], ['password' => 'Real1', 'student_id' => 22]);
        $payload = $response->getData(true);
        $me = $me->fresh();
        $victim = $victim->fresh();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(5, $payload['claim']['coins_awarded']);
        $this->assertSame(25, (int) $me->coins);
        $this->assertSame(0, (int) $victim->coins);
        $this->assertFalse((bool) $me->reward_pending);
        $this->assertSame(5, (int) LiveGameSessionAnswer::query()->where('student_id', 21)->first()->coins_delta);
        $this->assertStringContainsString('You stole 5 coins from Student 22', $payload['claim']['message']);
        $this->assertArrayNotHasKey('players', $payload['claim']);
        $this->assertArrayNotHasKey('hack_password', $payload['claim']);
    }

    public function test_steal_full_amount_is_eight(): void
    {
        $playing = $this->openPlaying([21, 22], 1, 'hacking');
        $this->actingStudent(21);
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        LiveGameSessionPlayer::query()->where('student_id', 22)->update(['hack_password' => 'Real1']);
        $this->seedPending($me, 'steal', [
            ['password' => 'Real1', 'owner_id' => 22, 'real' => true],
            ['password' => 'Fake0', 'owner_id' => null, 'real' => false],
            ['password' => 'Fake2', 'owner_id' => null, 'real' => false],
        ]);

        $this->assertSame(200, $this->claim($playing['id'], ['password' => 'Real1'])->getStatusCode());
        $this->assertSame(28, (int) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->coins);
        $this->assertSame(12, (int) LiveGameSessionPlayer::query()->where('student_id', 22)->first()->coins);
        $this->assertSame(8, LiveCompetitionEngine::STEAL_AMOUNT);
    }

    public function test_steal_victim_shield_blocks_transfer(): void
    {
        $playing = $this->openPlaying([21, 22], 1, 'hacking');
        $this->actingStudent(21);
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        LiveGameSessionPlayer::query()->where('student_id', 22)->update([
            'hack_password' => 'Real1',
            'shield' => true,
        ]);
        $this->seedPending($me, 'steal', [
            ['password' => 'Real1', 'owner_id' => 22, 'real' => true],
            ['password' => 'Fake0', 'owner_id' => null, 'real' => false],
            ['password' => 'Fake2', 'owner_id' => null, 'real' => false],
        ]);

        $response = $this->claim($playing['id'], ['password' => 'Real1']);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('Shield blocked the steal!', $response->getData(true)['claim']['message']);
        $this->assertSame(20, (int) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->coins);
        $this->assertSame(20, (int) LiveGameSessionPlayer::query()->where('student_id', 22)->first()->coins);
        $this->assertFalse((bool) LiveGameSessionPlayer::query()->where('student_id', 22)->first()->shield);
        $this->assertFalse((bool) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->reward_pending);
    }

    public function test_listed_fake_password_clears_pending_without_coins(): void
    {
        $playing = $this->openPlaying([21, 22], 1, 'hacking');
        $this->actingStudent(21);
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $this->seedPending($me, 'steal', [
            ['password' => 'Fake0', 'owner_id' => null, 'real' => false],
            ['password' => 'Real1', 'owner_id' => 22, 'real' => true],
            ['password' => 'Fake2', 'owner_id' => null, 'real' => false],
        ]);

        $response = $this->claim($playing['id'], ['password' => 'Fake0']);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('Wrong password — no coins stolen', $response->getData(true)['claim']['message']);
        $this->assertFalse((bool) LiveGameSessionPlayer::first()->reward_pending);
        $this->assertSame(20, (int) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->coins);
        $this->assertSame(20, (int) LiveGameSessionPlayer::query()->where('student_id', 22)->first()->coins);
    }

    public function test_invalid_steal_password_keeps_pending_reward(): void
    {
        $playing = $this->openPlaying([21, 22], 1, 'hacking');
        $this->actingStudent(21);
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $this->seedPending($me, 'steal', [
            ['password' => 'Real1', 'owner_id' => 22, 'real' => true],
            ['password' => 'Fake0', 'owner_id' => null, 'real' => false],
            ['password' => 'Fake2', 'owner_id' => null, 'real' => false],
        ]);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->claim($playing['id'], ['password' => 'nope']);
        $me = $me->fresh();
        $this->assertSame(422, $response->getStatusCode());
        $this->assertTrue((bool) $me->reward_pending);
        $this->assertSame('steal', $me->reward_type);
        $this->assertNotNull($me->reward_data);
        $this->assertSame(20, (int) $me->coins);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_gift_uses_existing_options_and_does_not_generate(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingStudent(21);
        $player = LiveGameSessionPlayer::first();
        $this->seedPending($player, 'gift', [
            ['coins' => 7],
            ['coins' => 3],
            ['coins' => 11],
        ]);
        $this->seedAnswer((int) $playing['id'], 21);

        $response = $this->claim($playing['id'], ['choice' => 0]);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(7, $response->getData(true)['claim']['coins_awarded']);
        $this->assertSame(27, (int) LiveGameSessionPlayer::first()->coins);
        $this->assertSame('You got 7 coins', $response->getData(true)['claim']['message']);
        $this->assertSame(7, (int) LiveGameSessionAnswer::first()->coins_delta);
    }

    public function test_unknown_reward_type_clears_pending_without_mutation(): void
    {
        $playing = $this->openPlaying([21]);
        $this->actingStudent(21);
        $player = LiveGameSessionPlayer::first();
        $this->seedPending($player, 'mystery', [['label' => 'x']]);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->claim($playing['id'], ['choice' => 0]);
        $player = $player->fresh();
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(20, (int) $player->coins);
        $this->assertFalse((bool) $player->reward_pending);
        $this->assertNull($player->reward_type);
        $this->assertNull($player->reward_data);
        $this->assertGreaterThan($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
    }

    public function test_non_playing_session_rejects_claim_even_when_pending(): void
    {
        $playing = $this->openPlaying([21], 1, 'gold_quest');
        $this->actingStudent(21);
        $player = LiveGameSessionPlayer::first();
        $this->seedPending($player, 'chest', [['risk' => 'safe'], ['risk' => 'medium'], ['risk' => 'jackpot']]);
        LiveGameSession::query()->where('id', $playing['id'])->update(['status' => LiveGameSession::STATUS_LOBBY]);
        $version = (int) LiveGameSession::query()->find($playing['id'])->live_version;

        $response = $this->claim($playing['id'], ['choice' => 0]);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame('Competition is not active.', $response->getData(true)['msg']);
        $this->assertSame(20, (int) LiveGameSessionPlayer::first()->coins);
        $this->assertTrue((bool) LiveGameSessionPlayer::first()->reward_pending);
        $this->assertSame($version, (int) LiveGameSession::query()->find($playing['id'])->live_version);
        $source = file_get_contents(app_path('Support/LiveCompetitions/LiveCompetitionSessionService.php'));
        $body = $this->methodBody($source, 'claimSessionReward');
        $this->assertTrue(str_contains($body, 'STATUS_PLAYING'));
        $this->assertTrue(str_contains($body, 'Competition is not active'));
        $this->assertLessThan(strpos($body, 'reward_pending'), strpos($body, 'STATUS_PLAYING'));
        $this->assertLessThan(strpos($body, 'claimReward'), strpos($body, 'STATUS_PLAYING'));
    }

    public function test_student_cannot_claim_another_players_reward(): void
    {
        $playing = $this->openPlaying([21, 22], 1, 'gold_quest');
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $this->seedPending($me, 'chest', [['risk' => 'safe'], ['risk' => 'medium'], ['risk' => 'jackpot']]);
        $this->actingStudent(22);

        $response = $this->claim($playing['id'], ['choice' => 0]);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertTrue((bool) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->reward_pending);
        $this->assertSame(20, (int) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->coins);
    }

    public function test_foreign_session_and_foreign_steal_victim_are_isolated(): void
    {
        $first = $this->openPlaying([21, 22], 1, 'hacking');
        $other = $this->openPlaying([23], 2, 'hacking');
        $this->actingStudent(21);
        $me = LiveGameSessionPlayer::query()->where('student_id', 21)->first();
        $this->seedPending($me, 'steal', [
            ['password' => 'Away', 'owner_id' => 23, 'real' => true],
            ['password' => 'Fake0', 'owner_id' => null, 'real' => false],
            ['password' => 'Fake2', 'owner_id' => null, 'real' => false],
        ]);

        $this->assertSame(403, $this->claim($other['id'], ['password' => 'Away'])->getStatusCode());
        $this->assertSame(200, $this->claim($first['id'], ['password' => 'Away'])->getStatusCode());
        $this->assertSame(20, (int) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->coins);
        $this->assertSame(20, (int) LiveGameSessionPlayer::query()->where('student_id', 23)->first()->coins);
        $this->assertFalse((bool) LiveGameSessionPlayer::query()->where('student_id', 21)->first()->reward_pending);
    }

    public function test_claim_failure_rolls_back_coins_and_pending(): void
    {
        $playing = $this->openPlaying([21], 1, 'gold_quest');
        $this->actingStudent(21);
        $player = LiveGameSessionPlayer::first();
        $this->seedPending($player, 'chest', [['risk' => 'safe'], ['risk' => 'medium'], ['risk' => 'jackpot']]);
        $this->seedAnswer((int) $playing['id'], 21);

        LiveGameSessionAnswer::updating(function (LiveGameSessionAnswer $row) {
            if ($row->isDirty('coins_delta')) {
                throw new \RuntimeException('forced claim failure');
            }
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->claimSessionReward(21, (int) $playing['id'], ['choice' => 0]);
            $this->fail('Expected claim failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced claim failure', $ex->getMessage());
        } finally {
            LiveGameSessionAnswer::flushEventListeners();
        }

        $player = LiveGameSessionPlayer::first();
        $this->assertTrue((bool) $player->reward_pending);
        $this->assertSame('chest', $player->reward_type);
        $this->assertSame(20, (int) $player->coins);
        $this->assertSame(0, (int) LiveGameSessionAnswer::first()->coins_delta);
    }

    public function test_claim_locks_session_before_player_rows(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $this->assertNotFalse($source);
        $body = $this->methodBody($source, 'claimSessionReward');
        $sessionQuery = strpos($body, 'LiveGameSession::query()');
        $sessionLock = strpos($body, 'lockForUpdate');
        $playerQuery = strpos($body, 'LiveGameSessionPlayer::query()');
        $this->assertLessThan($sessionLock, $sessionQuery);
        $this->assertLessThan($playerQuery, $sessionLock);
        $this->assertLessThan(strpos($body, 'claimReward('), $playerQuery);
        $this->assertFalse(str_contains($body, 'recordPlay'));
        $this->assertFalse(str_contains($body, 'broadcast'));
    }

    public function test_unauthenticated_claim_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ])->postJson('/api/student/live-competitions/sessions/1/claim-reward', [
            'choice' => 0,
        ]);
        $response->assertStatus(401)->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_claim_reward_route_is_flagged_student_post(): void
    {
        $route = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/student/live-competitions/sessions/{id}/claim-reward'
                && in_array('POST', $route->methods(), true);
        });
        $this->assertNotNull($route);
        $middleware = $route->gatherMiddleware();
        $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
        $this->assertContains('checkStudentToken:user-api', $middleware);
        $this->assertContains('checkSecretApi', $middleware);
        $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
    }

    private function forceChest(array $result): void
    {
        $engine = new LiveCompetitionClaimRewardTestEngine();
        $engine->chestResult = $result;
        $this->app->instance(LiveCompetitionEngine::class, $engine);
        $this->app->forgetInstance(LiveCompetitionSessionService::class);
    }

    /**
     * @param  array<int,array<string,mixed>>  $options
     * @param  array<string,mixed>  $extra
     */
    private function seedPending(LiveGameSessionPlayer $player, string $type, array $options, array $extra = []): void
    {
        $player->reward_pending = true;
        $player->reward_type = $type;
        $player->reward_data = ['options' => $options];
        foreach ($extra as $key => $value) {
            $player->{$key} = $value;
        }
        $player->save();
    }

    private function seedAnswer(int $sessionId, int $studentId): LiveGameSessionAnswer
    {
        $snapshot = LiveGameSessionQuestion::query()
            ->where('live_game_session_id', $sessionId)
            ->first();

        return LiveGameSessionAnswer::create([
            'live_game_session_id' => $sessionId,
            'student_id' => $studentId,
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
            'correct' => true,
            'coins_delta' => 0,
            'is_retry' => false,
            'is_reinforce' => false,
            'attempt' => 1,
        ]);
    }

    private function optionIndex(LiveGameSessionPlayer $player, string $key, string $value): int
    {
        $options = $player->reward_data['options'] ?? [];
        foreach ($options as $index => $option) {
            if (($option[$key] ?? null) === $value) {
                return (int) $index;
            }
        }
        $this->fail('Missing reward option '.$key.'='.$value);

        return 0;
    }

    private function claim($sessionId, array $body)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/claim-reward',
            'POST',
            $body
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->claimReward($sessionId, $request);
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

    private function startClock($sessionId)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/start-question-clock',
            'POST'
        );

        return $this->app->make(LiveCompetitionsStudentController::class)
            ->startQuestionClock($sessionId, $request);
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

    /**
     * @param  int[]  $studentIds
     * @return array<string,mixed>
     */
    private function openLobbyWithStudents(array $studentIds, string $time = '10:00', int $classId = 1, string $type = 'classic'): array
    {
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

    private function publishedEntitledGame(int $schoolId, string $time = '10:00', string $type = 'classic'): LiveGame
    {
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
            'sort_order' => 1,
        ]);
        LiveGameQuestion::create([
            'live_game_id' => $game->id,
            'question' => 'What to drink?',
            'correct_answer' => 'Water',
            'answer_type' => 'text',
            'answer1' => 'Sand',
            'answer2' => 'Water',
            'answer3' => 'Oil',
            'answer4' => 'Smoke',
            'sort_order' => 2,
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

class LiveCompetitionClaimRewardTestEngine extends LiveCompetitionEngine
{
    /** @var array<string,mixed>|null */
    public $chestResult;

    public function resolveChest(array $option, bool $bridgeBroken = false): array
    {
        if (is_array($this->chestResult)) {
            return $this->chestResult;
        }

        return parent::resolveChest($option, $bridgeBroken);
    }
}
