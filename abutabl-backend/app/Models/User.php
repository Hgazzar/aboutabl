<?php

namespace App\Models;

use Illuminate\Notifications\Notifiable;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use Notifiable;
    use HasRoles;

    protected $guarded = [];
    // protected $fillable =[
    //         'name',
    //         'name_ar',
    //         'email',
    //         'phone',
    //         'password',
    //         'defaultPassword',
    //         'verify',
    //         'status',
    //         'school_id',
    //         'verify',
    //         'birthday',
    //         'govern_id',
    //         'city_id',
    //         'address',
    //         'photo',
    //         'gender',
    //         'specialize',
    //         'joining_date',
    //         'role_id',
    //         'username',
    //         'memberShip',
    //         'specialize_ar',
    //         'fname_en',
    //         'lname_en',
    //         'fname_ar',
    //         'lname_ar',
    //         'address_ar',
    //         'type'
    // ];
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }
   public function getPhotoAttribute($val)
    {
        return $val == null ? null : asset('/storage')."/".$val;
    }
    public function role()
    {
        return $this->hasOne(Role::class,'id','role_id');
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
