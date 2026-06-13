<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InteractiveStudentAnswer extends Model
{
    use HasFactory;

    protected $table = 'interactive_student_answers';

    protected $guarded = [];

    protected $casts = [
        'correct' => 'integer',
    ];

    public function question()
    {
        return $this->belongsTo(InteractiveGameQuestion::class, 'interactive_game_question_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
