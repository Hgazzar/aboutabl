<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnitsSchools extends Model
{
    use HasFactory;

     protected $table = "units_schools";
     protected $fillable = [
      	    'unit_id',
    		'school_id',
    		'status',
    ];
}
