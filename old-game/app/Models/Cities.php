<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cities extends Model
{
    use HasFactory;

    public function getNameAttribute()
    {
        return app()->getLocale() == "en" ? $this->name_en : $this->name_ar;
    }
}
