<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game1 extends Model
{
    use HasFactory;
    
     protected $table = 'games';

    public function questions()
    {
        return $this->hasMany(GameQuestion::class,'game1_id','id');
    }
}
