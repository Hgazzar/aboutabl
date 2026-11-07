<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveGameSessionPlayer extends Model
{
    protected $table = 'live_game_session_players';

    protected $guarded = [];

    protected $casts = [
        'score' => 'integer',
        'coins' => 'integer',
        'character_slot' => 'integer',
        'answered_current' => 'boolean',
        'password_options' => 'array',
        'reward_data' => 'array',
        'reward_pending' => 'boolean',
        'streak' => 'integer',
        'best_streak' => 'integer',
        'power_used' => 'boolean',
        'frozen_until' => 'datetime',
        'shield' => 'boolean',
        'retry_queue' => 'array',
        'answers_since_retry' => 'integer',
        'pending_reinforce' => 'boolean',
        'question_started_at' => 'datetime',
        'fastest_ms' => 'integer',
        'progress_penalty' => 'integer',
    ];

    public function session()
    {
        return $this->belongsTo(LiveGameSession::class, 'live_game_session_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function team()
    {
        return $this->belongsTo(LiveGameSessionTeam::class, 'team_id');
    }

    /**
     * Standalone GameSessionPlayer::progressPercent.
     */
    public function progressPercent(int $maxScore): float
    {
        return min(100, ($this->score / max(1, $maxScore)) * 100);
    }

    public function addCoins(int $amount): void
    {
        $this->coins = max(0, (int) $this->coins + $amount);
        $this->save();
    }

    public function isFrozen(): bool
    {
        return $this->frozen_until && $this->frozen_until->isFuture();
    }

    /**
     * Standalone GameSessionPlayer::frozenSecondsLeft.
     */
    public function frozenSecondsLeft(): int
    {
        if (! $this->isFrozen()) {
            return 0;
        }

        return max(0, $this->frozen_until->getTimestamp() - now()->getTimestamp());
    }

    public function streakMultiplier(): int
    {
        return (int) $this->streak >= 3 ? 2 : 1;
    }

    /**
     * Standalone GameSessionPlayer::powerLabel.
     */
    public function powerLabel(): string
    {
        $map = [
            'fifty_fifty' => '50 / 50',
            'freeze' => 'Freeze',
            'shield' => 'Shield',
        ];

        return $map[$this->power] ?? str_replace('_', ' ', (string) $this->power);
    }

    /**
     * @return int[]
     */
    public function retryQueue(): array
    {
        return array_values(array_unique(array_map('intval', $this->retry_queue ?: [])));
    }

    public function isQueuedRetry(int $questionId): bool
    {
        return in_array($questionId, $this->retryQueue(), true);
    }

    /**
     * Standalone GameSessionPlayer::dueForRetry.
     */
    public function dueForRetry(): bool
    {
        return count($this->retryQueue()) > 0 && (int) $this->answers_since_retry >= 2;
    }

    public function enqueueRetry(int $questionId): void
    {
        $queue = $this->retryQueue();
        if (! in_array($questionId, $queue, true)) {
            $queue[] = $questionId;
        }
        $this->retry_queue = $queue;
        $this->answers_since_retry = 0;
    }

    public function completeRetry(int $questionId): void
    {
        $this->retry_queue = array_values(array_diff($this->retryQueue(), [$questionId]));
        $this->answers_since_retry = 0;
    }

    public function deferRetry(int $questionId): void
    {
        $queue = array_values(array_diff($this->retryQueue(), [$questionId]));
        $queue[] = $questionId;
        $this->retry_queue = $queue;
        $this->answers_since_retry = 0;
    }

    public function beginLockIn(int $questionId, array $choices, ?string $wrongAnswer, bool $timedOut): void
    {
        $this->pending_reinforce = true;
        $this->reinforce_question_id = $questionId;
        $data = $this->reward_data ?: [];
        $data['lock_in'] = [
            'choices' => array_values($choices),
            'wrong_answer' => $wrongAnswer,
            'timed_out' => $timedOut,
        ];
        $this->reward_data = $data;
    }

    /**
     * Standalone GameSessionPlayer::clearLockIn.
     */
    public function clearLockIn(): void
    {
        $this->pending_reinforce = false;
        $this->reinforce_question_id = null;
        $data = $this->reward_data ?: [];
        unset($data['lock_in']);
        $this->reward_data = $data ?: null;
    }

    /**
     * Standalone GameSessionPlayer::lockInState.
     *
     * @return array<string,mixed>
     */
    public function lockInState(): array
    {
        return $this->reward_data['lock_in'] ?? [];
    }
}
