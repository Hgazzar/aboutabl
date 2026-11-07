<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveGame extends Model
{
    public const STATUS_UNPUBLISHED = 0;

    public const STATUS_PUBLISHED = 1;

    public const TYPES = ['classic', 'hacking', 'gold_quest'];

    protected $table = 'live_games';

    protected $guarded = [];

    protected $casts = [
        'status' => 'integer',
        'level' => 'integer',
    ];

    public function questions()
    {
        return $this->hasMany(LiveGameQuestion::class, 'live_game_id')->orderBy('sort_order')->orderBy('id');
    }

    public function schools()
    {
        return $this->belongsToMany(Schools::class, 'live_game_schools', 'live_game_id', 'school_id')
            ->withTimestamps();
    }

    public function schoolLinks()
    {
        return $this->hasMany(LiveGameSchool::class, 'live_game_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isPublished(): bool
    {
        return (int) $this->status === self::STATUS_PUBLISHED;
    }

    public function isSelectableForSchool(int $schoolId): bool
    {
        if (! $this->isPublished() || $schoolId <= 0) {
            return false;
        }

        return $this->schoolLinks()->where('school_id', $schoolId)->exists();
    }
}
