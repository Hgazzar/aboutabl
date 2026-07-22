<?php

namespace App\Models\QuizRuntime;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Quizes;
use App\Models\Schools;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * F-009C Runtime aggregate — student attempt session (F-009B state machine).
 * Status constants only; no transition logic (F-009D Sprint 1 Step 3).
 *
 * @property int $id
 * @property int $quiz_id
 * @property int $quiz_version_id
 * @property int $quiz_snapshot_id
 * @property int $student_id
 * @property int|null $school_id
 * @property int|null $assign_id
 * @property int|null $assign_student_id
 * @property string $status
 * @property int $attempt_no
 * @property \Illuminate\Support\Carbon $started_at
 * @property \Illuminate\Support\Carbon|null $ends_at
 * @property \Illuminate\Support\Carbon|null $submitted_at
 * @property \Illuminate\Support\Carbon|null $last_saved_at
 * @property int|null $time_limit_seconds
 * @property string|null $do_when_time_end
 * @property array|null $question_order
 * @property array|null $answer_order
 * @property string|null $client_instance_id
 * @property int $row_version
 * @property string|null $start_idempotency_key
 * @property string|null $submit_idempotency_key
 * @property string|null $active_slot_key
 * @property \Illuminate\Support\Carbon|null $voided_at
 * @property int|null $voided_by
 * @property string|null $void_reason
 * @property \Illuminate\Support\Carbon|null $abandoned_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read Quizes $quiz
 * @property-read QuizVersion $version
 * @property-read QuizSnapshot $snapshot
 * @property-read Student $student
 * @property-read Schools|null $school
 * @property-read Assigns|null $assign
 * @property-read AssignsStudents|null $assignStudent
 * @property-read User|null $voidedBy
 * @property-read \Illuminate\Database\Eloquent\Collection|QuizAttemptAnswer[] $answers
 * @property-read \Illuminate\Database\Eloquent\Collection|QuizResult[] $results
 */
class QuizAttempt extends Model
{
    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_AUTO_GRADED = 'auto_graded';

    public const STATUS_PENDING_MANUAL = 'pending_manual';

    public const STATUS_FINALIZED = 'finalized';

    public const STATUS_ABANDONED = 'abandoned';

    public const STATUS_VOIDED = 'voided';

    protected $table = 'quiz_attempts';

    protected $guarded = [];

    protected $casts = [
        'quiz_id' => 'integer',
        'quiz_version_id' => 'integer',
        'quiz_snapshot_id' => 'integer',
        'student_id' => 'integer',
        'school_id' => 'integer',
        'assign_id' => 'integer',
        'assign_student_id' => 'integer',
        'attempt_no' => 'integer',
        'time_limit_seconds' => 'integer',
        'row_version' => 'integer',
        'voided_by' => 'integer',
        'question_order' => 'array',
        'answer_order' => 'array',
        'started_at' => 'datetime',
        'ends_at' => 'datetime',
        'submitted_at' => 'datetime',
        'last_saved_at' => 'datetime',
        'voided_at' => 'datetime',
        'abandoned_at' => 'datetime',
    ];

    protected $dates = [
        'started_at',
        'ends_at',
        'submitted_at',
        'last_saved_at',
        'voided_at',
        'abandoned_at',
        'created_at',
        'updated_at',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quizes::class, 'quiz_id');
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(QuizVersion::class, 'quiz_version_id');
    }

    public function snapshot(): BelongsTo
    {
        return $this->belongsTo(QuizSnapshot::class, 'quiz_snapshot_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(Schools::class, 'school_id');
    }

    public function assign(): BelongsTo
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function assignStudent(): BelongsTo
    {
        return $this->belongsTo(AssignsStudents::class, 'assign_student_id');
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QuizAttemptAnswer::class, 'attempt_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(QuizResult::class, 'attempt_id');
    }
}
