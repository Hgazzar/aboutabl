<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectActivity extends Model
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

    public function quizes()
    {
        
        return $this->hasMany(Quizes::class,'subject_activity_id','id')->where('type', 'Quizzes');
        
    }
    
    public function games()
    {
        
        return $this->hasMany(Games::class,'subject_activity_id','id')->where('type', 'Games');
        
    }
    
    public function work_sheets()
    {
        
        return $this->hasMany(WorkSheets::class,'subject_activity_id','id')->where('type', 'Worksheets');
        
    }
}





