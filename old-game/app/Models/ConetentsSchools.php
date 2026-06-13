<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConetentsSchools extends Model
{
    use HasFactory;


     protected $table = "conetents_schools";
     protected $fillable = [
      	    'content_id',
    		'school_id',
    		'status',
    ];
}
