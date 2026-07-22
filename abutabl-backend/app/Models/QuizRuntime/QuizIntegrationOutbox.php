<?php

namespace App\Models\QuizRuntime;

use App\Models\Schools;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * F-009C Runtime Outbox — durable integration events (async consumers only).
 * Status constants only; no relay logic (F-009D Sprint 1 Step 3).
 *
 * @property int $id
 * @property int|null $attempt_id
 * @property int|null $school_id
 * @property string $event_type
 * @property string $idempotency_key
 * @property array $payload
 * @property string $status
 * @property int $relay_attempts
 * @property string|null $last_error
 * @property \Illuminate\Support\Carbon|null $published_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read QuizAttempt|null $attempt
 * @property-read Schools|null $school
 */
class QuizIntegrationOutbox extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_DEAD = 'dead';

    /** Canonical event types (F-009B / F-009C) — names only, no emission logic. */
    public const EVENT_ATTEMPT_STARTED = 'QuizAttemptStarted';

    public const EVENT_SUBMITTED = 'QuizSubmitted';

    public const EVENT_AUTO_GRADED = 'QuizAutoGraded';

    public const EVENT_MANUAL_GRADED = 'QuizManualGraded';

    public const EVENT_FINALIZED = 'QuizFinalized';

    public const EVENT_PASSED = 'QuizPassed';

    public const EVENT_FAILED = 'QuizFailed';

    public const EVENT_VOIDED = 'QuizVoided';

    public const EVENT_REGRADED = 'QuizRegraded';

    protected $table = 'quiz_integration_outbox';

    protected $guarded = [];

    protected $casts = [
        'attempt_id' => 'integer',
        'school_id' => 'integer',
        'payload' => 'array',
        'relay_attempts' => 'integer',
        'published_at' => 'datetime',
    ];

    protected $dates = [
        'published_at',
        'created_at',
        'updated_at',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuizAttempt::class, 'attempt_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(Schools::class, 'school_id');
    }
}
