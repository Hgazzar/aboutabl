<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectsClasses extends Model
{
    use HasFactory;
    
    protected $fillable = [
    'subject_school_id',
    'subject_id',
    'teacher_id',
    'class_id',
    'status',
    'created_by',
	];
}
