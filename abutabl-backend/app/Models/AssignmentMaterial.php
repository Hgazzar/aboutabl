<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentMaterial extends Model
{
    public const KIND_FILE = 'file';

    public const KIND_VOICE = 'voice';

    public const KIND_LINK = 'link';

    /** @var array<int, string> */
    public const KINDS = [
        self::KIND_FILE,
        self::KIND_VOICE,
        self::KIND_LINK,
    ];

    protected $table = 'assignment_materials';

    protected $guarded = [];

    protected $casts = [
        'assign_id' => 'integer',
        'size_bytes' => 'integer',
        'duration_ms' => 'integer',
        'sort_order' => 'integer',
        'created_by' => 'integer',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
