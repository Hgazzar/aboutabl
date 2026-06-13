<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkSheets extends Model
{
    use HasFactory;
    protected $fillable =[
            'name_en',
            'name_ar',
            'des_en',
            'des_ar',
            'status',
            'code',
            'subject_id',
            'created_by',
            'file',
            'size',
            'path',
            'ext',
            'file_name',
            'file_hash_name',
            'background'
          ];
    public function getCreatedAtAttribute($val)
    {
      return \Carbon\Carbon::parse($val)->format('d F Y');
    }
    public function getBackgroundAttribute($val)
    {
        return asset('/storage')."/".$val;
    }
    public function getPathAttribute($val)
    {
        return asset('/').$val;
    }
}
