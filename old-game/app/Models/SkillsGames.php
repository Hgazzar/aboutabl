<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SkillsGames extends Model
{
    use HasFactory;

   protected $fillable = [
    		'skill_id',
			'game_id',
    ];

   public function Skill()
    {
     return $this->hasOne(skills::class,'id','skill_id');
    }

}
