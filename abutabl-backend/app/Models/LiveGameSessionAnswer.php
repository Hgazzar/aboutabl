<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveGameSessionAnswer extends Model
{
    protected $table = 'live_game_session_answers';

    protected $guarded = [];

    protected $casts = [
        'correct' => 'boolean',
        'coins_delta' => 'integer',
        'elapsed_ms' => 'integer',
        'timed_out' => 'boolean',
        'is_retry' => 'boolean',
        'is_reinforce' => 'boolean',
        'attempt' => 'integer',
    ];

    public function session()
    {
        return $this->belongsTo(LiveGameSession::class, 'live_game_session_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function question()
    {
        return $this->belongsTo(LiveGameSessionQuestion::class, 'live_game_session_question_id');
    }
}
