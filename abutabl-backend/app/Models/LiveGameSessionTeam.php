<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveGameSessionTeam extends Model
{
    protected $table = 'live_game_session_teams';

    protected $guarded = [];

    protected $casts = [
        'score' => 'integer',
        'coins' => 'integer',
    ];

    public function session()
    {
        return $this->belongsTo(LiveGameSession::class, 'live_game_session_id');
    }

    public function players()
    {
        return $this->hasMany(LiveGameSessionPlayer::class, 'team_id');
    }
}
