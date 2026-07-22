<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentLessonContentCompletion extends Model
{
    use HasFactory;

    protected $table = 'student_lesson_content_completions';

    protected $guarded = [];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function lesson()
    {
        return $this->belongsTo(Lessons::class, 'lesson_id');
    }

    public function content()
    {
        return $this->belongsTo(LessonsContents::class, 'lesson_content_id');
    }
}
