<?php

namespace App\Contracts;

/**
 * Trusted curriculum-coverage source for canonical Progress (F-020 / F-022).
 *
 * Implementations must only report confirmed coverage — never opened_at,
 * quiz percent, pass/fail, assignment viewed, or hardcoded percentages.
 */
interface ProgressCoverageSourceInterface
{
    public function key(): string;

    /**
     * False when the platform does not yet persist trustworthy completion
     * for this source (F-020: skip unimplemented sources).
     */
    public function isImplemented(): bool;

    /**
     * @return array{total: int, completed: int}
     */
    public function measure(int $studentId, int $subjectId): array;
}
