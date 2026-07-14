<?php

namespace App\Observers;

use App\Models\Quizes;
use App\Services\StandardContentLinker;

class QuizesObserver
{
    public function __construct(private StandardContentLinker $linker)
    {
    }

    public function saved(Quizes $quiz): void
    {
        $this->linker->syncQuiz(
            (int) $quiz->id,
            (int) ($quiz->subject_id ?? 0),
            (string) ($quiz->title_en ?? ''),
            (string) ($quiz->title_ar ?? '')
        );
    }
}
