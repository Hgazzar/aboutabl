<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectStudent extends Model
{
    use HasFactory;

     public function Subject()
    {
        return $this->hasOne(Subject::class,'id','subject_id');
    }

    public function Student()
    {
        return $this->hasOne(Student::class,'id','student_id');
    }

}
