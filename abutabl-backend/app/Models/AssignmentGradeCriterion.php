<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentGradeCriterion extends Model
{
    protected $table = 'assignment_grade_criteria';

    protected $guarded = [];

    protected $casts = [
        'assignment_grade_id' => 'integer',
        'assignment_rubric_criterion_id' => 'integer',
        'points' => 'integer',
    ];

    public function grade(): BelongsTo
    {
        return $this->belongsTo(AssignmentGrade::class, 'assignment_grade_id');
    }

    public function rubricCriterion(): BelongsTo
    {
        return $this->belongsTo(AssignmentRubricCriterion::class, 'assignment_rubric_criterion_id');
    }
}
