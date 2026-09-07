<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssignActivity extends Model
{
    protected $table = 'assign_activities';

    protected $guarded = [];

    protected $casts = [
        'assign_id' => 'integer',
        'activity_id' => 'integer',
        'sort_order' => 'integer',
    ];

    public function assign(): BelongsTo
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssignActivitySubmission::class, 'assign_activity_id');
    }
}
