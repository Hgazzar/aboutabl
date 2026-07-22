<?php

namespace App\Http\Resources\QuizRuntime;

use Illuminate\Support\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * F-009C Runtime attempt metadata (Save / Submit responses).
 * No play payload, keys, grading, or results.
 *
 * @mixin \App\Models\QuizRuntime\QuizAttempt
 */
class AttemptResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        $serverNow = Carbon::now();

        return [
            'id' => (int) $this->id,
            'attempt_id' => (int) $this->id,
            'status' => (string) $this->status,
            'submitted_at' => $this->formatTs($this->submitted_at),
            'last_saved_at' => $this->formatTs($this->last_saved_at),
            'row_version' => (int) $this->row_version,
            'server_now' => $serverNow->toIso8601String(),
            'ends_at' => $this->formatTs($this->ends_at),
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
