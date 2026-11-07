<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveGameSchool extends Model
{
    protected $table = 'live_game_schools';

    protected $guarded = [];

    public function game()
    {
        return $this->belongsTo(LiveGame::class, 'live_game_id');
    }

    public function school()
    {
        return $this->belongsTo(Schools::class, 'school_id');
    }
}
