<?php

namespace App\Http\Resources\QuizRuntime;

use Illuminate\Support\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * F-009F — Student attempt summary (latest / history row).
 * No answers, keys, explanations, or snapshot internals.
 *
 * Expected resource: array{attempt: QuizAttempt, result: ?QuizResult}
 */
class AttemptSummaryResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        $attempt = $this->resource['attempt'] ?? null;
        $result = $this->resource['result'] ?? null;

        return [
            'attempt_id' => $attempt !== null ? (int) $attempt->id : 0,
            'quiz_id' => $attempt !== null ? (int) $attempt->quiz_id : 0,
            'attempt_number' => $attempt !== null ? (int) $attempt->attempt_no : 0,
            'status' => $attempt !== null ? (string) $attempt->status : null,
            'started_at' => $this->formatTs($attempt->started_at ?? null),
            'submitted_at' => $this->formatTs($attempt->submitted_at ?? null),
            'finalized_at' => $this->formatTs($result->finalized_at ?? null),
            'score' => $result !== null ? (float) $result->raw_score : null,
            'max_score' => $result !== null ? (float) $result->max_score : null,
            'percentage' => $result !== null ? (float) $result->percent : null,
            'passed' => $result !== null ? (bool) $result->passed : null,
            'pending_manual' => $result !== null ? (bool) $result->pending_manual : null,
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
