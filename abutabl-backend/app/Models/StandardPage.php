<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StandardPage extends Model
{
    use HasFactory;

    protected $table = 'standard_pages';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'page_number' => 'integer',
    ];

    public function standard()
    {
        return $this->belongsTo(Standard::class, 'standard_id');
    }
}
