<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveGameQuestion extends Model
{
    public const ANSWER_TYPES = ['text', 'image'];

    protected $table = 'live_game_questions';

    protected $guarded = [];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function game()
    {
        return $this->belongsTo(LiveGame::class, 'live_game_id');
    }

    /**
     * @return string[]
     */
    public function choiceValues(): array
    {
        return array_values(array_filter([
            $this->answer1,
            $this->answer2,
            $this->answer3,
            $this->answer4,
        ], function ($value) {
            return $value !== null && $value !== '';
        }));
    }

    public function isCorrectChoice(string $answer): bool
    {
        return $answer === $this->correct_answer;
    }
}
