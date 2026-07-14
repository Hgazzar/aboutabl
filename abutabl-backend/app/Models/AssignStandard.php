<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssignStandard extends Model
{
    protected $table = 'assign_standard';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function assign()
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function standard()
    {
        return $this->belongsTo(Standard::class, 'standard_id');
    }
}
