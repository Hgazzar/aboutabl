<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grades extends Model
{
    use HasFactory;

    protected $guarded = [];
    //  protected $fillable =[
    //  		'id',
    //         'name',
    //         'school_id',
    //         'status',
    //         'created_by'
    //       ];

    public function GradeSubjectScholl()
    {
        return $this->hasOne(subjectsGrades::class,'grade_id','id');
    }
    
    public function TeachersClasses()
    {
        return $this->hasMany(TeachersGrades::class,'grade_id','id')->groupBy('class_id');
    }

    public function classes()
    {
        return $this->hasMany(Classes::class,'grade_id','id');
    }

    public function students()
    {
        return $this->hasMany(Student::class,'grade_id','id');
    }
}
