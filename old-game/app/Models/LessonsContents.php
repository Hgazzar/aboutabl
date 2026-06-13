<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonsContents extends Model
{
    use HasFactory;

    protected $fillable =[
     		'id',
            'name_en',
            'name_ar',
            'about_en',
            'about_ar',
            'lesson_id',
            'type',
            'size',
            'path',
            'created_by',
            'status',
            'subject_id',
            'unit_id',
            'privacy'
    ];
  
    public function getPathAttribute($val)
    {
         return asset('/').$val;   
    }

   public function By()
    {
        return $this->hasOne(User::class,'id','created_by');
    }
  
   public function Schools()
    {
        return $this->hasMany(ConetentsSchools::class,'content_id','id');
    }
  
   public function Rescources()
    {
        return $this->hasMany(Resources::class,'content_id','id');
    }
}
