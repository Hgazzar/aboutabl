<?php

namespace App\Observers;

use App\Models\Lessons;
use App\Models\StudentLessonCompletion;
use App\Models\StudentSubjectProgress;
use App\Services\Progress\ProgressWriterService;
use App\Services\StandardContentLinker;
use Illuminate\Support\Facades\Schema;

/**
 * Standards link sync + Progress denominator refresh when lesson set changes.
 *
 * Progress recalculation uses ProgressWriterService only (same lesson_completion source).
 */
class LessonsObserver
{
    /** @var StandardContentLinker */
    private $linker;

    /** @var ProgressWriterService */
    private $progressWriter;

    public function __construct(
        StandardContentLinker $linker,
        ProgressWriterService $progressWriter
    ) {
        $this->linker = $linker;
        $this->progressWriter = $progressWriter;
    }

    public function saved(Lessons $lesson): void
    {
        $this->linker->syncLesson(
            (int) $lesson->id,
            (int) ($lesson->subject_id ?? 0),
            (string) ($lesson->name_en ?? ''),
            (string) ($lesson->name_ar ?? '')
        );

        $subjectChanged = $lesson->wasChanged('subject_id');
        $statusChanged = $lesson->wasChanged('status');
        $created = $lesson->wasRecentlyCreated;

        if (! $created && ! $subjectChanged && ! $statusChanged) {
            return;
        }

        $newSubjectId = (int) ($lesson->subject_id ?? 0);
        if ($newSubjectId > 0) {
            $this->refreshSubjectProgress($newSubjectId);
        }

        if ($subjectChanged) {
            $oldSubjectId = (int) ($lesson->getOriginal('subject_id') ?? 0);
            if ($oldSubjectId > 0 && $oldSubjectId !== $newSubjectId) {
                $this->refreshSubjectProgress($oldSubjectId);
            }
        }
    }

    public function deleted(Lessons $lesson): void
    {
        $subjectId = (int) ($lesson->subject_id ?? 0);
        if ($subjectId > 0) {
            $this->refreshSubjectProgress($subjectId);
        }
    }

    private function refreshSubjectProgress(int $subjectId): void
    {
        if ($subjectId <= 0) {
            return;
        }

        try {
            if (! Schema::hasTable('student_subject_progress')) {
                return;
            }
        } catch (\Throwable $e) {
            return;
        }

        $studentIds = StudentSubjectProgress::query()
            ->where('subject_id', $subjectId)
            ->pluck('student_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        try {
            if (Schema::hasTable('student_lesson_completions')) {
                $fromCompletions = StudentLessonCompletion::query()
                    ->where('subject_id', $subjectId)
                    ->pluck('student_id')
                    ->map(fn ($id) => (int) $id)
                    ->all();
                $studentIds = array_values(array_unique(array_merge($studentIds, $fromCompletions)));
            }
        } catch (\Throwable $e) {
            // Completions table optional for refresh set.
        }

        foreach ($studentIds as $studentId) {
            if ($studentId > 0) {
                $this->progressWriter->updateProgress($studentId, $subjectId);
            }
        }
    }
}
