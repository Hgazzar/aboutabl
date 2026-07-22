<?php

namespace App\Models\QuizRuntime;

use App\Models\Quizes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * F-009C Runtime SSOT — immutable frozen question set for a version.
 * No business logic (F-009D Sprint 1 Step 3).
 *
 * @property int $id
 * @property int $quiz_version_id
 * @property int $quiz_id
 * @property string|null $content_hash
 * @property array $payload
 * @property int $item_count
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read QuizVersion $version
 * @property-read Quizes $quiz
 * @property-read \Illuminate\Database\Eloquent\Collection|QuizAttempt[] $attempts
 */
class QuizSnapshot extends Model
{
    protected $table = 'quiz_snapshots';

    protected $guarded = [];

    protected $casts = [
        'quiz_version_id' => 'integer',
        'quiz_id' => 'integer',
        'payload' => 'array',
        'item_count' => 'integer',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
    ];

    public function version(): BelongsTo
    {
        return $this->belongsTo(QuizVersion::class, 'quiz_version_id');
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quizes::class, 'quiz_id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class, 'quiz_snapshot_id');
    }
}
