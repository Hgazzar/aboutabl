<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assigns extends Model
{
    use HasFactory;

    protected $fillable =[
                'type',
                'type_id',
                'school_id',
                'status',
                'created_by',
                'assigned_name',
                'assigned_path',
                'grade_id',
                'subject_id',
          ];

    public function getCreatedAtAttribute($val)
    {
      return \Carbon\Carbon::parse($val)->format('d F Y');
    }
    public function Students()
    {
        return $this->hasMany(AssignsStudents::class,'assign_id','id');
    }

    public function School()
    {
        return $this->hasOne(Schools::class,'id','school_id');
    }

    public function Subject()
    {
        return $this->hasOne(Subject::class,'id','subject_id');
    }
    public function Teacher()
    {
        return $this->hasOne(User::class,'id','created_by');
    }


      
}
