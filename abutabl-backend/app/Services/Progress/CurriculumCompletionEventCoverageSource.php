<?php

namespace App\Services\Progress;

use App\Contracts\ProgressCoverageSourceInterface;

/**
 * F-020 / F-023: no finalized curriculum-completion event stream exists yet — skip.
 * Quiz finalize → assigns_students.opened_at is Completion (LP), not Progress.
 */
final class CurriculumCompletionEventCoverageSource implements ProgressCoverageSourceInterface
{
    public function key(): string
    {
        return 'curriculum_completion_events';
    }

    public function isImplemented(): bool
    {
        return false;
    }

    public function measure(int $studentId, int $subjectId): array
    {
        return ['total' => 0, 'completed' => 0];
    }
}
