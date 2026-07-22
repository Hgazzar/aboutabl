<?php

namespace App\Repositories\QuizRuntime;

use App\Models\QuizRuntime\QuizVersion;
use Illuminate\Database\Eloquent\Collection;

/**
 * Persistence only for quiz_versions (F-009D Sprint 1 Step 4).
 */
class VersionRepository
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): QuizVersion
    {
        return QuizVersion::query()->create($attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(QuizVersion $version, array $attributes): QuizVersion
    {
        $version->fill($attributes);
        $version->save();

        return $version;
    }

    public function delete(QuizVersion $version): bool
    {
        return (bool) $version->delete();
    }

    public function find(int $id): ?QuizVersion
    {
        return $this->findById($id);
    }

    public function findById(int $id): ?QuizVersion
    {
        return QuizVersion::query()->find($id);
    }

    public function latestPublished(int $quizId): ?QuizVersion
    {
        return QuizVersion::query()
            ->where('quiz_id', $quizId)
            ->where('status', QuizVersion::STATUS_PUBLISHED)
            ->orderByDesc('published_at')
            ->orderByDesc('version_number')
            ->first();
    }

    public function exists(int $id): bool
    {
        return QuizVersion::query()->whereKey($id)->exists();
    }

    /**
     * @return Collection|QuizVersion[]
     */
    public function findByQuiz(int $quizId): Collection
    {
        return QuizVersion::query()
            ->where('quiz_id', $quizId)
            ->orderByDesc('version_number')
            ->get();
    }
}
