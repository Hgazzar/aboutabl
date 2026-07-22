<?php

namespace App\Listeners;

use App\Events\LessonCompleted;
use App\Services\Progress\ProgressWriterService;

/**
 * F-025 — First production Progress source: LessonCompleted → ProgressWriter.
 */
class UpdateProgressAfterLessonCompleted
{
    /** @var ProgressWriterService */
    private $progressWriter;

    public function __construct(ProgressWriterService $progressWriter)
    {
        $this->progressWriter = $progressWriter;
    }

    public function handle(LessonCompleted $event): void
    {
        $completion = $event->completion;
        $studentId = (int) ($completion->student_id ?? 0);
        $subjectId = (int) ($completion->subject_id ?? 0);

        if ($studentId <= 0 || $subjectId <= 0) {
            return;
        }

        $this->progressWriter->updateProgress($studentId, $subjectId);
    }
}
