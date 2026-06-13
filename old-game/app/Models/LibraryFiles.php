<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LibraryFiles extends Model
{
    use HasFactory;

      protected $fillable =[
            'id',
            'library_id',
            'path',
            'size',
            'ext',
    ];
}
