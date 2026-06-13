<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeachersGrades extends Model
{
    use HasFactory;

protected $guarded = [];
    //   protected $fillable = [
    // 		'user_id',
    // 		'grade_id',
    // 		'class_id',
    // 		'subject_id',
    // 		'status',
    // 		'school_id',
    // ];

    public function classes()
    {
        return $this->hasMany(Classes::class,'id','class_id');
    }
}
