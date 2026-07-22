<?php

namespace App\Models\QuizRuntime;

use App\Models\Quizes;
use App\Models\Schools;
use App\Models\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * F-009C Runtime Result SSOT — authoritative (or historical) outcome for an attempt.
 * No business logic (F-009D Sprint 1 Step 3).
 *
 * @property int $id
 * @property int $attempt_id
 * @property int $student_id
 * @property int $quiz_id
 * @property int|null $school_id
 * @property string $raw_score
 * @property string $max_score
 * @property string|null $scaled_score
 * @property string $percent
 * @property string $auto_score_total
 * @property string $manual_score_total
 * @property bool $passed
 * @property bool $pending_manual
 * @property int $grade_version
 * @property bool $is_authoritative
 * @property int|null $authoritative_slot
 * @property \Illuminate\Support\Carbon $finalized_at
 * @property array|null $breakdown
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read QuizAttempt $attempt
 * @property-read Student $student
 * @property-read Quizes $quiz
 * @property-read Schools|null $school
 */
class QuizResult extends Model
{
    protected $table = 'quiz_results';

    protected $guarded = [];

    protected $casts = [
        'attempt_id' => 'integer',
        'student_id' => 'integer',
        'quiz_id' => 'integer',
        'school_id' => 'integer',
        'raw_score' => 'decimal:2',
        'max_score' => 'decimal:2',
        'scaled_score' => 'decimal:2',
        'percent' => 'decimal:2',
        'auto_score_total' => 'decimal:2',
        'manual_score_total' => 'decimal:2',
        'passed' => 'boolean',
        'pending_manual' => 'boolean',
        'grade_version' => 'integer',
        'is_authoritative' => 'boolean',
        'authoritative_slot' => 'integer',
        'breakdown' => 'array',
        'finalized_at' => 'datetime',
    ];

    protected $dates = [
        'finalized_at',
        'created_at',
        'updated_at',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuizAttempt::class, 'attempt_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quizes::class, 'quiz_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(Schools::class, 'school_id');
    }
}
