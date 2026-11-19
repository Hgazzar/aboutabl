<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizWorkbookField extends Model
{
    protected $table = 'quiz_workbook_fields';

    protected $guarded = [];

    public function question()
    {
        return $this->belongsTo(Questions::class, 'question_id');
    }
}
