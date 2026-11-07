<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveGameSessionInvite extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_REVOKED = 'revoked';

    public const STATUS_EXPIRED = 'expired';

    public const NOTIFICATION_TYPE = 'live_competition_invite';

    protected $table = 'live_game_session_invites';

    protected $guarded = [];

    protected $casts = [
        'invited_at' => 'datetime',
        'accepted_at' => 'datetime',
        'revoked_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(LiveGameSession::class, 'live_game_session_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
