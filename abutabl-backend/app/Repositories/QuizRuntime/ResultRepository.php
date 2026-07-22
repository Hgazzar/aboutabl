<?php

namespace App\Repositories\QuizRuntime;

use App\Models\QuizRuntime\QuizResult;
use Illuminate\Database\Eloquent\Collection;

/**
 * Persistence only for quiz_results (F-009D Sprint 1 Step 4).
 */
class ResultRepository
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): QuizResult
    {
        return QuizResult::query()->create($attributes);
    }

    public function save(QuizResult $result): QuizResult
    {
        $result->save();

        return $result;
    }

    public function findAuthoritative(int $attemptId): ?QuizResult
    {
        return QuizResult::query()
            ->where('attempt_id', $attemptId)
            ->where('is_authoritative', true)
            ->first();
    }

    /**
     * @return Collection|QuizResult[]
     */
    public function findHistory(int $attemptId): Collection
    {
        return QuizResult::query()
            ->where('attempt_id', $attemptId)
            ->orderByDesc('grade_version')
            ->get();
    }

    public function findLatest(int $attemptId): ?QuizResult
    {
        return QuizResult::query()
            ->where('attempt_id', $attemptId)
            ->orderByDesc('grade_version')
            ->orderByDesc('id')
            ->first();
    }
}
