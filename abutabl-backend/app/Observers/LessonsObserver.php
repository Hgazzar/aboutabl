<?php

namespace App\Observers;

use App\Models\Lessons;
use App\Services\StandardContentLinker;

class LessonsObserver
{
    public function __construct(private StandardContentLinker $linker)
    {
    }

    public function saved(Lessons $lesson): void
    {
        $this->linker->syncLesson(
            (int) $lesson->id,
            (int) ($lesson->subject_id ?? 0),
            (string) ($lesson->name_en ?? ''),
            (string) ($lesson->name_ar ?? '')
        );
    }
}
