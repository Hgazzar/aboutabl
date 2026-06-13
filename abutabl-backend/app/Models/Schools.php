<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schools extends Model
{
    use HasFactory;

    protected $guarded = [];
    // protected $fillable = [
    // 		'name',
    //         'name_ar',
    // 		'logo',
    // 		'status',
    // 		'contanct_number',
    // 		'govern_id',
    // 		'city_id',
    //         'address',
    //         'address_ar',
    //         'email',
    // ];

    public function getLogoAttribute($val)
    {
        return asset('/storage')."/".$val;
    }

     public function govern()
    {
        return $this->hasOne(Governs::class,'id','govern_id');
    }

      public function city()
    {
        return $this->hasOne(Cities::class,'id','city_id');
    }
}
