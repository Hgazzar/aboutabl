<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestTable extends Model
{
    use HasFactory;

    protected $table = 'test_table';

    protected $guarded = [];
    //  protected $fillable = [
    //   	'name',
    // 		'name_ar',
    // 		'status',
    // 		'type',
    // 		'subject_id',
    //     'school_id',
    // 		'created_by',
    //     'for_teacher',
    // ];

  //  public function Quizes()
  //   {
  //       return $this->hasMany(Quizes::class,'unit_id','id');
  //   }
}





