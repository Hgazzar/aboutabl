<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherEvaluation extends Model
{
    use HasFactory;

    protected $table = 'teacher_evaluations';

    protected $fillable = [
        'school_id',
        'teacher_id',
        'class_id',
        'student_id',
        'note',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function classRoom()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function scopeForStudentInClass($query, int $studentId, int $classId)
    {
        return $query
            ->where('student_id', $studentId)
            ->where('class_id', $classId);
    }

    public function scopeOwnedByTeacher($query, int $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }
}
