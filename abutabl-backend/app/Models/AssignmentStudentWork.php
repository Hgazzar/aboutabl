<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentStudentWork extends Model
{
    public const KIND_IMAGE = 'image';

    public const KIND_DOCUMENT = 'document';

    public const KIND_VOICE = 'voice';

    /** @var array<int, string> */
    public const KINDS = [
        self::KIND_IMAGE,
        self::KIND_DOCUMENT,
        self::KIND_VOICE,
    ];

    protected $table = 'assignment_student_works';

    protected $guarded = [];

    protected $casts = [
        'assign_id' => 'integer',
        'assign_student_id' => 'integer',
        'student_id' => 'integer',
        'size_bytes' => 'integer',
        'duration_ms' => 'integer',
        'sort_order' => 'integer',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function assignStudent(): BelongsTo
    {
        return $this->belongsTo(AssignsStudents::class, 'assign_student_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
