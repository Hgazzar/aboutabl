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
    ];

    public function assign()
    {
        return $this->belongsTo(Assigns::class, 'assign_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
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
        $today = now()->toDateString();

        return $query
            ->pendingReview()
            ->whereHas('assign', function ($assignQuery) use ($today) {
                $assignQuery
                    ->where('status', 1)
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', $today);
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
