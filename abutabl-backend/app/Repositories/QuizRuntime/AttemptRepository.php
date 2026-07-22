<?php

namespace App\Repositories\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

/**
 * Persistence only for quiz_attempts (F-009D Sprint 1 Step 4).
 */
class AttemptRepository
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): QuizAttempt
    {
        return QuizAttempt::query()->create($attributes);
    }

    public function save(QuizAttempt $attempt): QuizAttempt
    {
        $attempt->save();

        return $attempt;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(QuizAttempt $attempt, array $attributes): QuizAttempt
    {
        $attempt->fill($attributes);
        $attempt->save();

        return $attempt;
    }

    public function lockForUpdate(int $id): ?QuizAttempt
    {
        return QuizAttempt::query()
            ->whereKey($id)
            ->lockForUpdate()
            ->first();
    }

    /**
     * F-012 — Serialize concurrent Start for one student+quiz slot.
     * Locks matching attempt rows (and InnoDB gap) inside the caller transaction.
     *
     * @return Collection|QuizAttempt[]
     */
    public function lockForUpdateByStudentQuiz(int $studentId, int $quizId): Collection
    {
        return QuizAttempt::query()
            ->where('student_id', $studentId)
            ->where('quiz_id', $quizId)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    public function findById(int $id): ?QuizAttempt
    {
        return QuizAttempt::query()->find($id);
    }

    public function findActiveAttempt(
        int $studentId,
        int $quizId,
        ?int $assignStudentId = null
    ): ?QuizAttempt {
        $query = QuizAttempt::query()
            ->where('student_id', $studentId)
            ->where('quiz_id', $quizId)
            ->whereIn('status', [
                QuizAttempt::STATUS_IN_PROGRESS,
                QuizAttempt::STATUS_EXPIRED,
            ]);

        if ($assignStudentId === null) {
            $query->whereNull('assign_student_id');
        } else {
            $query->where('assign_student_id', $assignStudentId);
        }

        return $query->orderByDesc('id')->first();
    }

    public function findLatestAttempt(int $studentId, int $quizId): ?QuizAttempt
    {
        return QuizAttempt::query()
            ->where('student_id', $studentId)
            ->where('quiz_id', $quizId)
            ->orderByDesc('attempt_no')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * F-015 — in_progress attempts past ends_at (for expire sweep).
     *
     * @return int[]
     */
    public function findDueInProgressIds(int $limit = 100, $now = null): array
    {
        $now = $now ?? \Illuminate\Support\Carbon::now();

        return QuizAttempt::query()
            ->where('status', QuizAttempt::STATUS_IN_PROGRESS)
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', $now)
            ->orderBy('ends_at')
            ->orderBy('id')
            ->limit(max(1, $limit))
            ->pluck('id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->all();
    }

    public function findLatestFinalizedAttempt(int $studentId, int $quizId): ?QuizAttempt
    {
        return QuizAttempt::query()
            ->where('student_id', $studentId)
            ->where('quiz_id', $quizId)
            ->where('status', QuizAttempt::STATUS_FINALIZED)
            ->orderByDesc('attempt_no')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * @return Collection|QuizAttempt[]
     */
    public function findByStudent(int $studentId, ?int $quizId = null): Collection
    {
        $query = QuizAttempt::query()
            ->where('student_id', $studentId)
            ->orderByDesc('id');

        if ($quizId !== null) {
            $query->where('quiz_id', $quizId);
        }

        return $query->get();
    }

    /**
     * @return Collection|QuizAttempt[]
     */
    public function findByAssignStudent(int $assignStudentId): Collection
    {
        return QuizAttempt::query()
            ->where('assign_student_id', $assignStudentId)
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Teacher-visible attempt page (filters only — caller owns visibility lists).
     *
     * @param  int[]  $schoolIds
     * @param  int[]  $studentIds
     * @param  int[]  $assignIds
     * @param  array{quiz_id: ?int, student_id: ?int, assign_id: ?int, status: ?string}  $filters
     */
    public function paginateForTeacherVisibility(
        array $schoolIds,
        array $studentIds,
        array $assignIds,
        array $filters,
        int $perPage = 20,
        bool $schoolOnly = false
    ): LengthAwarePaginator {
        $query = QuizAttempt::query()->whereIn('school_id', $schoolIds);

        if (! $schoolOnly) {
            if ($assignIds === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('assign_id', $assignIds);
            }
        }

        if (! empty($filters['quiz_id'])) {
            $query->where('quiz_id', (int) $filters['quiz_id']);
        }
        if (! empty($filters['student_id'])) {
            $query->where('student_id', (int) $filters['student_id']);
        }
        if (! empty($filters['assign_id'])) {
            $query->where('assign_id', (int) $filters['assign_id']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', (string) $filters['status']);
        }

        return $query->orderByDesc('id')->paginate($perPage);
    }
}
