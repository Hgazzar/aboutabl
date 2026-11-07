<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveGameSession extends Model
{
    public const STATUS_LOBBY = 'lobby';

    public const STATUS_PLAYING = 'playing';

    public const STATUS_ENDED = 'ended';

    /**
     * Statuses that occupy the one-active-session-per-class slot.
     *
     * @var string[]
     */
    public const ACTIVE_STATUSES = [
        self::STATUS_LOBBY,
        self::STATUS_PLAYING,
    ];

    protected $table = 'live_game_sessions';

    protected $guarded = [];

    protected $casts = [
        'current_question_index' => 'integer',
        'question_seconds' => 'integer',
        'duration_minutes' => 'integer',
        'team_mode' => 'boolean',
        'firewood' => 'integer',
        'fire_lit' => 'boolean',
        'live_version' => 'integer',
        'firewall_active' => 'boolean',
        'bridge_broken' => 'boolean',
        'started_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public const DURATION_MINUTES_MIN = 1;

    public const DURATION_MINUTES_MAX = 60;

    public function game()
    {
        return $this->belongsTo(LiveGame::class, 'live_game_id');
    }

    public function host()
    {
        return $this->belongsTo(User::class, 'host_user_id');
    }

    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function school()
    {
        return $this->belongsTo(Schools::class, 'school_id');
    }

    public function questions()
    {
        return $this->hasMany(LiveGameSessionQuestion::class, 'live_game_session_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function players()
    {
        return $this->hasMany(LiveGameSessionPlayer::class, 'live_game_session_id');
    }

    public function teams()
    {
        return $this->hasMany(LiveGameSessionTeam::class, 'live_game_session_id');
    }

    public function answers()
    {
        return $this->hasMany(LiveGameSessionAnswer::class, 'live_game_session_id');
    }

    public function invites()
    {
        return $this->hasMany(LiveGameSessionInvite::class, 'live_game_session_id');
    }

    public function themeType(): string
    {
        $type = optional($this->game)->type;

        return $type ?: 'classic';
    }

    public function questionSeconds(): int
    {
        return max(10, min(30, (int) ($this->question_seconds ?: 20)));
    }

    /**
     * Standalone GameSession::goalKey.
     */
    public function goalKey(): string
    {
        $goal = (string) $this->goal;

        return in_array($goal, ['vocabulary', 'comprehension', 'speed'], true)
            ? $goal
            : 'comprehension';
    }

    /**
     * Standalone GameSession::goalLabel.
     */
    public function goalLabel(): string
    {
        return [
            'vocabulary' => 'Vocabulary',
            'comprehension' => 'Comprehension',
            'speed' => 'Speed',
        ][$this->goalKey()];
    }

    /**
     * Standalone GameSession::goalHint.
     */
    public function goalHint(): string
    {
        return [
            'vocabulary' => 'Word meaning and recall',
            'comprehension' => 'Understanding the question',
            'speed' => 'Faster correct answers',
        ][$this->goalKey()];
    }

    /**
     * Standalone GameSession::firewoodNeeded.
     */
    public function firewoodNeeded(): int
    {
        return max(2, (int) $this->players()->count());
    }

    /**
     * Standalone GameSession::questionCount, using frozen session snapshots.
     */
    public function questionCount(): int
    {
        return (int) $this->questions()->count();
    }

    /**
     * Standalone GameSession::maxScore.
     */
    public function maxScore(): int
    {
        return max(1, $this->questionCount());
    }

    /**
     * Standalone GameSession::nextQuestionFor, using session snapshots.
     * Does not use current_question_index. Snapshot order: sort_order, id.
     */
    public function nextQuestionFor(LiveGameSessionPlayer $player): ?LiveGameSessionQuestion
    {
        $questions = $this->questions()->get();
        $queue = array_values(array_filter($player->retryQueue(), function ($id) use ($questions) {
            return $questions->contains(function ($question) use ($id) {
                return (int) $question->id === (int) $id;
            });
        }));

        $answeredIds = $this->answers()
            ->where('student_id', $player->student_id)
            ->where('is_reinforce', false)
            ->where('is_retry', false)
            ->pluck('live_game_session_question_id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->all();

        $unseen = $questions->first(function ($question) use ($answeredIds, $queue) {
            $id = (int) $question->id;

            return ! in_array($id, $answeredIds, true)
                && ! in_array($id, $queue, true);
        });

        if ($queue && ($player->dueForRetry() || ! $unseen)) {
            $retryId = (int) $queue[0];

            return $questions->first(function ($question) use ($retryId) {
                return (int) $question->id === $retryId;
            });
        }

        return $unseen;
    }

    public function isLobby(): bool
    {
        return (string) $this->status === self::STATUS_LOBBY;
    }

    public function isActive(): bool
    {
        return in_array((string) $this->status, self::ACTIVE_STATUSES, true);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', self::ACTIVE_STATUSES);
    }
}
