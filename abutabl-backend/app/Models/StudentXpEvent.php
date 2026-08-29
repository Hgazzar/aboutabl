<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentXpEvent extends Model
{
    protected $guarded = [];

    protected $casts = [
        'student_id' => 'integer',
        'source_id'  => 'integer',
        'amount'     => 'integer',
        'earned_at'  => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
