<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignActivitySubmission extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_GRADED = 'graded';

    public const STATUS_COMPLETED = 'completed';

    protected $table = 'assign_activity_submissions';

    protected $guarded = [];

    protected $casts = [
        'assign_id' => 'integer',
        'assign_activity_id' => 'integer',
        'assign_student_id' => 'integer',
        'student_id' => 'integer',
        'score' => 'float',
        'max_score' => 'float',
        'percent' => 'float',
        'completeness' => 'float',
        'payload' => 'array',
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
        'graded_by' => 'integer',
    ];

    public function assign(): BelongsTo
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(AssignActivity::class, 'assign_activity_id');
    }

    public function assignStudent(): BelongsTo
    {
        return $this->belongsTo(AssignsStudents::class, 'assign_student_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }
}
