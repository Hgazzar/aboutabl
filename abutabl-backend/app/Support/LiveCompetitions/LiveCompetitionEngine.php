<?php

namespace App\Support\LiveCompetitions;

use App\Models\LiveGameSession;
use App\Models\LiveGameSessionAnswer;
use App\Models\LiveGameSessionPlayer;
use App\Models\LiveGameSessionQuestion;
use App\Models\LiveGameSessionTeam;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;
use RuntimeException;

/**
 * Adapted standalone gameplay (CompetitionController start/answer/recordPlay,
 * LiveGameService assignTeams / POWERS / surprise events). No broadcast.
 */
class LiveCompetitionEngine
{
    public const POWERS = ['fifty_fifty', 'freeze', 'shield'];

    public const STEAL_AMOUNT = 8;

    public function startSession(LiveGameSession $session): void
    {
        $minutes = $this->resolveDurationMinutes($session);

        $session->players()->update([
            'answered_current' => false,
            'score' => 0,
            'coins' => 20,
            'reward_pending' => false,
            'reward_type' => null,
            'reward_data' => null,
            'streak' => 0,
            'progress_penalty' => 0,
            'pending_reinforce' => false,
            'reinforce_question_id' => null,
            'answers_since_retry' => 0,
            'retry_queue' => null,
            'question_started_at' => null,
            'power_used' => false,
            'shield' => false,
            'frozen_until' => null,
        ]);

        LiveGameSessionAnswer::query()
            ->where('live_game_session_id', $session->id)
            ->delete();

        foreach ($session->players()->orderBy('id')->get() as $player) {
            $player->power = self::POWERS[array_rand(self::POWERS)];
            $player->power_used = false;
            $player->save();
        }

        if ($session->team_mode) {
            $this->assignTeams($session);
        }

        $session->update([
            'status' => LiveGameSession::STATUS_PLAYING,
            'current_question_index' => 0,
            'started_at' => now(),
            'ends_at' => now()->addMinutes($minutes),
            'firewood' => 0,
            'fire_lit' => false,
            'active_event' => null,
            'firewall_active' => false,
            'bridge_broken' => false,
        ]);

        $session->increment('live_version');
    }

    /**
     * Standalone CompetitionController::recordPlay, scoring snapshot rows.
     */
    public function recordPlay(
        LiveGameSession $session,
        LiveGameSessionPlayer $player,
        LiveGameSessionQuestion $question,
        string $answer,
        bool $correct,
        int $elapsed,
        bool $timedOut,
        bool $isRetry
    ): void {
        LiveGameSessionAnswer::create([
            'live_game_session_id' => $session->id,
            'student_id' => $player->student_id,
            'live_game_session_question_id' => $question->id,
            'answer' => $answer,
            'correct' => $correct,
            'coins_delta' => 0,
            'elapsed_ms' => $elapsed,
            'timed_out' => $timedOut,
            'is_retry' => $isRetry,
            'is_reinforce' => false,
            'attempt' => $isRetry ? 2 : 1,
        ]);

        $player->question_started_at = null;
        $player->answered_current = true;

        if ($correct) {
            $player->score = (int) $player->score + 1;
            $player->streak = (int) $player->streak + 1;
            $player->best_streak = max((int) $player->best_streak, (int) $player->streak);
            if ($player->streakMultiplier() === 2) {
                $player->progress_penalty = max(0, (int) $player->progress_penalty - 6);
            }
            if (! $player->fastest_ms || $elapsed < $player->fastest_ms) {
                $player->fastest_ms = $elapsed;
            }
            $this->grantReward($session, $player);
            if ($isRetry) {
                $player->completeRetry((int) $question->id);
            } else {
                $player->answers_since_retry = (int) $player->answers_since_retry + 1;
            }
        } else {
            $player->streak = 0;
            $lockChoices = $this->fiftyFiftyChoices($question, $question->choiceValues());
            $player->beginLockIn((int) $question->id, $lockChoices, $timedOut ? null : $answer, $timedOut);
            if ($isRetry) {
                $player->deferRetry((int) $question->id);
            } else {
                $player->enqueueRetry((int) $question->id);
            }
        }
        $player->save();
        $this->maybeApplySurprise($session);
    }

    /**
     * Standalone CompetitionController::reinforce. Does not call recordPlay.
     *
     * @return array{correct: bool, coins: int}
     */
    public function reinforce(
        LiveGameSession $session,
        LiveGameSessionPlayer $player,
        LiveGameSessionQuestion $question,
        string $answer
    ): array {
        $allowed = $player->lockInState()['choices'] ?? $this->fiftyFiftyChoices($question, $question->choiceValues());
        if (! in_array($answer, $allowed, true)) {
            throw new InvalidArgumentException('Invalid choice.');
        }

        $correct = $question->isCorrectChoice($answer);
        $coins = $correct ? 3 : 0;
        LiveGameSessionAnswer::create([
            'live_game_session_id' => $session->id,
            'student_id' => $player->student_id,
            'live_game_session_question_id' => $question->id,
            'answer' => $answer,
            'correct' => $correct,
            'coins_delta' => $coins,
            'is_reinforce' => true,
            'is_retry' => false,
            'attempt' => 1,
        ]);
        if ($coins) {
            $player->addCoins($coins);
        }
        $player->clearLockIn();
        $player->save();

        return [
            'correct' => $correct,
            'coins' => $coins,
        ];
    }

    /**
     * Standalone CompetitionController::grantReward.
     */
    public function grantReward(LiveGameSession $session, LiveGameSessionPlayer $player): void
    {
        $type = $session->themeType();
        $streakBonus = (int) $player->streak >= 3;
        $mult = $player->streakMultiplier();

        if ($type === 'classic') {
            $gain = 10 * $mult;
            $player->coins = (int) $player->coins + $gain;
            $session->firewood = (int) $session->firewood + 1;
            $session->save();
            $player->reward_pending = false;
            $last = $session->answers()->where('student_id', $player->student_id)->latest('id')->first();
            if ($last) {
                $last->coins_delta = $gain;
                $last->save();
            }

            return;
        }

        if ($type === 'gold_quest') {
            // LIVE-GAMES-REWARD-002: +1 session coin per confirmed correct answer.
            $gain = 1;
            $player->coins = (int) $player->coins + $gain;
            $last = $session->answers()->where('student_id', $player->student_id)->latest('id')->first();
            if ($last) {
                $last->coins_delta = $gain;
                $last->save();
            }

            // Exactly one chest round after every 3 cumulative correct answers (score).
            if ((int) $player->score > 0 && (int) $player->score % 3 === 0) {
                $amounts = [5, 10, 20];
                shuffle($amounts);
                // Student SPA serves these under /assets/games/images (not standalone /assets/images).
                $images = [
                    '/assets/games/images/treasure1.png',
                    '/assets/games/images/treasure2.png',
                    '/assets/games/images/treasure3.png',
                ];
                shuffle($images);
                $opts = [];
                foreach ($amounts as $i => $coins) {
                    $opts[] = [
                        'coins' => (int) $coins,
                        'image' => $images[$i],
                    ];
                }
                $player->reward_type = 'chest';
                $player->reward_pending = true;
                $player->reward_data = [
                    'scheme' => 'fixed_trio',
                    'options' => $opts,
                ];
            } else {
                $player->reward_pending = false;
                $player->reward_type = null;
                $player->reward_data = null;
            }

            return;
        }

        if ($type === 'hacking') {
            if ($session->firewall_active) {
                $gain = 5 * $mult;
                $player->coins = (int) $player->coins + $gain;
                $player->reward_pending = false;
                $last = $session->answers()->where('student_id', $player->student_id)->latest('id')->first();
                if ($last) {
                    $last->coins_delta = $gain;
                    $last->save();
                }

                return;
            }
            $others = $session->players()->where('student_id', '!=', $player->student_id)->whereNotNull('hack_password')->get();
            $useSteal = $others->count() > 0 && random_int(0, 1) === 1;
            if ($useSteal) {
                // Same hintLen rules for real and fake options so hint presence
                // cannot mark which passwords are stealable (C4 H1).
                $hintLen = 0;
                if ((int) $player->streak >= 4) {
                    $hintLen = 2;
                } elseif ($streakBonus) {
                    $hintLen = 1;
                }
                $options = [];
                foreach ($others->shuffle() as $other) {
                    if (count($options) >= 2) {
                        break;
                    }
                    $password = (string) $other->hack_password;
                    $options[] = [
                        'password' => $password,
                        'owner_id' => $other->student_id,
                        'real' => true,
                        'hint' => $hintLen > 0 ? substr($password, 0, $hintLen) : null,
                    ];
                }
                foreach ($this->randomPasswords(4) as $fake) {
                    if (count($options) >= 3) {
                        break;
                    }
                    if (in_array($fake, collect($options)->pluck('password')->all(), true)) {
                        continue;
                    }
                    $options[] = [
                        'password' => $fake,
                        'owner_id' => null,
                        'real' => false,
                        'hint' => $hintLen > 0 ? substr($fake, 0, $hintLen) : null,
                    ];
                }
                shuffle($options);
                $player->reward_type = 'steal';
                $player->reward_pending = true;
                $player->reward_data = ['options' => $options];

                return;
            }
            $protocols = [
                ['protocol' => 'gold', 'image' => '/assets/images/gold.png', 'label' => 'GOLD', 'hint' => 'Burst of coins'],
                ['protocol' => 'luck', 'image' => '/assets/images/luck.png', 'label' => 'LUCK', 'hint' => 'Coins + steal shield'],
                ['protocol' => 'hacked', 'image' => '/assets/images/hacked.png', 'label' => 'HACKED', 'hint' => 'Virus hits the class'],
            ];
            shuffle($protocols);
            $player->reward_type = 'protocol';
            $player->reward_pending = true;
            $player->reward_data = ['options' => $protocols];
        }
    }

    /**
     * Lazy-init five password choices for hacking (join does not seed them).
     *
     * @return string[]
     */
    public function ensurePasswordOptions(LiveGameSessionPlayer $player): array
    {
        $options = $player->password_options ?: [];
        if ($options === []) {
            $options = $this->randomPasswords(5);
            $player->password_options = $options;
            $player->save();
        }

        return array_values($options);
    }

    /**
     * Standalone CompetitionController::pickPassword after theme / idempotent checks.
     * Initializes password_options with randomPasswords(5) when absent (AbuTabl join is thin).
     * Validation errors are returned (not thrown) so callers can commit initialized options.
     *
     * @return array{changed: bool, has_password: bool, password_options: string[], error: string|null}
     */
    public function pickPassword(LiveGameSessionPlayer $player, string $password): array
    {
        if ($player->hack_password) {
            return [
                'changed' => false,
                'has_password' => true,
                'password_options' => array_values($player->password_options ?: []),
                'error' => null,
            ];
        }

        $options = $this->ensurePasswordOptions($player);

        $validator = Validator::make(
            ['password' => $password],
            ['password' => ['required', 'string', 'max:16']]
        );
        if ($validator->fails()) {
            return [
                'changed' => false,
                'has_password' => false,
                'password_options' => array_values($options),
                'error' => (string) $validator->errors()->first('password'),
            ];
        }

        if (! in_array($password, $options, true)) {
            return [
                'changed' => false,
                'has_password' => false,
                'password_options' => array_values($options),
                'error' => 'Choose one of the five passwords.',
            ];
        }

        $player->hack_password = $password;
        $player->save();

        return [
            'changed' => true,
            'has_password' => true,
            'password_options' => array_values($options),
            'error' => null,
        ];
    }

    /**
     * Standalone CompetitionController::usePower after playing / availability checks.
     * Does not mutate question choices; fifty_fifty only sets power_used.
     *
     * @return array{message: string}
     */
    public function usePower(LiveGameSession $session, LiveGameSessionPlayer $player): array
    {
        if ($player->power_used || ! $player->power) {
            throw new RuntimeException('Power already used this round.', 409);
        }

        if ($player->power === 'fifty_fifty') {
            $player->power_used = true;
            $player->save();
        } elseif ($player->power === 'shield') {
            $player->shield = true;
            $player->power_used = true;
            $player->save();
        } elseif ($player->power === 'freeze') {
            $victim = $session->players()->where('id', '!=', $player->id)->inRandomOrder()->first();
            if (! $victim) {
                throw new RuntimeException('No rival to freeze.', 409);
            }
            $victim->frozen_until = now()->addSeconds(8);
            $victim->save();
            $player->power_used = true;
            $player->save();
        } else {
            throw new InvalidArgumentException('Unknown power.');
        }

        return [
            'message' => 'Power activated: '.$player->powerLabel(),
        ];
    }

    /**
     * Standalone CompetitionController::claimReward after the pending check.
     * Validation failures throw before pending state is cleared.
     *
     * @param  array<string,mixed>  $input
     * @return array{delta: int, message: string|null}
     */
    public function claimReward(LiveGameSession $session, LiveGameSessionPlayer $player, array $input): array
    {
        $type = $player->reward_type;
        $payload = $player->reward_data ?: [];
        $delta = 0;
        $message = null;

        if ($type === 'protocol') {
            $data = $this->validateRewardChoice($input);
            $options = $payload['options'] ?? [];
            $picked = $options[(int) $data['choice']] ?? null;
            $protocol = $picked['protocol'] ?? 'luck';
            $message = $this->applyProtocol($session, $player, $protocol, $player->streakMultiplier());
        } elseif ($type === 'chest') {
            $data = $this->validateRewardChoice($input);
            $options = $payload['options'] ?? [];
            $choice = (int) $data['choice'];
            if (! array_key_exists($choice, $options) || ! is_array($options[$choice])) {
                throw new InvalidArgumentException('Invalid chest choice.');
            }
            $picked = $options[$choice];
            if (($payload['scheme'] ?? '') === 'fixed_trio') {
                // LIVE-GAMES-REWARD-002: fixed 5/10/20 mapped by shuffled position; no streak mult.
                $delta = (int) ($picked['coins'] ?? 0);
                if (! in_array($delta, [5, 10, 20], true)) {
                    throw new InvalidArgumentException('Invalid chest reward.');
                }
                $player->addCoins($delta);
                $message = 'YOU WIN '.$delta.' Coins';
            } else {
                // Legacy risk chests (pre–REWARD-002). Keep claim path for in-flight sessions.
                $result = $this->resolveChest($picked, (bool) $session->bridge_broken);
                $delta = (int) $result['coins'];
                if ($delta > 0) {
                    $delta *= $player->streakMultiplier();
                }
                $player->addCoins($delta);
                if (! empty($result['cursed']) || ! empty($result['slip'])) {
                    $player->progress_penalty = (int) $player->progress_penalty + (int) ($result['slip'] ?? 15);
                    $player->save();
                }
                $message = $result['message'];
                if ($delta > 0 && $player->streakMultiplier() > 1) {
                    $message .= ' · streak x'.$player->streakMultiplier();
                }
            }
        } elseif ($type === 'gift') {
            $data = $this->validateRewardChoice($input);
            $options = $payload['options'] ?? [];
            $picked = $options[(int) $data['choice']] ?? null;
            $delta = (int) ($picked['coins'] ?? 0);
            $player->addCoins($delta);
            $message = 'You got '.$delta.' coins';
        } elseif ($type === 'steal') {
            $data = $this->validateStealPassword($input);
            $match = collect($payload['options'] ?? [])->firstWhere('password', $data['password']);
            if (! $match) {
                throw new InvalidArgumentException('Invalid password choice.');
            }
            if (! empty($match['real']) && ! empty($match['owner_id'])) {
                $victim = $session->players()->where('student_id', $match['owner_id'])->first();
                if ($victim && $victim->shield) {
                    $victim->shield = false;
                    $victim->save();
                    $message = 'Shield blocked the steal!';
                } elseif ($victim && (int) $victim->student_id !== (int) $player->student_id) {
                    $taken = min(self::STEAL_AMOUNT, (int) $victim->coins);
                    if ($taken > 0) {
                        $victim->addCoins(-$taken);
                        $player->addCoins($taken);
                        $delta = $taken;
                        $message = 'You stole '.$taken.' coins from '.(optional($victim->student)->name ?: 'classmate');
                    } else {
                        $message = optional($victim->student)->name.' has no coins to steal';
                    }
                }
            } else {
                $message = 'Wrong password — no coins stolen';
            }
        }

        $last = $session->answers()->where('student_id', $player->student_id)->latest('id')->first();
        if ($last && $delta) {
            $last->coins_delta = (int) $last->coins_delta + $delta;
            $last->save();
        }

        $player->reward_pending = false;
        $player->reward_type = null;
        $player->reward_data = null;
        $player->save();

        return [
            'delta' => $delta,
            'message' => $message,
        ];
    }

    /**
     * Standalone LiveGameService::resolveChest.
     *
     * @param  array<string,mixed>  $option
     * @return array{coins: int, message: string, cursed: bool, slip: int}
     */
    public function resolveChest(array $option, bool $bridgeBroken = false): array
    {
        $risk = $option['risk'] ?? 'safe';
        if ($risk === 'safe') {
            return ['coins' => 5, 'message' => 'YOU WIN 5 Coins', 'cursed' => false, 'slip' => 0];
        }
        if ($risk === 'medium') {
            $chance = $bridgeBroken ? 60 : 80;
            $win = random_int(1, 100) <= $chance;

            return $win
                ? ['coins' => 20, 'message' => 'YOU WIN 20 Coins', 'cursed' => false, 'slip' => 0]
                : ['coins' => 5, 'message' => 'The chest was light — 5 coins', 'cursed' => false, 'slip' => 0];
        }

        $jackpot = $bridgeBroken ? 35 : 50;
        $emptyUntil = $bridgeBroken ? 60 : 75;
        $roll = random_int(1, 100);
        if ($roll <= $jackpot) {
            return ['coins' => 50, 'message' => 'JACKPOT 50 Coins', 'cursed' => false, 'slip' => 0];
        }
        if ($roll <= $emptyUntil) {
            return ['coins' => 0, 'message' => 'Empty chest!', 'cursed' => false, 'slip' => 0];
        }

        return [
            'coins' => -15,
            'message' => 'Cursed chest! You slip back on the bridge',
            'cursed' => true,
            'slip' => $bridgeBroken ? 20 : 15,
        ];
    }

    /**
     * Standalone LiveGameService::applyProtocol.
     */
    public function applyProtocol(LiveGameSession $session, LiveGameSessionPlayer $player, string $protocol, int $multiplier = 1): string
    {
        $player->last_protocol = $protocol;
        $multiplier = max(1, $multiplier);

        if ($protocol === 'gold') {
            $gain = 20 * $multiplier;
            $player->addCoins($gain);

            return 'GOLD protocol: +'.$gain.' coins'.($multiplier > 1 ? ' (streak x'.$multiplier.')' : '');
        }
        if ($protocol === 'luck') {
            $gain = 12 * $multiplier;
            $player->addCoins($gain);
            $player->shield = true;
            $player->save();

            return 'LUCK protocol: +'.$gain.' coins and a shield'.($multiplier > 1 ? ' (streak x'.$multiplier.')' : '');
        }

        $player->addCoins(-6);
        foreach ($session->players()->where('id', '!=', $player->id)->get() as $other) {
            if ($other->shield) {
                $other->shield = false;
                $other->save();
                continue;
            }
            $other->addCoins(-4);
        }

        return 'HACKED protocol: virus hit the class';
    }

    /**
     * Standalone claimReward protocol/chest/gift choice rules.
     *
     * @param  array<string,mixed>  $input
     * @return array{choice: int}
     */
    private function validateRewardChoice(array $input): array
    {
        $validator = Validator::make($input, [
            'choice' => ['required', 'integer', 'min:0', 'max:2'],
        ]);
        if ($validator->fails()) {
            throw new InvalidArgumentException((string) $validator->errors()->first('choice'));
        }

        return $validator->validated();
    }

    /**
     * Standalone claimReward steal password presence rule.
     *
     * @param  array<string,mixed>  $input
     * @return array{password: string}
     */
    private function validateStealPassword(array $input): array
    {
        $validator = Validator::make($input, [
            'password' => ['required', 'string'],
        ]);
        if ($validator->fails()) {
            throw new InvalidArgumentException((string) $validator->errors()->first('password'));
        }

        return $validator->validated();
    }

    /**
     * Standalone CompetitionController::fiftyFiftyChoices.
     *
     * @param  string[]  $choices
     * @return string[]
     */
    public function fiftyFiftyChoices(LiveGameSessionQuestion $question, array $choices): array
    {
        $wrong = array_values(array_filter($choices, function ($c) use ($question) {
            return $c !== $question->correct_answer;
        }));
        shuffle($wrong);
        $out = array_values(array_filter([$question->correct_answer, $wrong[0] ?? null]));
        shuffle($out);

        return $out;
    }

    /**
     * Standalone CompetitionController::elapsedMs. Null clock yields 0.
     */
    public function elapsedMs(LiveGameSessionPlayer $player): int
    {
        if (! $player->question_started_at) {
            return 0;
        }

        return (int) max(0, $player->question_started_at->diffInMilliseconds(now(), false));
    }

    public function maybeApplySurprise(LiveGameSession $session): void
    {
        if ($session->status !== LiveGameSession::STATUS_PLAYING) {
            return;
        }
        $event = $this->maybeSurpriseEvent($session);
        if (! $event) {
            return;
        }
        $this->applyEvent($session, $event);
    }

    /**
     * Standalone LiveGameService::maybeSurpriseEvent.
     */
    public function maybeSurpriseEvent(LiveGameSession $session): ?string
    {
        if ($session->status !== LiveGameSession::STATUS_PLAYING || $session->active_event) {
            return null;
        }

        $map = [
            'classic' => 'storm',
            'hacking' => 'firewall',
            'gold_quest' => 'bridge_break',
        ];
        $event = $map[$session->themeType()] ?? null;
        if (! $event) {
            return null;
        }

        $classCorrect = $session->answers()
            ->where('is_reinforce', false)
            ->where('correct', true)
            ->count();
        $midAnswers = $classCorrect === 2;

        $midClock = false;
        if ($session->started_at && $session->ends_at) {
            $total = max(1, $session->started_at->diffInSeconds($session->ends_at));
            $elapsed = $session->started_at->diffInSeconds(now());
            $midClock = $elapsed >= (int) round($total * 0.4);
        }

        return ($midAnswers || $midClock) ? $event : null;
    }

    /**
     * Standalone LiveGameService::applyEvent.
     */
    public function applyEvent(LiveGameSession $session, string $event): void
    {
        $session->active_event = $event;
        $session->loadMissing('players');

        if ($event === 'storm') {
            $session->firewood = max(0, (int) $session->firewood - 1);
            foreach ($session->players as $player) {
                $player->addCoins(-3);
                $player->progress_penalty = (int) $player->progress_penalty + 6;
                $player->save();
            }
        }

        if ($event === 'firewall') {
            $session->firewall_active = true;
        }

        if ($event === 'bridge_break') {
            $session->bridge_broken = true;
            foreach ($session->players as $player) {
                $player->progress_penalty = (int) $player->progress_penalty + 12;
                $player->save();
            }
        }

        $session->save();
    }

    /**
     * Standalone LiveGameService::assignTeams, using live_game_session_teams.
     */
    public function assignTeams(LiveGameSession $session): void
    {
        $players = $session->players()->with('student')->orderBy('id')->get();
        if ($players->isEmpty()) {
            return;
        }

        $session->teams()->delete();
        $count = $players->count();
        $teamsWanted = $count <= 2 ? 1 : (int) max(2, (int) ceil($count / 4));
        $chunkSize = (int) max(1, (int) ceil($count / $teamsWanted));
        $colors = ['#f4c430', '#3ecf8e', '#5aa9ff', '#ff6b6b'];
        $groups = $players->values()->chunk($chunkSize);
        $i = 1;
        foreach ($groups as $group) {
            $team = LiveGameSessionTeam::create([
                'live_game_session_id' => $session->id,
                'name' => 'Team '.$i,
                'color' => $colors[($i - 1) % count($colors)],
            ]);
            foreach ($group as $player) {
                $player->team_id = $team->id;
                $player->save();
            }
            $i++;
        }
    }

    /**
     * Standalone GameTheme::randomPasswords.
     *
     * @return string[]
     */
    public function randomPasswords(int $count = 5): array
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $out = [];

        while (count($out) < $count) {
            $code = '';
            for ($i = 0; $i < 5; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }
            if (! in_array($code, $out, true)) {
                $out[] = $code;
            }
        }

        return $out;
    }

    /**
     * Standalone CompetitionController::parseMinutes.
     * Uses the MM portion of "MM:SS". Invalid/missing time defaults to 10; minimum 1.
     */
    public function parseMinutes(?string $time): int
    {
        if (! $time || ! preg_match('/^(\d+):(\d+)$/', $time, $m)) {
            return 10;
        }

        return max(1, (int) $m[1]);
    }

    /**
     * Teacher override on the session wins; otherwise catalog game.time.
     */
    public function resolveDurationMinutes(LiveGameSession $session): int
    {
        $override = $session->duration_minutes;
        if ($override !== null && (int) $override > 0) {
            return max(
                LiveGameSession::DURATION_MINUTES_MIN,
                min(LiveGameSession::DURATION_MINUTES_MAX, (int) $override)
            );
        }

        return $this->parseMinutes(optional($session->game)->time);
    }

    /**
     * Standalone LiveGameService::eventCatalog.
     *
     * @return array<string,array{title:string,body:string}>
     */
    public static function eventCatalog(): array
    {
        return [
            'storm' => [
                'title' => 'STORM!',
                'body' => 'Wind stole a log. The campfire dims and everyone slips back.',
            ],
            'firewall' => [
                'title' => 'FIREWALL UP',
                'body' => 'Hacks are blocked. Correct answers now give a small coin burst only.',
            ],
            'bridge_break' => [
                'title' => 'BRIDGE BREAK!',
                'body' => 'The path cracks. Everyone slips back and the 50 chest gets riskier.',
            ],
        ];
    }

    /**
     * Standalone LiveGameService::buildReport, keyed by session snapshot IDs.
     *
     * @return array<string,mixed>
     */
    public function buildReport(LiveGameSession $session): array
    {
        $session->loadMissing(['questions', 'players.student']);
        $answers = $session->answers()->orderBy('id')->get();
        $scored = $answers->where('is_reinforce', false);
        $first = $scored->where('is_retry', false)->unique(function ($row) {
            return $row->student_id.'-'.$row->live_game_session_question_id;
        })->values();
        if ($first->isEmpty()) {
            $first = $scored->values();
        }

        $total = $first->count();
        $correct = $first->where('correct', true)->count();
        $accuracy = $total ? round(($correct / $total) * 100, 1) : 0.0;

        $hardest = $session->questions->map(function ($q) use ($first) {
            $rows = $first->where('live_game_session_question_id', $q->id);
            $rowTotal = $rows->count();
            $wrong = $rows->where('correct', false)->count();

            return [
                'id' => (int) $q->id,
                'question' => $q->question,
                'wrong' => $wrong,
                'correct' => $rowTotal - $wrong,
                'total' => $rowTotal,
                'miss_rate' => $rowTotal ? (int) round(($wrong / $rowTotal) * 100) : 0,
            ];
        })->sortByDesc(function ($row) {
            return sprintf('%03d-%03d', $row['miss_rate'], $row['wrong']);
        })->values();

        $fastest = $session->players->filter(function ($p) {
            return (int) $p->fastest_ms > 0;
        })->sortBy('fastest_ms')->first();

        return [
            'class_accuracy' => $accuracy,
            'answers_total' => $total,
            'answers_correct' => $correct,
            'hardest' => $hardest,
            'fastest_name' => $fastest
                ? (optional($fastest->student)->name ?: optional($fastest->student)->name_ar)
                : null,
            'fastest_ms' => $fastest->fastest_ms ?? null,
            'fastest_id' => $fastest->student_id ?? null,
            'goal' => $session->goalKey(),
            'goal_label' => $session->goalLabel(),
        ];
    }

    /**
     * Standalone LiveGameService::finalize. Caller owns the transaction/lock.
     * Increments live_version once. Does not broadcast.
     *
     * @return array<string,mixed>
     */
    public function finalize(LiveGameSession $session): array
    {
        $session->players()->update([
            'reward_pending' => false,
            'pending_reinforce' => false,
            'reinforce_question_id' => null,
        ]);
        $report = $this->buildReport($session);
        $session->loadMissing('game');
        $session->update([
            'status' => LiveGameSession::STATUS_ENDED,
            'ends_at' => now(),
            'class_accuracy' => $report['class_accuracy'],
            'fire_lit' => $session->themeType() === 'classic'
                && $report['class_accuracy'] >= 50
                && (int) $session->firewood >= $session->firewoodNeeded(),
        ]);
        $session->refresh();
        $session->increment('live_version');

        return $report;
    }

    /**
     * Standalone LiveGameService::payload for teacher host. Read-only.
     * Includes password_hint for teacher only; never include full passwords
     * or correct answers.
     *
     * @return array<string,mixed>
     */
    public function payload(LiveGameSession $session): array
    {
        $session->loadMissing([
            'game',
            'players.student',
            'players.team',
            'invites',
            'teams.players',
            'questions',
        ]);
        $max = $session->maxScore();

        $players = $session->players->sort(function ($a, $b) {
            if ((int) $a->score !== (int) $b->score) {
                return (int) $b->score <=> (int) $a->score;
            }
            if ((int) $a->coins !== (int) $b->coins) {
                return (int) $b->coins <=> (int) $a->coins;
            }

            return (int) $a->id <=> (int) $b->id;
        })->values()->map(function (LiveGameSessionPlayer $p, $i) use ($max) {
            $visual = max(0, min(100, $p->progressPercent($max) - (int) $p->progress_penalty));
            $student = $p->student;

            return [
                'id' => (int) $p->student_id,
                'player_id' => (int) $p->id,
                'rank' => $i + 1,
                'name' => $student->name ?? $student->name_ar ?? ('Student '.$p->student_id),
                'score' => (int) $p->score,
                'coins' => (int) $p->coins,
                'streak' => (int) $p->streak,
                'progress' => round($visual, 1),
                'avatar' => $student->photo ?? null,
                'power' => $p->power,
                'power_used' => (bool) $p->power_used,
                'shield' => (bool) $p->shield,
                'frozen' => $p->frozen_until && $p->frozen_until->isFuture(),
                'team' => $p->team ? $p->team->name : null,
                'team_color' => $p->team->color ?? null,
                'password_hint' => $p->hack_password ? substr($p->hack_password, 0, 1) : null,
                'reinforce' => (bool) $p->pending_reinforce,
                'retry_queued' => count($p->retryQueue()),
                'answers_since_retry' => (int) $p->answers_since_retry,
            ];
        });

        $report = $this->buildReport($session);
        $catalog = self::eventCatalog();

        return [
            'code' => $session->code,
            'status' => $session->status,
            'type' => $session->themeType(),
            'goal' => $session->goalKey(),
            'goal_label' => $session->goalLabel(),
            'goal_hint' => $session->goalHint(),
            'version' => (int) $session->live_version,
            'question_total' => $session->questionCount(),
            'question_seconds' => $session->questionSeconds(),
            'team_mode' => (bool) $session->team_mode,
            'firewood' => (int) $session->firewood,
            'firewood_needed' => $session->firewoodNeeded(),
            'fire_lit' => (bool) $session->fire_lit,
            'active_event' => $session->active_event,
            'event_title' => $catalog[$session->active_event]['title'] ?? null,
            'event_body' => $catalog[$session->active_event]['body'] ?? null,
            'firewall_active' => (bool) $session->firewall_active,
            'bridge_broken' => (bool) $session->bridge_broken,
            'bridge_progress' => (int) round($players->avg('progress') ?: 0),
            'invited_total' => $session->invites->count(),
            'joined_total' => $session->players->count(),
            'players' => $players->values()->all(),
            'teams' => $session->teams->map(function (LiveGameSessionTeam $t) {
                return [
                    'id' => (int) $t->id,
                    'name' => $t->name,
                    'color' => $t->color,
                    'score' => (int) $t->players->sum('score'),
                    'coins' => (int) $t->players->sum('coins'),
                ];
            })->values()->all(),
            'hardest' => collect($report['hardest'])->values()->all(),
            'fastest_name' => $report['fastest_name'],
            'fastest_ms' => $report['fastest_ms'],
            'fastest_id' => $report['fastest_id'] !== null ? (int) $report['fastest_id'] : null,
            'answers_total' => $report['answers_total'],
            'answers_correct' => $report['answers_correct'],
            'class_accuracy' => $session->class_accuracy !== null
                ? (float) $session->class_accuracy
                : $report['class_accuracy'],
            'seconds_left' => $session->ends_at
                ? max(0, $session->ends_at->getTimestamp() - Carbon::now()->getTimestamp())
                : null,
            'started_at' => optional($session->started_at)->toDateTimeString(),
            'ends_at' => optional($session->ends_at)->toDateTimeString(),
            /** True when the lobby was cancelled before Begin (started_at never set). */
            'cancelled' => (string) $session->status === LiveGameSession::STATUS_ENDED
                && $session->started_at === null,
        ];
    }
}
