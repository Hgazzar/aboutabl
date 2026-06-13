<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentAnswerGame extends Model
{
    use HasFactory;
    public function question_game()
    {
        return $this->belongsTo(GameQuestion::class, 'game_question_id', 'id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
