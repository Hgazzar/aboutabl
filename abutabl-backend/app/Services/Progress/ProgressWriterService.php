<?php

namespace App\Services\Progress;

use App\Contracts\ProgressCoverageSourceInterface;
use App\Models\StudentSubjectProgress;
use App\Repositories\StudentSubjectProgressRepository;
use InvalidArgumentException;

/**
 * Sole production writer for canonical Progress (F-022 / F-025).
 *
 * Progress = confirmed curriculum coverage (F-020).
 * Persistence only via StudentSubjectProgressRepository (F-021).
 * Never calls PerformanceSnapshotTrigger — observer fires on Eloquent save.
 *
 * F-025: LessonCompletionCoverageSource is the first production Progress source
 * (LessonCompleted → UpdateProgressAfterLessonCompleted → updateProgress).
 */
class ProgressWriterService
{
    /** @var StudentSubjectProgressRepository */
    private $repository;

    /** @var ProgressCoverageSourceInterface[] */
    private $sources;

    /**
     * @param  ProgressCoverageSourceInterface[]  $sources
     */
    public function __construct(
        StudentSubjectProgressRepository $repository,
        array $sources = []
    ) {
        $this->repository = $repository;
        $this->sources = $sources;
    }

    /**
     * Calculate and persist Progress for one student/subject pair.
     * Idempotent: unchanged value does not save (no observer / snapshot).
     */
    public function write(int $studentId, int $subjectId): StudentSubjectProgress
    {
        $this->assertPositiveIds($studentId, $subjectId);

        $value = $this->calculate($studentId, $subjectId);
        $existing = $this->repository->findProgress($studentId, $subjectId);

        if ($existing !== null && round((float) $existing->value, 2) === $value) {
            return $existing;
        }

        return $this->repository->saveProgress($studentId, $subjectId, $value);
    }

    /**
     * Alias for write() — F-023 call-site contract.
     */
    public function updateProgress(int $studentId, int $subjectId): StudentSubjectProgress
    {
        return $this->write($studentId, $subjectId);
    }

    /**
     * Deterministic Progress percent from implemented trusted sources only.
     * Unimplemented sources are skipped (F-020 / F-022).
     */
    public function calculate(int $studentId, int $subjectId): float
    {
        $this->assertPositiveIds($studentId, $subjectId);

        $total = 0;
        $completed = 0;

        foreach ($this->sources as $source) {
            if (! $source->isImplemented()) {
                continue;
            }

            $measure = $source->measure($studentId, $subjectId);
            $chunkTotal = max(0, (int) ($measure['total'] ?? 0));
            $chunkCompleted = max(0, (int) ($measure['completed'] ?? 0));

            if ($chunkCompleted > $chunkTotal) {
                $chunkCompleted = $chunkTotal;
            }

            $total += $chunkTotal;
            $completed += $chunkCompleted;
        }

        if ($total === 0) {
            return 0.0;
        }

        return round(100.0 * ($completed / $total), 2);
    }

    /**
     * @return ProgressCoverageSourceInterface[]
     */
    public function sources(): array
    {
        return $this->sources;
    }

    private function assertPositiveIds(int $studentId, int $subjectId): void
    {
        if ($studentId <= 0 || $subjectId <= 0) {
            throw new InvalidArgumentException(
                'student_id and subject_id must be positive integers.'
            );
        }
    }
}
