<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLesson extends Model
{
    use HasFactory;

    protected $guarded = [];
    //  protected $fillable = [
    //   	'name',
    // 		'name_ar',
    // 		'status',
    // 		'type',
    // 		'subject_id',
    //     'school_id',
    // 		'created_by',
    //     'for_teacher',
    // ];

  //  public function Quizes()
  //   {
  //       return $this->hasMany(Quizes::class,'unit_id','id');
  //   }
  
    public function SubjectActivity()
    {
        return $this->belongsTo(SubjectActivity::class, 'subject_activity_id', 'id');
    }
}





