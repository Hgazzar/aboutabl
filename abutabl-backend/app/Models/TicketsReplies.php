<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketsReplies extends Model
{
    use HasFactory;

    protected $guarded = [];
    //  protected $fillable = [
    //  	    'body',
    // 		'ticket_id',
    // 		'student_id',
    // 		'user_id',
    // ];


   public function User()
    {
        return $this->hasOne(User::class,'id','user_id');
    }
  
   public function Student()
    {
        return $this->hasOne(Student::class,'id','student_id');
    }
}
