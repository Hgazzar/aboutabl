<?php

namespace App\Models;

use Illuminate\Notifications\Notifiable;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Student extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use Notifiable;

    protected $guarded = [];

    /**
     * In-game passphrase (hacking mode); stored encrypted at rest when supported.
     */
    protected $casts = [
        'game_password' => 'encrypted',
        'avatar_selected_at' => 'datetime',
    ];
    //  protected $fillable = [
    //         'name',
    //         'name_ar',
    //         'photo',
    //         'status',
    //         'username',
    //         'password',
    //         'defaultPassword',
    //         'grade_id',
    //         'class_id',
    //         'school_id',
    //         'address',
    //         'memberShip',
    //         'birthday',
    //         'gender',
    //         'verify',
    //         'verification_code',
    //         'email',
            
    // ];


    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
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

    public function interactiveStudentAnswers()
    {
        return $this->hasMany(InteractiveStudentAnswer::class, 'student_id');
    }

    public function subjectProgress()
    {
        return $this->hasMany(StudentSubjectProgress::class, 'student_id');
    }

    public function assignSubmissions()
    {
        return $this->hasMany(AssignsStudents::class, 'student_id');
    }

    public function scopeActiveInClasses($query, $classIds)
    {
        return $query->whereIn('class_id', $classIds)->where('status', '1');
    }
}
