<?php

namespace App\Http\Resources\QuizRuntime;

use Illuminate\Support\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * F-009D Sprint 2 Step 1 — Teacher attempt list row (Runtime only, no keys).
 *
 * @mixin \App\Models\QuizRuntime\QuizAttempt
 */
class TeacherAttemptListResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        return [
            'attempt_id' => (int) $this->id,
            'quiz_id' => (int) $this->quiz_id,
            'student_id' => (int) $this->student_id,
            'school_id' => $this->school_id !== null ? (int) $this->school_id : null,
            'assign_id' => $this->assign_id !== null ? (int) $this->assign_id : null,
            'assign_student_id' => $this->assign_student_id !== null
                ? (int) $this->assign_student_id
                : null,
            'status' => (string) $this->status,
            'attempt_no' => (int) $this->attempt_no,
            'started_at' => $this->formatTs($this->started_at),
            'ends_at' => $this->formatTs($this->ends_at),
            'submitted_at' => $this->formatTs($this->submitted_at),
            'last_saved_at' => $this->formatTs($this->last_saved_at),
        ];
    }

    /**
     * @param  mixed  $value
     */
    private function formatTs($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->toIso8601String();
        }

        try {
            return Carbon::parse($value)->toIso8601String();
        } catch (\Exception $e) {
            return null;
        }
    }
}
