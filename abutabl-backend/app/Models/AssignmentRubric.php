<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssignmentRubric extends Model
{
    protected $table = 'assignment_rubrics';

    protected $guarded = [];

    protected $casts = [
        'assign_id' => 'integer',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function criteria(): HasMany
    {
        return $this->hasMany(AssignmentRubricCriterion::class, 'assignment_rubric_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }
}
