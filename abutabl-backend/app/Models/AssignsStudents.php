<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssignsStudents extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'opened_at' => 'datetime',
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
    ];

    public const SUBMISSION_ACTIVE = 'active';

    public const SUBMISSION_SUBMITTED = 'submitted';

    public const SUBMISSION_GRADED = 'graded';

    public function assign()
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function grade()
    {
        return $this->hasOne(AssignmentGrade::class, 'assign_student_id');
    }

    public function hasParentSubmission(): bool
    {
        if (! \Illuminate\Support\Facades\Schema::hasColumn($this->getTable(), 'submission_status')
            && ! \Illuminate\Support\Facades\Schema::hasColumn($this->getTable(), 'submitted_at')) {
            return false;
        }

        $status = strtolower((string) ($this->submission_status ?? self::SUBMISSION_ACTIVE));

        return in_array($status, [self::SUBMISSION_SUBMITTED, self::SUBMISSION_GRADED], true)
            || $this->submitted_at !== null;
    }

    /**
     * Pending submissions the teacher still needs to review.
     */
    public function scopePendingReview($query)
    {
        return $query->whereNull('opened_at')->where('status', 1);
    }

    /**
     * Overdue: not opened and past the parent assignment due date.
     */
    public function scopeOverdue($query)
    {
        $now = now();

        return $query
            ->pendingReview()
            ->whereHas('assign', function ($assignQuery) use ($now) {
                $assignQuery
                    ->where('status', 1)
                    ->whereNotNull('due_at')
                    ->where('due_at', '<', $now);
            });
    }

    /**
     * Completed submissions for a student assignment row.
     */
    public function scopeCompleted($query)
    {
        return $query->whereNotNull('opened_at')->where('status', 1);
    }

    /**
     * Pending: not opened and not yet past due (or no due date).
     */
    public function scopePending($query)
    {
        $now = now();

        return $query
            ->pendingReview()
            ->whereHas('assign', function ($assignQuery) use ($now) {
                $assignQuery
                    ->where('status', 1)
                    ->where(function ($dueQuery) use ($now) {
                        $dueQuery
                            ->whereNull('due_at')
                            ->orWhere('due_at', '>=', $now);
                    });
            });
    }
    //  protected $fillable =[
    //         'type',
    //         'type_id',
    //         'student_id',
    //         'school_id',
    //         'status',
    //         'created_by',
    //         'assign_id',
    //       ];
}
