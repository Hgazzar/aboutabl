<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SkillsSheets extends Model
{
    use HasFactory;

         protected $fillable = [
            'skill_id',
			'sheet_id',
          ];


}
