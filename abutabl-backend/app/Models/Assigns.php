<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assigns extends Model
{
    use HasFactory;

protected $guarded = [];

    protected $casts = [
        'due_at' => 'datetime',
        'due_date' => 'date',
        'possible_xp' => 'integer',
    ];
    // protected $fillable =[
    //             'type',
    //             'type_id',
    //             'school_id',
    //             'status',
    //             'created_by',
    //             'assigned_name',
    //             'assigned_path',
    //             'grade_id',
    //             'subject_id',
    //       ];

    public function getCreatedAtAttribute($val)
    {
      return \Carbon\Carbon::parse($val)->format('d F Y');
    }

    /**
     * Production compatibility: prefer due_at; fall back to legacy due_date.
     * due_date is never dropped on the production replacement path.
     */
    public function getDueAtAttribute($value)
    {
        if ($value !== null && $value !== '') {
            return $this->asDateTime($value);
        }

        $legacy = $this->attributes['due_date'] ?? null;
        if ($legacy === null || $legacy === '') {
            return null;
        }

        return \Carbon\Carbon::parse($legacy)->endOfDay();
    }

    /**
     * Keep legacy due_date in sync when writers set due_at.
     */
    public function setDueAtAttribute($value): void
    {
        if ($value === null || $value === '') {
            $this->attributes['due_at'] = null;

            return;
        }

        $parsed = $value instanceof \Carbon\Carbon
            ? $value
            : \Carbon\Carbon::parse($value);

        $this->attributes['due_at'] = $parsed->format('Y-m-d H:i:s');

        if ($this->legacyDueDateColumnExists()) {
            $this->attributes['due_date'] = $parsed->toDateString();
        }
    }

    private function legacyDueDateColumnExists(): bool
    {
        static $exists = null;

        if ($exists === null) {
            try {
                $exists = \Illuminate\Support\Facades\Schema::hasColumn($this->getTable(), 'due_date');
            } catch (\Throwable $e) {
                $exists = array_key_exists('due_date', $this->attributes);
            }
        }

        return (bool) $exists;
    }
    public function Students()
    {
        return $this->hasMany(AssignsStudents::class, 'assign_id', 'id');
    }

    public function submissions()
    {
        return $this->hasMany(AssignsStudents::class, 'assign_id', 'id');
    }

    public function rubric()
    {
        return $this->hasOne(AssignmentRubric::class, 'assign_id');
    }

    public function scopeCreatedByTeacher($query, int $teacherId)
    {
        return $query
            ->where('created_by', $teacherId)
            ->where('status', 1);
    }

    public function scopeForTeacher($query, int $teacherId, array $schoolIds = [])
    {
        return $query
            ->createdByTeacher($teacherId)
            ->when($schoolIds !== [], fn ($q) => $q->whereIn('school_id', $schoolIds));
    }

    public function School()
    {
        return $this->hasOne(Schools::class,'id','school_id');
    }

    public function Subject()
    {
        return $this->hasOne(Subject::class,'id','subject_id');
    }
    public function Teacher()
    {
        return $this->hasOne(User::class,'id','created_by');
    }

    public function standards()
    {
        return $this->belongsToMany(Standard::class, 'assign_standard', 'assign_id', 'standard_id')
            ->withPivot('link_source', 'created_at');
    }

    public function assignStandards()
    {
        return $this->hasMany(AssignStandard::class, 'assign_id');
    }

    public function activities()
    {
        return $this->hasMany(AssignActivity::class, 'assign_id')->orderBy('sort_order');
    }

    public function materials()
    {
        return $this->hasMany(AssignmentMaterial::class, 'assign_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function isLearningActivitiesAssign(): bool
    {
        return $this->type === \App\Support\Assignment\LearningActivityMap::ASSIGN_TYPE;
    }
}
