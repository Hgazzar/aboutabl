<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectsGrades extends Model
{
    use HasFactory;

   protected $fillable = [
    'subjects_schools_id',
    'grade_id',
    'subject_id',
    'school_id',
    'status',
	];
}
