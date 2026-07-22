<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use RuntimeException;

class StudentSubjectProgress extends Model
{
    use HasFactory;

    protected $table = 'student_subject_progress';

    protected $guarded = [];

    /** @var int Nested write-allow depth (StudentSubjectProgressRepository only; production entry = ProgressWriterService). */
    private static $writesAllowed = 0;

    protected $casts = [
        'value' => 'float',
    ];

    protected static function booted(): void
    {
        static::saving(function () {
            if (self::$writesAllowed < 1) {
                throw new RuntimeException(
                    'student_subject_progress writes must go through StudentSubjectProgressRepository.'
                );
            }
        });
    }

    /**
     * Temporarily allow Eloquent persistence (used only by StudentSubjectProgressRepository).
     *
     * @template T
     * @param  callable(): T  $callback
     * @return T
     */
    public static function withWriteAllowed(callable $callback)
    {
        self::$writesAllowed++;

        try {
            return $callback();
        } finally {
            self::$writesAllowed--;
        }
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
