<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class games extends Model
{
    use HasFactory;

    protected $guarded = [];
    //  protected $fillable =[
    //  		    'id',
    //  		    'name_en',
    //         'name_ar',
    //         'code',
    //         'des_en',
    //         'des_ar',
    //         'background',
    //         'path',
    //         'size',
    //         'ext',
    //         'subject_id',
    //         'grade_id',
    //         'created_by',
    //         'status',
    //       ];

    public function getBackgroundAttribute($val)
    {
        // return asset('/storage')."/".$val;
        if ($val){
            return asset('/storage')."/".$val;
        } else {
            return asset('/')."images/logo/site_logo.png";
        }
    }
    public function getPathAttribute($val)
    {
        return asset('/')."/".$val;
    }
    
    public function questions()
    {
        return $this->hasMany(GamesQuestions::class,'game_id','id');
    }
}
