<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameQuestion extends Model
{
    use HasFactory;

    public function game()
    {
        return $this->belongsTo(Game1::class, 'game1_id', 'id');
    }
}
