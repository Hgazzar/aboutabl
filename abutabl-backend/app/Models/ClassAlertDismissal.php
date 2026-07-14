<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassAlertDismissal extends Model
{
    use HasFactory;

    protected $table = 'class_alert_dismissals';

    protected $guarded = [];

    protected $casts = [
        'dismissed_at' => 'datetime',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function classRoom()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function scopeForTeacherClass($query, int $teacherId, int $classId)
    {
        return $query
            ->where('teacher_id', $teacherId)
            ->where('class_id', $classId);
    }
}
