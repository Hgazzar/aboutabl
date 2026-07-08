<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classes extends Model
{
    use HasFactory;
    
    protected $guarded = [];

    //  protected $fillable =[
    //         'name',
    //         'school_id',
    //         'status',
    //         'created_by',
    //         'num_students',
    //         'grade_id',
    //         'teacher_id'
    //       ];

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id', 'id');
    }

    public function grade()
    {
        return $this->belongsTo(Grades::class, 'grade_id');
    }

    public function teacherAssignments()
    {
        return $this->hasMany(TeachersGrades::class, 'class_id');
    }
}
