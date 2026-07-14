<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentStandard extends Model
{
    protected $table = 'content_standard';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function standard()
    {
        return $this->belongsTo(Standard::class, 'standard_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(StandardAuditLog::class, 'content_standard_id');
    }
}
