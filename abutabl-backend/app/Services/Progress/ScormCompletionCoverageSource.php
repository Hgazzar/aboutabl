<?php

namespace App\Services\Progress;

use App\Contracts\ProgressCoverageSourceInterface;

/**
 * F-020 / F-023: games_students.status is set on game assignment (GamesController),
 * not confirmed play. No SCORM CMI completion is persisted to the backend.
 * Not a trusted SCORM completion signal — leave disconnected.
 */
final class ScormCompletionCoverageSource implements ProgressCoverageSourceInterface
{
    public function key(): string
    {
        return 'scorm_completion';
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
