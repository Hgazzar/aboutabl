<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InteractiveGame extends Model
{
    use HasFactory;

    protected $table = 'interactive_games';

    protected $guarded = [];

    protected $casts = [
        'status' => 'integer',
    ];

    public function questions()
    {
        return $this->hasMany(InteractiveGameQuestion::class, 'interactive_game_id')->orderBy('sort_order');
    }
}
