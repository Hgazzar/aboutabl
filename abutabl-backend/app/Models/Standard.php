<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Standard extends Model
{
    use HasFactory;

    protected $table = 'standards';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'status' => 'integer',
        'sort_order' => 'integer',
    ];

    public function domain()
    {
        return $this->belongsTo(StandardDomain::class, 'domain_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function pages()
    {
        return $this->hasMany(StandardPage::class, 'standard_id');
    }

    public function assigns()
    {
        return $this->belongsToMany(Assigns::class, 'assign_standard', 'standard_id', 'assign_id')
            ->withPivot('link_source', 'created_at');
    }

    public function assignStandards()
    {
        return $this->hasMany(AssignStandard::class, 'standard_id');
    }

    public function contentStandards()
    {
        return $this->hasMany(ContentStandard::class, 'standard_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(StandardAuditLog::class, 'standard_id');
    }
}
