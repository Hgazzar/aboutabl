<?php

namespace App\Services\Student;

use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\StudentLessonContentCompletion;
use App\Services\LessonCompletionService;
use Illuminate\Support\Facades\DB;

/**
 * Resolves the next lesson content for "Continue learning" from completion tables.
 */
class StudentContinueLearningService
{
    /** @var LessonCompletionService */
    private $lessonCompletion;

    public function __construct(LessonCompletionService $lessonCompletion)
    {
        $this->lessonCompletion = $lessonCompletion;
    }

    /**
     * @param  int[]  $subjectIds
     * @return array<string, mixed>
     */
    public function build(int $studentId, array $subjectIds): array
    {
        if ($subjectIds === []) {
            return ['available' => false];
        }

        $completedContentIds = StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->pluck('lesson_content_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $latest = StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->orderByDesc('completed_at')
            ->first(['lesson_content_id', 'lesson_id', 'completed_at']);

        if ($latest !== null) {
            $next = $this->nextContentAfter(
                (int) $latest->lesson_id,
                (int) $latest->lesson_content_id,
                $completedContentIds,
                $subjectIds
            );
            if ($next !== null) {
                return $this->payloadFromContent($next, $studentId);
            }
        }

        $first = $this->firstIncompleteContent($studentId, $subjectIds, $completedContentIds);
        if ($first !== null) {
            return $this->payloadFromContent($first, $studentId);
        }

        return ['available' => false];
    }

    /**
     * @return array<string, mixed>
     */
    public function buildForSubject(int $studentId, int $subjectId): array
    {
        if ($subjectId <= 0) {
            return ['available' => false];
        }

        $subjectIds = [$subjectId];
        $completedContentIds = StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->pluck('lesson_content_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $lessonIdsInSubject = Lessons::query()
            ->where('subject_id', $subjectId)
            ->where(function ($q) {
                $q->where('status', '1')->orWhere('status', 1);
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($lessonIdsInSubject === []) {
            return ['available' => false];
        }

        $latest = StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->whereIn('lesson_id', $lessonIdsInSubject)
            ->orderByDesc('completed_at')
            ->first(['lesson_content_id', 'lesson_id', 'completed_at']);

        if ($latest !== null) {
            $next = $this->nextContentAfter(
                (int) $latest->lesson_id,
                (int) $latest->lesson_content_id,
                $completedContentIds,
                $subjectIds
            );
            if ($next !== null) {
                return $this->payloadFromContent($next, $studentId);
            }
        }

        $first = $this->firstIncompleteContent($studentId, $subjectIds, $completedContentIds);
        if ($first !== null) {
            return $this->payloadFromContent($first, $studentId);
        }

        return ['available' => false];
    }

    /**
     * @param  int[]  $subjectIds
     * @return array<int, array<string, mixed>>
     */
    public function buildForSubjects(int $studentId, array $subjectIds, int $limit = 2): array
    {
        $limit = max(1, $limit);
        $items = [];

        foreach ($subjectIds as $subjectId) {
            if (count($items) >= $limit) {
                break;
            }

            $subjectId = (int) $subjectId;
            if ($subjectId <= 0) {
                continue;
            }

            $payload = $this->buildForSubject($studentId, $subjectId);
            if ($payload['available'] ?? false) {
                $items[] = $payload;
            }
        }

        return $items;
    }

    /**
     * @param  int[]  $completedContentIds
     * @param  int[]  $subjectIds
     */
    private function nextContentAfter(
        int $lessonId,
        int $afterContentId,
        array $completedContentIds,
        array $subjectIds
    ): ?LessonsContents {
        $candidates = LessonsContents::query()
            ->where('lesson_id', $lessonId)
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->where('id', '>', $afterContentId)
            ->orderBy('id')
            ->get();

        foreach ($candidates as $content) {
            if (! in_array((int) $content->id, $completedContentIds, true)) {
                $lesson = Lessons::query()->find($lessonId);
                if ($lesson && in_array((int) $lesson->subject_id, $subjectIds, true)) {
                    return $content;
                }
            }
        }

        $lesson = Lessons::query()->find($lessonId);
        if ($lesson === null) {
            return null;
        }

        $subjectId = (int) $lesson->subject_id;
        $nextLesson = Lessons::query()
            ->where('subject_id', $subjectId)
            ->where(function ($q) {
                $q->where('status', '1')->orWhere('status', 1);
            })
            ->where('id', '>', $lessonId)
            ->orderBy('id')
            ->first();

        if ($nextLesson === null) {
            return null;
        }

        return $this->firstIncompleteInLesson((int) $nextLesson->id, $completedContentIds);
    }

    /**
     * @param  int[]  $subjectIds
     * @param  int[]  $completedContentIds
     */
    private function firstIncompleteContent(
        int $studentId,
        array $subjectIds,
        array $completedContentIds
    ): ?LessonsContents {
        unset($studentId);

        $lessonIds = Lessons::query()
            ->whereIn('subject_id', $subjectIds)
            ->where(function ($q) {
                $q->where('status', '1')->orWhere('status', 1);
            })
            ->orderBy('subject_id')
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        foreach ($lessonIds as $lessonId) {
            $content = $this->firstIncompleteInLesson($lessonId, $completedContentIds);
            if ($content !== null) {
                return $content;
            }
        }

        return null;
    }

    /**
     * @param  int[]  $completedContentIds
     */
    private function firstIncompleteInLesson(int $lessonId, array $completedContentIds): ?LessonsContents
    {
        $required = $this->lessonCompletion->requiredContentIds($lessonId);
        if ($required === []) {
            return null;
        }

        foreach ($required as $contentId) {
            if (! in_array($contentId, $completedContentIds, true)) {
                return LessonsContents::query()->find($contentId);
            }
        }

        return null;
    }

    private function payloadFromContent(LessonsContents $content, int $studentId): array
    {
        $lesson = Lessons::query()->find((int) $content->lesson_id);
        $subjectId = $lesson ? (int) $lesson->subject_id : 0;
        $locale = app()->getLocale() === 'ar' ? 'ar' : 'en';
        $nameCol = 'name_'.$locale;
        $title = (string) ($content->{$nameCol} ?? $content->name_en ?? $content->name_ar ?? '');

        $lessonTitle = '';
        if ($lesson) {
            $lessonTitle = (string) ($lesson->{$nameCol} ?? $lesson->name_en ?? $lesson->name_ar ?? '');
        }

        $required = $this->lessonCompletion->requiredContentIds((int) $content->lesson_id);
        $finished = StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->where('lesson_id', (int) $content->lesson_id)
            ->whereIn('lesson_content_id', $required)
            ->count();
        $lessonProgress = count($required) > 0
            ? (int) round(min(100, ($finished / count($required)) * 100))
            : 0;

        $subjectName = null;
        if ($subjectId > 0) {
            $row = DB::table('subjects')->where('id', $subjectId)->first(['name', 'name_ar']);
            if ($row) {
                $subjectName = $locale === 'ar'
                    ? ($row->name_ar ?: $row->name)
                    : ($row->name ?: $row->name_ar);
            }
        }

        return [
            'available'        => true,
            'subject_id'       => $subjectId,
            'subject_name'     => $subjectName,
            'lesson_id'        => (int) $content->lesson_id,
            'lesson_title'     => $lessonTitle !== '' ? $lessonTitle : null,
            'content_id'       => (int) $content->id,
            'title'            => $title,
            'lesson_progress_percent' => $lessonProgress,
            'path'             => $subjectId > 0
                ? '/learn/'.$subjectId.'/details/'.$content->id
                : null,
        ];
    }
}
