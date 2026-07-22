<?php

namespace App\Events;

use App\Models\StudentLessonCompletion;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Canonical curriculum event: a student finished all required lesson content.
 * Fired exactly once per student/lesson (F-024).
 * F-025: UpdateProgressAfterLessonCompleted listens and updates Progress.
 */
class LessonCompleted
{
    use Dispatchable, SerializesModels;

    /** @var StudentLessonCompletion */
    public $completion;

    public function __construct(StudentLessonCompletion $completion)
    {
        $this->completion = $completion;
    }
}
