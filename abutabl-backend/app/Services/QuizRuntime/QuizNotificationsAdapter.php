<?php

namespace App\Services\QuizRuntime;

use App\Models\AssignsStudents;
use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizResult;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Services\Notification\NotificationInboxService;
use Illuminate\Support\Carbon;
use RuntimeException;

/**
 * F-009D Sprint 1 Step 10 — Notifications Adapter (Outbox Relay consumer).
 *
 * Handles QuizFinalized only. Invoked solely from QuizOutboxRelayService.
 * Creates in-app Notification rows via NotificationInboxService::createIfMissing.
 * Honors frozen notify flags from Version settings_frozen.
 * Idempotent by (type, type_id=attempt_id, to_user_type, to_user_id).
 *
 * Does not mutate Runtime Attempt/Result, Definition, Authoring,
 * Learning Progress, Rankings, or Reports. No Laravel Events, Push, or Email.
 */
class QuizNotificationsAdapter
{
    public const TYPE_TEACHER_SUBMISSION = 'quiz_runtime_submission';

    public const TYPE_TEACHER_LATE = 'quiz_runtime_late';

    public const TYPE_STUDENT_RESULT = 'quiz_runtime_result';

    /** @var NotificationInboxService */
    private $inbox;

    public function __construct(NotificationInboxService $inbox)
    {
        $this->inbox = $inbox;
    }

    /**
     * Create in-app notifications for a finalized authoritative Result.
     *
     * @param  array<string, mixed>  $context  Optional outbox payload identifiers
     */
    public function apply(QuizAttempt $attempt, QuizResult $result, array $context = []): void
    {
        if (! (bool) $result->is_authoritative) {
            throw new RuntimeException('Notifications require an authoritative Result.');
        }

        if ((int) $result->attempt_id !== (int) $attempt->id) {
            throw new RuntimeException('Result does not belong to Attempt.');
        }

        if ($attempt->status !== QuizAttempt::STATUS_FINALIZED) {
            throw new RuntimeException('Notifications require a finalized Attempt.');
        }

        $settings = $this->frozenSettings($attempt);
        $title = $this->quizTitle($settings, (int) $attempt->quiz_id);
        $student = Student::query()
            ->whereKey((int) $attempt->student_id)
            ->first(['id', 'name', 'grade_id', 'class_id', 'school_id']);

        if ($student === null) {
            throw new RuntimeException('Student not found for QuizFinalized notifications.');
        }

        $studentLabel = explode(' ', (string) $student->name)[0] ?: 'Student';
        // NOTIF-001 Phase 5: teacher destination stays staff SPA quiz route.
        $teacherUrl = '/subjects/quiz/' . (int) $attempt->quiz_id;
        $isLate = $this->isLateSubmission($attempt, $settings);

        if ($this->flagEnabled($settings['notify_about_submission'] ?? null)) {
            $this->notifyTeachers(
                $attempt,
                $student,
                $settings,
                self::TYPE_TEACHER_SUBMISSION,
                $title,
                'Student ' . $studentLabel . ' submitted ' . $title,
                $teacherUrl
            );
        }

        if ($isLate && $this->flagEnabled($settings['notify_about_late_submission'] ?? null)) {
            $this->notifyTeachers(
                $attempt,
                $student,
                $settings,
                self::TYPE_TEACHER_LATE,
                $title,
                'Student ' . $studentLabel . ' submitted late: ' . $title,
                $teacherUrl
            );
        }

        if ($this->flagEnabled($settings['notify_student'] ?? null)) {
            $subjectId = isset($settings['subject_id']) ? (int) $settings['subject_id'] : 0;
            if ($subjectId < 1) {
                throw new RuntimeException(
                    'Student quiz_runtime_result requires subject_id in Version settings_frozen.'
                );
            }

            $passed = (bool) $result->passed;
            $percent = round((float) $result->percent, 2);
            $outcome = $passed ? 'passed' : 'did not pass';
            $this->createIfMissing([
                'title' => $title,
                'description' => 'Your quiz ' . $title . ' was graded. You ' . $outcome
                    . ' (' . $percent . '%).',
                'from_user_type' => 'teacher',
                'from_user_id' => $this->resolveAssignTeacherId($attempt) ?? 0,
                'to_user_type' => 'student',
                'to_user_id' => (int) $student->id,
                'url' => '/learn/' . $subjectId . '/quiz/' . (int) $attempt->quiz_id,
                'type' => self::TYPE_STUDENT_RESULT,
                'type_id' => (int) $attempt->id,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    private function notifyTeachers(
        QuizAttempt $attempt,
        Student $student,
        array $settings,
        string $type,
        string $title,
        string $description,
        string $url
    ): void {
        foreach ($this->resolveTeacherIds($attempt, $student, $settings) as $teacherId) {
            $this->createIfMissing([
                'title' => $title,
                'description' => $description,
                'from_user_type' => 'student',
                'from_user_id' => (int) $student->id,
                'to_user_type' => 'teacher',
                'to_user_id' => $teacherId,
                'url' => $url,
                'type' => $type,
                'type_id' => (int) $attempt->id,
            ]);
        }
    }

    /**
     * Idempotent create via shared inbox helper.
     *
     * @param  array<string, mixed>  $attrs
     */
    private function createIfMissing(array $attrs): void
    {
        $this->inbox->createIfMissing($attrs);
    }

    /**
     * @return array<string, mixed>
     */
    private function frozenSettings(QuizAttempt $attempt): array
    {
        $attempt->loadMissing('version:id,settings_frozen');

        $settings = $attempt->version !== null && is_array($attempt->version->settings_frozen)
            ? $attempt->version->settings_frozen
            : [];

        return $settings;
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    private function quizTitle(array $settings, int $quizId): string
    {
        $title = $settings['title_en'] ?? $settings['title_ar'] ?? null;
        if (is_string($title) && $title !== '') {
            return $title;
        }

        return 'Quiz #' . $quizId;
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    private function isLateSubmission(QuizAttempt $attempt, array $settings): bool
    {
        if ($attempt->submitted_at === null) {
            return false;
        }

        $submitted = Carbon::parse($attempt->submitted_at);

        $due = $settings['due_date'] ?? null;
        if (is_string($due) && $due !== '') {
            return $submitted->gt(Carbon::parse($due));
        }

        if ($attempt->ends_at !== null) {
            return $submitted->gt(Carbon::parse($attempt->ends_at));
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $settings
     * @return array<int, int>
     */
    private function resolveTeacherIds(QuizAttempt $attempt, Student $student, array $settings): array
    {
        $ids = [];

        $assignTeacherId = $this->resolveAssignTeacherId($attempt);
        if ($assignTeacherId !== null) {
            $ids[] = $assignTeacherId;
        }

        $subjectId = isset($settings['subject_id']) ? (int) $settings['subject_id'] : 0;
        $gradeId = $student->grade_id !== null ? (int) $student->grade_id : 0;
        $classId = $student->class_id !== null ? (int) $student->class_id : 0;

        if ($subjectId > 0 && $gradeId > 0 && $classId > 0) {
            $fromGrades = TeachersGrades::query()
                ->where('grade_id', $gradeId)
                ->where('class_id', $classId)
                ->where('subject_id', $subjectId)
                ->where('status', 1)
                ->pluck('user_id')
                ->all();

            foreach ($fromGrades as $uid) {
                $uid = (int) $uid;
                if ($uid > 0) {
                    $ids[] = $uid;
                }
            }
        }

        $ids = array_values(array_unique($ids));

        return $ids;
    }

    private function resolveAssignTeacherId(QuizAttempt $attempt): ?int
    {
        $row = null;

        if ($attempt->assign_student_id !== null) {
            $row = AssignsStudents::query()
                ->whereKey((int) $attempt->assign_student_id)
                ->first();
        } elseif ($attempt->assign_id !== null) {
            $row = AssignsStudents::query()
                ->where('assign_id', (int) $attempt->assign_id)
                ->where('student_id', (int) $attempt->student_id)
                ->first();
        }

        if ($row === null) {
            return null;
        }

        $row->loadMissing('assign:id,created_by');

        $teacherId = (int) ($row->created_by ?? 0);
        if ($teacherId < 1) {
            $teacherId = (int) ($row->assign->created_by ?? 0);
        }

        return $teacherId > 0 ? $teacherId : null;
    }

    /**
     * @param  mixed  $value
     */
    private function flagEnabled($value): bool
    {
        return $value === true || $value === 1 || $value === '1';
    }
}
