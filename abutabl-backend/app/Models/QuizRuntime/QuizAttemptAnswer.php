<?php

namespace App\Models\QuizRuntime;

use App\Models\Questions;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * F-009C Runtime — per-question draft/frozen answer for an attempt.
 * No business logic (F-009D Sprint 1 Step 3).
 *
 * @property int $id
 * @property int $attempt_id
 * @property int $question_id
 * @property string $snapshot_question_key
 * @property array|null $response_payload
 * @property bool $is_draft
 * @property \Illuminate\Support\Carbon|null $answered_at
 * @property string|null $auto_score
 * @property string|null $manual_score
 * @property bool|null $is_correct
 * @property bool $needs_manual
 * @property \Illuminate\Support\Carbon|null $graded_at
 * @property int|null $graded_by
 * @property string|null $teacher_comment
 * @property int $answer_version
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read QuizAttempt $attempt
 * @property-read Questions $question
 * @property-read User|null $gradedBy
 */
class QuizAttemptAnswer extends Model
{
    protected $table = 'quiz_attempt_answers';

    protected $guarded = [];

    protected $casts = [
        'attempt_id' => 'integer',
        'question_id' => 'integer',
        'response_payload' => 'array',
        'is_draft' => 'boolean',
        'is_correct' => 'boolean',
        'needs_manual' => 'boolean',
        'auto_score' => 'decimal:2',
        'manual_score' => 'decimal:2',
        'graded_by' => 'integer',
        'answer_version' => 'integer',
        'answered_at' => 'datetime',
        'graded_at' => 'datetime',
    ];

    protected $dates = [
        'answered_at',
        'graded_at',
        'created_at',
        'updated_at',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuizAttempt::class, 'attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Questions::class, 'question_id');
    }

    public function gradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }
}
