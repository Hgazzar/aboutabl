<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FileManagement extends Model
{
    use HasFactory;

    protected $fillable =[
     		    'id',
     		    'name',
            'hashName',
            'type',
            'size',
            'path',
            'school_id',
            'created_by',
          ];

     public function getPathAttribute($val)
    {
        return asset('/storage')."/".$val;
    }
}








