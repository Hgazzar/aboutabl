<?php

namespace App\Http\Resources\QuizRuntime;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * F-009E Step 3 — Student post-submission review payload.
 *
 * Expected resource: array{attempt: QuizAttempt, questions: array}
 * Correct answers / explanations are already filtered by QuizReviewService
 * according to frozen review policy.
 */
class AttemptReviewResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        $attempt = $this->resource['attempt'] ?? null;
        $questions = $this->resource['questions'] ?? [];

        return [
            'attempt_id' => $attempt !== null ? (int) $attempt->id : 0,
            'quiz_id' => $attempt !== null ? (int) $attempt->quiz_id : 0,
            'status' => $attempt !== null ? (string) $attempt->status : null,
            'questions' => is_array($questions) ? $questions : [],
        ];
    }
}
