<?php

namespace App\Repositories;

use App\Models\StudentSubjectProgress;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Sole persistence layer for student_subject_progress (F-021).
 *
 * Production writes must go through ProgressWriterService (F-022).
 * Persistence only — no Progress calculation, quiz/SCORM/lesson reads.
 */
class StudentSubjectProgressRepository
{
    public function findProgress(int $studentId, int $subjectId): ?StudentSubjectProgress
    {
        $this->assertPositiveIds($studentId, $subjectId);

        return StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->first();
    }

    /**
     * Idempotent upsert of Progress value for (student_id, subject_id).
     * Transactional + race-safe under UNIQUE(student_id, subject_id).
     */
    public function saveProgress(int $studentId, int $subjectId, float $value): StudentSubjectProgress
    {
        $this->assertPositiveIds($studentId, $subjectId);
        $value = $this->normalizeValue($value);

        return DB::transaction(function () use ($studentId, $subjectId, $value) {
            return $this->upsertLocked($studentId, $subjectId, $value);
        });
    }

    /**
     * Update existing Progress row, or create if missing (same as saveProgress).
     * Kept as an explicit API alias for callers that expect update semantics.
     */
    public function updateProgress(int $studentId, int $subjectId, float $value): StudentSubjectProgress
    {
        return $this->saveProgress($studentId, $subjectId, $value);
    }

    private function upsertLocked(int $studentId, int $subjectId, float $value): StudentSubjectProgress
    {
        $existing = StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->lockForUpdate()
            ->first();

        if ($existing) {
            return StudentSubjectProgress::withWriteAllowed(function () use ($existing, $value) {
                if ((float) $existing->value !== $value) {
                    $existing->value = $value;
                    $existing->save();
                }

                return $existing->fresh() ?? $existing;
            });
        }

        try {
            return StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId, $value) {
                return StudentSubjectProgress::query()->create([
                    'student_id' => $studentId,
                    'subject_id' => $subjectId,
                    'value' => $value,
                ]);
            });
        } catch (QueryException $e) {
            // Concurrent insert lost the race — reload under lock and update.
            if (! $this->isUniqueViolation($e)) {
                throw $e;
            }

            $winner = StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->lockForUpdate()
                ->first();

            if (! $winner) {
                throw $e;
            }

            return StudentSubjectProgress::withWriteAllowed(function () use ($winner, $value) {
                if ((float) $winner->value !== $value) {
                    $winner->value = $value;
                    $winner->save();
                }

                return $winner->fresh() ?? $winner;
            });
        }
    }

    private function assertPositiveIds(int $studentId, int $subjectId): void
    {
        if ($studentId <= 0 || $subjectId <= 0) {
            throw new InvalidArgumentException(
                'student_id and subject_id must be positive integers.'
            );
        }
    }

    private function normalizeValue(float $value): float
    {
        if (! is_finite($value)) {
            throw new InvalidArgumentException('progress value must be a finite number.');
        }

        if ($value < 0.0 || $value > 100.0) {
            throw new InvalidArgumentException('progress value must be between 0 and 100.');
        }

        return round($value, 2);
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        $sqlState = (string) ($e->errorInfo[0] ?? '');
        $driverCode = (int) ($e->errorInfo[1] ?? 0);
        $message = $e->getMessage();

        // MySQL duplicate key = 1062; SQLSTATE 23000
        if ($driverCode === 1062 || $sqlState === '23000') {
            return true;
        }

        return stripos($message, 'Duplicate') !== false
            || stripos($message, 'UNIQUE') !== false;
    }
}
