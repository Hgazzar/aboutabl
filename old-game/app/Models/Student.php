<?php

namespace App\Models;

use Illuminate\Notifications\Notifiable;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
//use Tymon\JWTAuth\Contracts\JWTSubject;

class Student extends Authenticatable
{
    use HasFactory;
    use Notifiable;

     protected $fillable = [
            'name',
            'name_ar',
            'photo',
            'status',
            'username',
            'password',
            'defaultPassword',
            'grade_id',
            'class_id',
            'school_id',
            'address',
            'memberShip',
            'birthday',
            'gender',
            'verify',
            'verification_code',
            'email',
            'is_online',

    ];


//    public function getJWTIdentifier()
//    {
//        return $this->getKey();
//    }
//
//    public function getJWTCustomClaims()
//    {
//        return [];
//    }

    public function questions_answer()
    {
        return $this->hasMany(StudentAnswerGame::class,'student_id','id');
    }


    public function School()
    {
        return $this->hasOne(Schools::class,'id','school_id');
    }

    public function Grade()
    {
        return $this->hasOne(Grades::class,'id','grade_id');
    }

    public function Class()
    {
        return $this->hasOne(Classes::class,'id','class_id');
    }


}
