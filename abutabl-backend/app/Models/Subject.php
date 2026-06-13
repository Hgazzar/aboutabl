<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $guarded = [];
    //   protected $fillable = [
    //   	    'name_ar',
    // 		'name',
    // 		'photo',
    // 		'status',
    // 		'des',
    // 		'pass',
    // 		'school_id',
    // 		'grade_id',
    //         'des_ar',
    //         'pass_ar'
    // ];

    public function SubjectSchool()
    {
        return $this->hasOne(subjectsSchools::class,'subject_id','id');
    }

    public function Grades()
    {
        return $this->hasMany(SubjectsGrades::class,'subject_id','id');
    }

    public function Teachers()
    {
        return $this->hasMany(TeachersGrades::class,'subject_id','id');
    }

   public function Lessons()
    {
        return $this->hasMany(Lessons::class,'subject_id','id');
    }

   public function Units()
    {
        return $this->hasMany(Units::class,'subject_id','id');
    }
  
   public function Quizes()
    {
        return $this->hasMany(Quizes::class,'subject_id','id');
    }
  
   public function Games()
    {
        return $this->hasMany(games::class,'subject_id','id');
    }
  

   public function Resources()
    {
        return $this->hasMany(Resources::class,'subject_id','id');
    }

  
   public function WorkSheets()
    {
        return $this->hasMany(WorkSheets::class,'subject_id','id');
    }
  
    public function getPhotoAttribute($val)
    {
        if ($val){
            // Check if the value already contains a full URL (http:// or https://)
            if (strpos($val, 'http://') === 0 || strpos($val, 'https://') === 0) {
                return $val;
            }
            return asset('/storage')."/".$val;
        } else {
            return asset('/')."images/logo/site_logo.png";
        }
    }
}
