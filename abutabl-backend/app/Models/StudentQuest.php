<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentQuest extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_COMPLETED = 'completed';

    public const TYPE_UNIT_LESSONS = 'unit_lessons';

    public const TYPE_WEEKLY_XP = 'weekly_xp';

    protected $table = 'student_quests';

    protected $guarded = [];

    protected $casts = [
        'student_id' => 'integer',
        'school_id' => 'integer',
        'subject_id' => 'integer',
        'unit_id' => 'integer',
        'progress_current' => 'integer',
        'progress_target' => 'integer',
        'completed_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
