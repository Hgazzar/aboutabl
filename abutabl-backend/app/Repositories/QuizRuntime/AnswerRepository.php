<?php

namespace App\Repositories\QuizRuntime;

use App\Models\QuizRuntime\QuizAttemptAnswer;
use Illuminate\Database\Eloquent\Collection;

/**
 * Persistence only for quiz_attempt_answers (F-009D Sprint 1 Step 4).
 */
class AnswerRepository
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): QuizAttemptAnswer
    {
        return QuizAttemptAnswer::query()->create($attributes);
    }

    /**
     * Upsert by (attempt_id, snapshot_question_key).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function upsert(array $attributes): QuizAttemptAnswer
    {
        $attemptId = (int) $attributes['attempt_id'];
        $snapshotQuestionKey = (string) $attributes['snapshot_question_key'];

        /** @var QuizAttemptAnswer|null $existing */
        $existing = QuizAttemptAnswer::query()
            ->where('attempt_id', $attemptId)
            ->where('snapshot_question_key', $snapshotQuestionKey)
            ->first();

        if ($existing === null) {
            return $this->create($attributes);
        }

        $existing->fill($attributes);
        $existing->save();

        return $existing;
    }

    public function save(QuizAttemptAnswer $answer): QuizAttemptAnswer
    {
        $answer->save();

        return $answer;
    }

    /**
     * @return Collection|QuizAttemptAnswer[]
     */
    public function findByAttempt(int $attemptId): Collection
    {
        return QuizAttemptAnswer::query()
            ->where('attempt_id', $attemptId)
            ->orderBy('id')
            ->get();
    }

    public function findOne(int $attemptId, string $snapshotQuestionKey): ?QuizAttemptAnswer
    {
        return QuizAttemptAnswer::query()
            ->where('attempt_id', $attemptId)
            ->where('snapshot_question_key', $snapshotQuestionKey)
            ->first();
    }
}
