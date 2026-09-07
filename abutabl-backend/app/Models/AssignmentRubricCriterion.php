<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentRubricCriterion extends Model
{
    protected $table = 'assignment_rubric_criteria';

    protected $guarded = [];

    protected $casts = [
        'assignment_rubric_id' => 'integer',
        'weight' => 'float',
        'max_points' => 'integer',
        'sort_order' => 'integer',
    ];

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(AssignmentRubric::class, 'assignment_rubric_id');
    }
}
