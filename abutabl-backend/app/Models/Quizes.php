<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quizes extends Model
{
    use HasFactory;

    protected $guarded = [];
    // protected $fillable =[
    //         'title_en',
    //         'title_ar',
    //         'instructions_en',
    //         'instructions_ar',
    //         'status',
    //         'code',
    //         'subject_id',
    //         'grade_id',
    //         'created_by',
    //         'navigation_method',
    //         'questions_per_page',
    //         'score_method',
    //         'score_to_pass',
    //         'unlimited_attempts',
    //         'num_attempts',
    //         'notify_student',
    //         'notify_about_submission',
    //         'notify_about_late_submission',
    //         'reminder_before_due_date',
    //         'start_date',
    //         'due_date',
    //         'time_limit',
    //         'type_time',
    //         'do_when_time_end',
    //         'unit_id',
    //         'lesson_id'
    // ];

    public function getStatusAttribute($val)
    {
        $d1 =  strtotime(date('Y-m-d'));   
        $d2 =  strtotime($this->due_date);    

         if($val != 0)
        {
             if($this->due_date != "")
             {
                 if($d1 <= $d2)
                   return "Available";
                else
                    return "Due";
             }

             return "Active";
        }
        else
            return "In-active";

        
    }
    public function getCreatedAtAttribute($val)
    {
      return \Carbon\Carbon::parse($val)->format('d F Y');
    }
    public function getStartDateAttribute($val)
    {
      return \Carbon\Carbon::parse($val)->format('d F Y');
    }
    public function getDueDateAttribute($val)
    {
      return \Carbon\Carbon::parse($val)->format('d F Y');
    }

    public function Questions()
    {
        return $this->hasMany(QuizesQuestions::class,'quize_id','id');
    }

    public function contentStandards()
    {
        return $this->hasMany(ContentStandard::class, 'content_id')
            ->where('content_type', 'quizes');
    }
  
}
