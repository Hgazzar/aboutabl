<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolsRoles extends Model
{
    use HasFactory;

    protected $table = 'schools_roles';
    protected $guarded = [];
    // protected $fillable = [
    // 	'role_id',
    // 	'school_id',
    // 	'status',
    // 	'user_id'
    // ];

}
