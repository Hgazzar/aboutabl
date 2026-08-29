<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentXpBalance extends Model
{
    protected $guarded = [];

    protected $casts = [
        'student_id' => 'integer',
        'total_xp'   => 'integer',
        'level'      => 'integer',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
