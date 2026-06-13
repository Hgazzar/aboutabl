<?php

namespace App\Models;


use App\Pipeline\Ajax\Name;
// use App\Traits\HasFilter;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Models\Role as BaseRole;

class Role extends BaseRole
{
    // use HasFilter;

    // protected $queryFilters = [
    //     Name::class
    // ];

    public $table = 'roles';

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';


    public $fillable = [
        'name',
        'category',
        'guard_name',
        'scope',
        'status',
    ];

    public function School()
    {
        return $this->hasMany(SchoolsRoles::class,'role_id','id');
    }
}

