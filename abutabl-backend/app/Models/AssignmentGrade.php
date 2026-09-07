<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssignmentGrade extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_FINALIZED = 'finalized';

    protected $table = 'assignment_grades';

    protected $guarded = [];

    protected $casts = [
        'assign_id' => 'integer',
        'assign_student_id' => 'integer',
        'final_percent' => 'float',
        'possible_xp' => 'integer',
        'earned_xp' => 'integer',
        'graded_by' => 'integer',
        'finalized_at' => 'datetime',
    ];

    public function assign(): BelongsTo
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function assignStudent(): BelongsTo
    {
        return $this->belongsTo(AssignsStudents::class, 'assign_student_id');
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    public function criteria(): HasMany
    {
        return $this->hasMany(AssignmentGradeCriterion::class, 'assignment_grade_id');
    }
}
