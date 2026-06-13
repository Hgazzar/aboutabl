<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lessons extends Model
{
    use HasFactory;

    protected $fillable =[
     		'id',
            'name_en',
            'name_ar',
            'subject_id',
            'unit_id',
            'status',
            'created_by'
          ];

   
    public function Files()
    {
        return $this->hasMany(LessonsContents::class,'lesson_id','id');
    }
}






