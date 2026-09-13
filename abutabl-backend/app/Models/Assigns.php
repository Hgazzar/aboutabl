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
