<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;


class Tickets extends Model
{
    use HasFactory;

    protected $fillable = [
    		'title',
    		'des',
    		'status',
    		'school_id',
    		'user_id',
    		'updated_by',
    		'student_id',
    ];

    public function getCreatedAtAttribute($val)
    {
      return Carbon::parse($val)->format('d F, Y H:m A');
    }
    public function getStatusAttribute($val)
    {
        $status = $val == '0' ? 'New' : 'Closed';
        return $status;
    }

   public function User()
    {
        return $this->hasOne(User::class,'id','user_id');
    }
  
   public function Student()
    {
        return $this->hasOne(Student::class,'id','student_id');
    }
  
   public function Replies()
    {
        return $this->hasMany(TicketsReplies::class,'ticket_id','id');
    }
  
}
