<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use RuntimeException;

class PerformanceFact extends Model
{
    use HasFactory;

    protected $table = 'performance_facts';

    protected $guarded = [];

    /** @var int Nested write-allow depth (Recorder only). */
    private static $writesAllowed = 0;

    protected $casts = [
        'metric_date'         => 'date',
        'captured_at'         => 'datetime',
        'performance_percent' => 'float',
        'score_percent'       => 'float',
        'completion_percent'  => 'float',
        'progress_average'    => 'float',
        'overdue_count'       => 'integer',
        'has_progress_data'   => 'boolean',
        'meta'                => 'array',
    ];

    protected static function booted(): void
    {
        static::saving(function () {
            if (self::$writesAllowed < 1) {
                throw new RuntimeException(
                    'performance_facts writes must go through PerformanceSnapshotRecorder.'
                );
            }
        });
    }

    /**
     * Temporarily allow Eloquent persistence (used only by PerformanceSnapshotRecorder).
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

    public function school()
    {
        return $this->belongsTo(Schools::class, 'school_id');
    }

    public function classRoom()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    /**
     * Deterministic daily upsert key (handles NULL subject as 0).
     */
    public static function buildFactKey(
        int $studentId,
        int $classId,
        ?int $subjectId,
        string $metricDate
    ): string {
        return sprintf(
            '%d:%d:%d:%s',
            $studentId,
            $classId,
            (int) ($subjectId ?? 0),
            $metricDate
        );
    }
}
