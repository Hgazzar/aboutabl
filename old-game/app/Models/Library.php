<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Library extends Model
{
    use HasFactory;

      protected $fillable =[
            'id',
            'name',
            'created_by',
            'subject_id',
            'status'
    ];
}
