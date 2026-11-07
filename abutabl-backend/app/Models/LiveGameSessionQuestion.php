<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveGameSessionQuestion extends Model
{
    protected $table = 'live_game_session_questions';

    protected $guarded = [];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function session()
    {
        return $this->belongsTo(LiveGameSession::class, 'live_game_session_id');
    }

    public function catalogQuestion()
    {
        return $this->belongsTo(LiveGameQuestion::class, 'live_game_question_id');
    }

    /**
     * Standalone GameQuestion::choiceValues, using the frozen snapshot row.
     *
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

    /**
     * Standalone GameQuestion::isCorrectChoice.
     */
    public function isCorrectChoice(string $answer): bool
    {
        return $answer === $this->correct_answer;
    }

    /**
     * Frozen copy of a catalog question. Catalog edits must not mutate this row.
     *
     * @return array<string,mixed>
     */
    public static function snapshotFromCatalog(LiveGameQuestion $question): array
    {
        return [
            'live_game_question_id' => $question->id,
            'question' => $question->question,
            'image' => $question->image,
            'voice_url' => $question->voice_url,
            'correct_answer' => (string) $question->correct_answer,
            'answer_type' => $question->answer_type,
            'answer1' => (string) $question->answer1,
            'answer2' => (string) $question->answer2,
            'answer3' => (string) $question->answer3,
            'answer4' => (string) $question->answer4,
            'explanation' => $question->explanation,
            'sort_order' => (int) $question->sort_order,
        ];
    }
}
