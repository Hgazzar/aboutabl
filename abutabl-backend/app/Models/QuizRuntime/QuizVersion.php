<?php

namespace App\Models\QuizRuntime;

use App\Models\Quizes;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * F-009C Runtime SSOT — immutable published quiz revision.
 * No business logic (F-009D Sprint 1 Step 3).
 *
 * @property int $id
 * @property int $quiz_id
 * @property int $version_number
 * @property string $status
 * @property string|null $content_hash
 * @property array|null $settings_frozen
 * @property int|null $published_by
 * @property \Illuminate\Support\Carbon|null $published_at
 * @property \Illuminate\Support\Carbon|null $source_definition_updated_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read Quizes $quiz
 * @property-read User|null $publisher
 * @property-read QuizSnapshot|null $snapshot
 * @property-read \Illuminate\Database\Eloquent\Collection|QuizAttempt[] $attempts
 */
class QuizVersion extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_SUPERSEDED = 'superseded';

    public const STATUS_VOID_PUBLISH = 'void_publish';

    protected $table = 'quiz_versions';

    protected $guarded = [];

    protected $casts = [
        'version_number' => 'integer',
        'quiz_id' => 'integer',
        'published_by' => 'integer',
        'settings_frozen' => 'array',
        'published_at' => 'datetime',
        'source_definition_updated_at' => 'datetime',
    ];

    protected $dates = [
        'published_at',
        'source_definition_updated_at',
        'created_at',
        'updated_at',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quizes::class, 'quiz_id');
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function snapshot(): HasOne
    {
        return $this->hasOne(QuizSnapshot::class, 'quiz_version_id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class, 'quiz_version_id');
    }
}
