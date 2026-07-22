<?php

namespace App\Http\Resources\QuizRuntime;

use Illuminate\Support\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * F-009C Result summary for Auto Grade / Finalize.
 * No keys, grading details, or snapshot internals.
 *
 * Expected resource: array{attempt: QuizAttempt, result: QuizResult}
 * or a QuizResult model.
 */
class ResultResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        $attempt = is_array($this->resource) ? ($this->resource['attempt'] ?? null) : null;
        $result = is_array($this->resource) ? ($this->resource['result'] ?? null) : $this->resource;

        return [
            'attempt_id' => $attempt !== null
                ? (int) $attempt->id
                : (int) ($result->attempt_id ?? 0),
            'status' => $attempt !== null
                ? (string) $attempt->status
                : null,
            'finalized_at' => $this->formatTs($result->finalized_at ?? null),
            'score' => $result !== null ? (float) $result->raw_score : 0.0,
            'max_score' => $result !== null ? (float) $result->max_score : 0.0,
            'percentage' => $result !== null ? (float) $result->percent : 0.0,
            'pending_manual' => $result !== null ? (bool) $result->pending_manual : false,
            'pass' => $result !== null ? (bool) $result->passed : false,
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
