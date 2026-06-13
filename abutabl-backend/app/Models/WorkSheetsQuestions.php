<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkSheetsQuestions extends Model
{
    use HasFactory;

    protected $table = 'work_sheets_questions';
    protected $guarded = [];
    //  protected $fillable =[
    //         'game_id',
    //         'question_id',
    //         'score',
    //         'code',
    //         'created_by',
    //         'status',
    // ];
}
