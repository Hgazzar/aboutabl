<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Units extends Model
{
    use HasFactory;

     protected $fillable = [
      	'name',
    		'name_ar',
    		'status',
    		'type',
    		'subject_id',
        'school_id',
    		'created_by',
        'for_teacher',
    ];

  public function Students()
    {
        return $this->hasMany(UnitsPrivatesstudents::class,'unit_id','id');
    }

   public function Lessons()
    {
        return $this->hasMany(Lessons::class,'unit_id','id');
    }

   public function Quizes()
    {
        return $this->hasMany(Quizes::class,'unit_id','id');
    }

   public function Contents()
    {
        return $this->hasMany(LessonsContents::class,'unit_id','id')->orderBy('unit_id','ASC');
    }

  public function Schools()
    {
        return $this->hasMany(UnitsSchools::class,'unit_id','id');
    }
}





