<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class StudentFriendship extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    protected $table = 'student_friendships';

    protected $guarded = [];

    protected $casts = [
        'student_id' => 'integer',
        'friend_student_id' => 'integer',
        'school_id' => 'integer',
        'accepted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $friendship) {
            if ((int) $friendship->student_id === (int) $friendship->friend_student_id) {
                throw new InvalidArgumentException('A student cannot befriend themselves.');
            }

            if (! self::isValidStatus((string) $friendship->status)) {
                throw new InvalidArgumentException('Invalid friendship status.');
            }
        });
    }

    public static function isValidStatus(string $status): bool
    {
        return in_array($status, [self::STATUS_PENDING, self::STATUS_ACCEPTED], true);
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function friendStudent()
    {
        return $this->belongsTo(Student::class, 'friend_student_id');
    }

    public function school()
    {
        return $this->belongsTo(Schools::class, 'school_id');
    }

    public function scopeAcceptedForStudent($query, int $studentId)
    {
        return $query
            ->where('status', self::STATUS_ACCEPTED)
            ->where(function ($q) use ($studentId) {
                $q->where('student_id', $studentId)
                    ->orWhere('friend_student_id', $studentId);
            });
    }

    public function scopePendingIncomingForStudent($query, int $studentId)
    {
        return $query
            ->where('status', self::STATUS_PENDING)
            ->where('friend_student_id', $studentId);
    }

    public function scopePendingOutgoingForStudent($query, int $studentId)
    {
        return $query
            ->where('status', self::STATUS_PENDING)
            ->where('student_id', $studentId);
    }
}
