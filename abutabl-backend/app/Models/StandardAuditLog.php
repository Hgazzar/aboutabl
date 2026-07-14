<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StandardAuditLog extends Model
{
    protected $table = 'standard_audit_logs';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'confidence_score' => 'float',
        'created_at'       => 'datetime',
    ];

    public function contentStandard()
    {
        return $this->belongsTo(ContentStandard::class, 'content_standard_id');
    }

    public function standard()
    {
        return $this->belongsTo(Standard::class, 'standard_id');
    }
}
