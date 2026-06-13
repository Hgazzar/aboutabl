<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Helpers\Helper;

class Questions extends Model
{
    use HasFactory;

    protected $guarded = [];
//   protected $fillable =[
//             'type',
//             'question',
//             'corAnswer',
//             'answer1',
//             'answer2',
//             'answer3',
//             'answer4',
//             'answer5',
//             'answer6',
//             'answer7',
//             'answer8',
//             'answer1_1',
//             'answer1_2',
//             'answer1_3',
//             'answer1_4',
//             'answer1_5',
//             'answer1_6',
//             'answer1_7',
//             'answer1_8',
//             'subject_id',
//             'unit_id',
//             'lesson_id',
//             'school_id',
//             'created_by',
//             'status',
//             'question_body_type',
//             'answer_body_type',
//             'reason',
//             'reason_is_required',
//             'question_des',
//             'code',
//     ];

    public function getQuestionAudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getQuestionImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getcorAnswerAudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getcorAnswerImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer1ImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer1AudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer2ImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer2AudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer3ImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer3AudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer4ImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer4AudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer5ImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer5AudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer6ImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer6AudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer7ImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer7AudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer8ImageAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    public function getAnswer8AudioAttribute($val)
    {
        if ($val){
            return asset('/').$val;
        } else {
            return '';
        }
    }
    
   public function Lesson()
    {
        return $this->hasOne(Lessons::class,'id','lesson_id');
    }
   
   public function Subject()
    {
        return $this->hasOne(Subject::class,'id','subject_id');
    }
  
   public function Unit()
    {
        return $this->hasOne(Units::class,'id','unit_id');
    }
   
   public function getCreatedAtAttribute($val)
    {
      return \Carbon\Carbon::parse($val)->format('d F Y');
    }
  
    // public function getQuestionAttribute($val)
    // {
    //    return Helper::GetAnswerData($val,"model");
    // }
   
   
}
