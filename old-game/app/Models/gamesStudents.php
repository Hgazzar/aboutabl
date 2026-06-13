<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class gamesStudents extends Model
{
    use HasFactory;

      protected $fillable =[
     		'id',
     		'game_id',
            'class_id',
            'student_id',
            'status',
          ];
}
