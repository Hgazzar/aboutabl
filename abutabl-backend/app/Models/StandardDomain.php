<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StandardDomain extends Model
{
    use HasFactory;

    protected $table = 'standard_domains';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'status' => 'integer',
        'sort_order' => 'integer',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function standards()
    {
        return $this->hasMany(Standard::class, 'domain_id');
    }
}
