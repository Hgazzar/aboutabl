<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizesQuestions extends Model
{
    use HasFactory;

     protected $fillable =[
            'quize_id',
            'question_id',
            'score',
            'code',
            'created_by',
            'status',
    ];
}
