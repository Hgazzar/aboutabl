<?php

namespace App\Repositories\QuizRuntime;

use App\Models\QuizRuntime\QuizSnapshot;

/**
 * Persistence only for quiz_snapshots (F-009D Sprint 1 Step 4).
 */
class SnapshotRepository
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): QuizSnapshot
    {
        return QuizSnapshot::query()->create($attributes);
    }

    public function find(int $id): ?QuizSnapshot
    {
        return QuizSnapshot::query()->find($id);
    }

    public function findByVersion(int $quizVersionId): ?QuizSnapshot
    {
        return QuizSnapshot::query()
            ->where('quiz_version_id', $quizVersionId)
            ->first();
    }
}
