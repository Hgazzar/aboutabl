<?php

namespace App\Services;

use App\Events\LessonCompleted;
use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\StudentLessonCompletion;
use App\Models\StudentLessonContentCompletion;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * F-024 — Lesson Completion infrastructure only.
 *
 * Evaluates and persists lesson completion; dispatches LessonCompleted once.
 * Does not calculate Progress or call the Progress writer.
 */
class LessonCompletionService
{
    public const SOURCE_ALL_CONTENT_FINISHED = 'all_content_finished';

    public const SOURCE_CONTENT_RUNTIME = 'content_runtime';

    /**
     * Record that one lesson content item is finished, then evaluate the lesson.
     * Viewing/opening a lesson must not call this.
     */
    public function recordContentCompleted(
        int $studentId,
        int $contentId,
        string $completionSource = self::SOURCE_CONTENT_RUNTIME
    ): ?StudentLessonCompletion {
        $this->assertPositive($studentId, 'student_id');
        $this->assertPositive($contentId, 'lesson_content_id');

        $content = LessonsContents::query()->find($contentId);
        if ($content === null || (int) $content->lesson_id <= 0) {
            throw new InvalidArgumentException('Lesson content not found.');
        }

        if (! $this->isActiveStatus($content->status)) {
            throw new InvalidArgumentException('Lesson content is not active.');
        }

        $lessonId = (int) $content->lesson_id;

        DB::transaction(function () use ($studentId, $contentId, $lessonId, $completionSource) {
            $existing = StudentLessonContentCompletion::query()
                ->where('student_id', $studentId)
                ->where('lesson_content_id', $contentId)
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                return;
            }

            try {
                StudentLessonContentCompletion::query()->create([
                    'student_id' => $studentId,
                    'lesson_content_id' => $contentId,
                    'lesson_id' => $lessonId,
                    'completed_at' => now(),
                    'completion_source' => $completionSource,
                ]);
            } catch (QueryException $e) {
                if (! $this->isUniqueViolation($e)) {
                    throw $e;
                }
            }
        });

        return $this->completeIfEligible(
            $studentId,
            $lessonId,
            self::SOURCE_ALL_CONTENT_FINISHED
        );
    }

    /**
     * True only when every required (active) content item for the lesson is finished.
     * Lessons with zero active content items are not completable.
     */
    public function evaluate(int $studentId, int $lessonId): bool
    {
        $this->assertPositive($studentId, 'student_id');
        $this->assertPositive($lessonId, 'lesson_id');

        $requiredIds = $this->requiredContentIds($lessonId);
        if ($requiredIds === []) {
            return false;
        }

        $finishedCount = StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->where('lesson_id', $lessonId)
            ->whereIn('lesson_content_id', $requiredIds)
            ->count();

        return $finishedCount >= count($requiredIds);
    }

    /**
     * Persist lesson completion and fire LessonCompleted exactly once when eligible.
     * Idempotent: repeated calls return the existing row without re-dispatching.
     */
    public function completeIfEligible(
        int $studentId,
        int $lessonId,
        string $completionSource = self::SOURCE_ALL_CONTENT_FINISHED
    ): ?StudentLessonCompletion {
        $this->assertPositive($studentId, 'student_id');
        $this->assertPositive($lessonId, 'lesson_id');

        $existing = $this->findCompletion($studentId, $lessonId);
        if ($existing !== null) {
            return $existing;
        }

        if (! $this->evaluate($studentId, $lessonId)) {
            return null;
        }

        $lesson = Lessons::query()->find($lessonId);
        if ($lesson === null || (int) $lesson->subject_id <= 0) {
            throw new InvalidArgumentException('Lesson or subject_id missing.');
        }

        $created = null;
        $shouldDispatch = false;

        DB::transaction(function () use (
            $studentId,
            $lessonId,
            $lesson,
            $completionSource,
            &$created,
            &$shouldDispatch
        ) {
            $row = StudentLessonCompletion::query()
                ->where('student_id', $studentId)
                ->where('lesson_id', $lessonId)
                ->lockForUpdate()
                ->first();

            if ($row !== null) {
                $created = $row;

                return;
            }

            try {
                $created = StudentLessonCompletion::query()->create([
                    'student_id' => $studentId,
                    'lesson_id' => $lessonId,
                    'subject_id' => (int) $lesson->subject_id,
                    'completed_at' => now(),
                    'completion_source' => $completionSource,
                ]);
                $shouldDispatch = true;
            } catch (QueryException $e) {
                if (! $this->isUniqueViolation($e)) {
                    throw $e;
                }
                $created = StudentLessonCompletion::query()
                    ->where('student_id', $studentId)
                    ->where('lesson_id', $lessonId)
                    ->first();
            }
        });

        if ($shouldDispatch && $created !== null) {
            event(new LessonCompleted($created));
        }

        return $created;
    }

    public function findCompletion(int $studentId, int $lessonId): ?StudentLessonCompletion
    {
        return StudentLessonCompletion::query()
            ->where('student_id', $studentId)
            ->where('lesson_id', $lessonId)
            ->first();
    }

    /**
     * Required content = active lessons_contents for the lesson.
     *
     * @return int[]
     */
    public function requiredContentIds(int $lessonId): array
    {
        return LessonsContents::query()
            ->where('lesson_id', $lessonId)
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function isActiveStatus($status): bool
    {
        return (string) $status === '1' || (int) $status === 1;
    }

    private function assertPositive(int $value, string $field): void
    {
        if ($value <= 0) {
            throw new InvalidArgumentException($field.' must be a positive integer.');
        }
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        $sqlState = (string) ($e->errorInfo[0] ?? '');
        $driverCode = (int) ($e->errorInfo[1] ?? 0);

        if ($driverCode === 1062 || $sqlState === '23000') {
            return true;
        }

        $message = $e->getMessage();

        return stripos($message, 'Duplicate') !== false
            || stripos($message, 'UNIQUE') !== false;
    }
}
