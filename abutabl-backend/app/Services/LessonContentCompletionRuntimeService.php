<?php

namespace App\Services;

use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\Student;
use App\Models\StudentLessonContentCompletion;
use App\Services\Student\StudentCurriculumAccessService;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * F-030 — Validates F-029a evidence and records content completion.
 *
 * Does not call ProgressWriter; LessonCompleted → listener handles Progress.
 */
class LessonContentCompletionRuntimeService
{
    public const MEDIA_TYPES = ['video', 'audio'];

    public const DOCUMENT_TYPES = ['image', 'pdf', 'word', 'powerpoints', 'excel'];

    public const BLOCKED_TYPES = ['scorm', 'scrom'];

    private const MEDIA_THRESHOLD_RATIO = 0.95;

    private const MEDIA_SKEW_MS = 1500;

    /** @var LessonCompletionService */
    private $lessonCompletion;

    /** @var StudentCurriculumAccessService */
    private $curriculumAccess;

    public function __construct(
        LessonCompletionService $lessonCompletion,
        StudentCurriculumAccessService $curriculumAccess
    ) {
        $this->lessonCompletion = $lessonCompletion;
        $this->curriculumAccess = $curriculumAccess;
    }

    /**
     * @param  array{kind:string,client_event_id:string,occurred_at?:string|null,media?:array|null,viewer?:array|null}  $evidence
     * @return array<string,mixed>
     */
    public function complete(int $studentId, int $contentId, array $evidence): array
    {
        $student = Student::query()->find($studentId);
        if ($student === null) {
            throw new AccessDeniedHttpException('Student not authenticated.');
        }

        $content = LessonsContents::query()->find($contentId);
        if ($content === null || (int) $content->lesson_id <= 0) {
            throw new NotFoundHttpException('Lesson content not found.');
        }

        if (! $this->isActiveStatus($content->status)) {
            throw new InvalidArgumentException('Lesson content is not active.');
        }

        $lesson = Lessons::query()->find((int) $content->lesson_id);
        if ($lesson === null || (int) $lesson->subject_id <= 0) {
            throw new NotFoundHttpException('Lesson not found.');
        }

        if (! $this->isActiveStatus($lesson->status ?? 1)) {
            throw new InvalidArgumentException('Lesson is not active.');
        }

        if (! $this->curriculumAccess->studentCanAccessSubject($student, (int) $lesson->subject_id)) {
            throw new AccessDeniedHttpException('Student cannot access this subject.');
        }

        $type = strtolower(trim((string) ($content->type ?? '')));
        $this->assertTypeAllowed($type);
        $this->assertEvidenceMatchesType($type, $evidence);

        $lessonId = (int) $content->lesson_id;

        $already = StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->where('lesson_content_id', $contentId)
            ->first();

        if ($already !== null) {
            $lessonCompletion = $this->lessonCompletion->findCompletion($studentId, $lessonId);

            return [
                'content_id' => $contentId,
                'lesson_id' => $lessonId,
                'content_already_completed' => true,
                'content_completed' => true,
                'lesson_completed' => $lessonCompletion !== null,
                'lesson_completion_id' => $lessonCompletion ? (int) $lessonCompletion->id : null,
                'completed_at' => $lessonCompletion && $lessonCompletion->completed_at
                    ? (string) $lessonCompletion->completed_at
                    : null,
            ];
        }

        $lessonCompletion = $this->lessonCompletion->recordContentCompleted(
            $studentId,
            $contentId,
            LessonCompletionService::SOURCE_CONTENT_RUNTIME
        );

        return [
            'content_id' => $contentId,
            'lesson_id' => $lessonId,
            'content_already_completed' => false,
            'content_completed' => true,
            'lesson_completed' => $lessonCompletion !== null,
            'lesson_completion_id' => $lessonCompletion ? (int) $lessonCompletion->id : null,
            'completed_at' => $lessonCompletion && $lessonCompletion->completed_at
                ? (string) $lessonCompletion->completed_at
                : null,
        ];
    }

    /**
     * @param  array{kind:string,media?:array|null,viewer?:array|null}  $evidence
     */
    private function assertTypeAllowed(string $type): void
    {
        if (in_array($type, self::BLOCKED_TYPES, true)) {
            throw new InvalidArgumentException('SCORM content cannot be completed via this contract.');
        }

        $allowed = array_merge(self::MEDIA_TYPES, self::DOCUMENT_TYPES);
        if (! in_array($type, $allowed, true)) {
            throw new InvalidArgumentException('Unsupported lesson content type for completion.');
        }
    }

    /**
     * @param  array{kind:string,media?:array|null,viewer?:array|null}  $evidence
     */
    private function assertEvidenceMatchesType(string $type, array $evidence): void
    {
        $kind = (string) ($evidence['kind'] ?? '');

        if (in_array($type, self::MEDIA_TYPES, true)) {
            if (! in_array($kind, ['media_ended', 'media_threshold'], true)) {
                throw new InvalidArgumentException('Media content requires media_ended or media_threshold evidence.');
            }

            $media = is_array($evidence['media'] ?? null) ? $evidence['media'] : null;
            if ($media === null) {
                throw new InvalidArgumentException('Media evidence is required.');
            }

            $duration = (int) ($media['duration_ms'] ?? 0);
            $position = (int) ($media['position_ms'] ?? -1);

            if ($duration <= 0 || $position < 0) {
                throw new InvalidArgumentException('Media duration_ms and position_ms are required.');
            }

            if ($position > $duration + self::MEDIA_SKEW_MS) {
                throw new InvalidArgumentException('Media position exceeds duration.');
            }

            if ($kind === 'media_threshold') {
                $required = (int) floor($duration * self::MEDIA_THRESHOLD_RATIO);
                if ($position < $required) {
                    throw new InvalidArgumentException('Media threshold not reached.');
                }
            }

            if ($kind === 'media_ended' && ($position + self::MEDIA_SKEW_MS < $duration)) {
                throw new InvalidArgumentException('Media not ended.');
            }

            return;
        }

        if (in_array($type, self::DOCUMENT_TYPES, true)) {
            if ($kind !== 'explicit_confirm') {
                throw new InvalidArgumentException('Document content requires explicit_confirm evidence.');
            }

            $viewer = is_array($evidence['viewer'] ?? null) ? $evidence['viewer'] : null;
            if ($viewer === null || empty($viewer['loaded'])) {
                throw new InvalidArgumentException('Viewer must be loaded before confirmation.');
            }

            return;
        }

        throw new InvalidArgumentException('Unsupported lesson content type for completion.');
    }

    private function isActiveStatus($status): bool
    {
        return (string) $status === '1' || (int) $status === 1;
    }
}
