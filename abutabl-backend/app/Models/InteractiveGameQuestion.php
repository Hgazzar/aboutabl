<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InteractiveGameQuestion extends Model
{
    use HasFactory;

    protected $table = 'interactive_game_questions';

    protected $guarded = [];

    protected $casts = [
        'options' => 'array',
    ];

    public function game()
    {
        return $this->belongsTo(InteractiveGame::class, 'interactive_game_id');
    }

    public function studentAnswers()
    {
        return $this->hasMany(InteractiveStudentAnswer::class, 'interactive_game_question_id');
    }
}
