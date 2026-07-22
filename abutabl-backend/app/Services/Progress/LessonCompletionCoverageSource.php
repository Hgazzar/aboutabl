<?php

namespace App\Services\Progress;

use App\Contracts\ProgressCoverageSourceInterface;
use App\Models\Lessons;
use App\Models\StudentLessonCompletion;
use Illuminate\Support\Facades\Schema;

/**
 * F-025 — Trusted Progress source: completed active lessons / active subject lessons.
 *
 * Progress contribution = completed curriculum lessons ÷ active lessons × 100
 * (aggregated by ProgressWriterService across implemented sources).
 */
final class LessonCompletionCoverageSource implements ProgressCoverageSourceInterface
{
    public function key(): string
    {
        return 'lesson_completion';
    }

    public function isImplemented(): bool
    {
        try {
            return Schema::hasTable('student_lesson_completions')
                && Schema::hasTable('lessons');
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function measure(int $studentId, int $subjectId): array
    {
        if (! $this->isImplemented()) {
            return ['total' => 0, 'completed' => 0];
        }

        $activeLessonIds = Lessons::query()
            ->where('subject_id', $subjectId)
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $total = count($activeLessonIds);
        if ($total === 0) {
            return ['total' => 0, 'completed' => 0];
        }

        $completed = (int) StudentLessonCompletion::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->whereIn('lesson_id', $activeLessonIds)
            ->count();

        if ($completed > $total) {
            $completed = $total;
        }

        return [
            'total' => $total,
            'completed' => $completed,
        ];
    }
}
