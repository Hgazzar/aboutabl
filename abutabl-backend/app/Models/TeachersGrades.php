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

    public function teacher()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function grade()
    {
        return $this->belongsTo(Grades::class, 'grade_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function school()
    {
        return $this->belongsTo(Schools::class, 'school_id');
    }

    public function scopeAssignedToTeacher($query, int $teacherId)
    {
        return $query
            ->where('user_id', $teacherId)
            ->where('status', 1);
    }

    public function scopeActiveForTeacher($query, int $teacherId, array $schoolIds)
    {
        return $query
            ->assignedToTeacher($teacherId)
            ->when($schoolIds !== [], fn ($q) => $q->whereIn('school_id', $schoolIds));
    }
}
