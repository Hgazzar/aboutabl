<?php

namespace App\Services\Assignment;

use App\Models\AssignActivity;
use App\Models\AssignActivitySubmission;
use App\Models\AssignmentGrade;
use App\Models\AssignmentRubric;
use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Support\Assignment\LearningActivityMap;
use App\Support\Assignment\MultiActivityMetrics;
use Illuminate\Support\Collection;
use InvalidArgumentException;

/**
 * Student submission + teacher manual grade for assign_activities.
 */
class AssignActivitySubmissionService
{
    /**
     * Ensure a submission row exists for student + activity.
     */
    public function ensurePending(
        AssignActivity $activity,
        AssignsStudents $assignStudent,
        int $studentId
    ): AssignActivitySubmission {
        $existing = AssignActivitySubmission::query()
            ->where('assign_activity_id', $activity->id)
            ->where('student_id', $studentId)
            ->first();

        if ($existing) {
            return $existing;
        }

        return AssignActivitySubmission::create([
            'assign_id' => (int) $activity->assign_id,
            'assign_activity_id' => (int) $activity->id,
            'assign_student_id' => (int) $assignStudent->id,
            'student_id' => $studentId,
            'status' => AssignActivitySubmission::STATUS_PENDING,
        ]);
    }

    /**
     * Student submits work for one activity.
     *
     * @param  array<string, mixed>  $payload
     */
    public function submit(
        int $assignActivityId,
        int $studentId,
        array $payload = []
    ): AssignActivitySubmission {
        $activity = AssignActivity::with('assign')->find($assignActivityId);
        if (! $activity || ! $activity->assign) {
            throw new InvalidArgumentException('activity_not_found');
        }

        $assignStudent = AssignsStudents::query()
            ->where('assign_id', $activity->assign_id)
            ->where('student_id', $studentId)
            ->first();

        if (! $assignStudent) {
            throw new InvalidArgumentException('assign_student_not_found');
        }

        $submission = $this->ensurePending($activity, $assignStudent, $studentId);

        // Parent Assignment already submitted/graded — no activity overwrite.
        $parentStatus = strtolower((string) ($assignStudent->submission_status ?? 'active'));
        if (
            in_array($parentStatus, ['submitted', 'graded'], true)
            || $assignStudent->submitted_at !== null
        ) {
            throw new InvalidArgumentException('assignment_locked');
        }

        // Phase 1: no REDO — block silent overwrite of terminal submissions.
        if ($this->isTerminalSubmissionStatus((string) $submission->status)) {
            throw new InvalidArgumentException('submission_locked');
        }

        $type = (string) $activity->activity_type;

        if ($type === LearningActivityMap::TYPE_EBOOK) {
            $submission->completeness = 100;
            $submission->percent = 100;
            $submission->status = AssignActivitySubmission::STATUS_COMPLETED;
            $submission->submitted_at = now();
            $submission->graded_at = now();
            $submission->payload = array_merge($submission->payload ?? [], $payload, [
                'grading_mode' => $activity->grading_mode,
            ]);
        } elseif ($type === LearningActivityMap::TYPE_GAME) {
            // SCORM games (games table) have no authoritative server-side score/CMI SSOT.
            // See App\Services\Progress\ScormCompletionCoverageSource — completion is not
            // persisted from play. Never trust client score/percent as graded accuracy.
            $clientClaimed = [];
            foreach (['score', 'max_score', 'percent'] as $claimKey) {
                if (array_key_exists($claimKey, $payload)) {
                    $clientClaimed[$claimKey] = $payload[$claimKey];
                }
            }

            $submission->score = null;
            $submission->max_score = null;
            $submission->percent = null;
            $submission->status = AssignActivitySubmission::STATUS_COMPLETED;
            $submission->submitted_at = now();
            $submission->graded_at = now();
            $submission->payload = array_merge($submission->payload ?? [], [
                'grading_mode' => $activity->grading_mode,
                'score_source' => 'none',
                'score_trusted' => false,
                'note' => 'No authoritative SCORM/game score SSOT; client score/percent ignored.',
            ], $clientClaimed === [] ? [] : [
                'client_claimed' => $clientClaimed,
            ]);
        } elseif ($type === LearningActivityMap::TYPE_WORKSHEET) {
            $submission->status = AssignActivitySubmission::STATUS_SUBMITTED;
            $submission->submitted_at = now();
            $submission->payload = array_merge($submission->payload ?? [], $payload, [
                'grading_mode' => $activity->grading_mode,
            ]);
        } elseif ($type === LearningActivityMap::TYPE_QUIZ) {
            // Quiz grading remains in quiz_runtime; this row tracks linkage.
            $submission->status = AssignActivitySubmission::STATUS_IN_PROGRESS;
            $submission->payload = array_merge($submission->payload ?? [], $payload, [
                'grading_mode' => $activity->grading_mode,
                'quiz_id' => (int) $activity->activity_id,
            ]);
        } else {
            throw new InvalidArgumentException('invalid_activity_type');
        }

        $submission->save();

        $this->maybeMarkAssignOpened($assignStudent);

        return $submission->fresh();
    }

    /**
     * Sync quiz attempt result onto activity submission (automatic_accuracy).
     */
    public function syncFromQuizResult(
        int $assignActivityId,
        int $studentId,
        float $percent,
        ?float $score = null,
        ?float $maxScore = null,
        ?int $attemptId = null
    ): AssignActivitySubmission {
        $activity = AssignActivity::find($assignActivityId);
        if (! $activity) {
            throw new InvalidArgumentException('activity_not_found');
        }

        $assignStudent = AssignsStudents::query()
            ->where('assign_id', $activity->assign_id)
            ->where('student_id', $studentId)
            ->first();

        if (! $assignStudent) {
            throw new InvalidArgumentException('assign_student_not_found');
        }

        $submission = $this->ensurePending($activity, $assignStudent, $studentId);
        $submission->percent = $percent;
        $submission->score = $score;
        $submission->max_score = $maxScore;
        $submission->status = AssignActivitySubmission::STATUS_COMPLETED;
        $submission->submitted_at = $submission->submitted_at ?? now();
        $submission->graded_at = now();
        $submission->payload = array_merge($submission->payload ?? [], [
            'quiz_attempt_id' => $attemptId,
            'grading_mode' => LearningActivityMap::GRADING_AUTOMATIC_ACCURACY,
        ]);
        $submission->save();

        $this->maybeMarkAssignOpened($assignStudent);

        return $submission->fresh();
    }

    /**
     * Teacher manual grade (worksheets).
     *
     * @param  array{score?: float|int, max_score?: float|int, percent?: float|int, feedback?: string|null}  $grade
     */
    public function manualGrade(
        int $assignActivityId,
        int $studentId,
        int $teacherId,
        array $grade
    ): AssignActivitySubmission {
        $activity = AssignActivity::find($assignActivityId);
        if (! $activity) {
            throw new InvalidArgumentException('activity_not_found');
        }

        if ($activity->grading_mode !== LearningActivityMap::GRADING_MANUAL) {
            throw new InvalidArgumentException('not_manual_activity');
        }

        $submission = AssignActivitySubmission::query()
            ->where('assign_activity_id', $assignActivityId)
            ->where('student_id', $studentId)
            ->first();

        if (! $submission) {
            throw new InvalidArgumentException('submission_not_found');
        }

        $maxScore = isset($grade['max_score']) ? (float) $grade['max_score'] : 100.0;
        $score = isset($grade['score']) ? (float) $grade['score'] : null;
        $percent = isset($grade['percent'])
            ? (float) $grade['percent']
            : ($score !== null && $maxScore > 0 ? round(($score / $maxScore) * 100, 2) : null);

        $submission->score = $score;
        $submission->max_score = $maxScore;
        $submission->percent = $percent;
        $submission->teacher_feedback = isset($grade['feedback']) ? (string) $grade['feedback'] : $submission->teacher_feedback;
        $submission->status = AssignActivitySubmission::STATUS_GRADED;
        $submission->graded_at = now();
        $submission->graded_by = $teacherId;
        $submission->save();

        return $submission->fresh();
    }

    /**
     * Full student assignment-detail payload.
     *
     * Parent lifecycle (assigns_students.submission_status) has priority.
     * opened_at is never treated as graded/submitted.
     *
     * @return array<string, mixed>
     */
    public function studentDetailPayload(Assigns $assign, int $studentId): array
    {
        $assignStudent = AssignsStudents::query()
            ->where('assign_id', $assign->id)
            ->where('student_id', $studentId)
            ->first();

        $activities = $assign->relationLoaded('activities')
            ? $assign->activities
            : $assign->activities()->orderBy('sort_order')->orderBy('id')->get();

        $submissions = AssignActivitySubmission::query()
            ->where('assign_id', $assign->id)
            ->where('student_id', $studentId)
            ->get();

        $activityRows = $this->activitiesPayloadForAssign($assign, $studentId);
        $progress = MultiActivityMetrics::forStudent($activities, $submissions);

        /** @var AssignmentParentSubmissionService $parent */
        $parent = app(AssignmentParentSubmissionService::class);
        $life = $parent->lifecycleFromAssignStudent($assignStudent);
        $lifecycleMode = $life['mode'];
        $lifecycleStatus = $life['status'];

        $feedbackItems = [];
        foreach ($activityRows as $row) {
            $feedback = $row['submission']['teacher_feedback'] ?? null;
            if (! is_string($feedback) || trim($feedback) === '') {
                continue;
            }
            $feedbackItems[] = [
                'assign_activity_id' => (int) $row['assign_activity_id'],
                'activity_type' => (string) $row['activity_type'],
                'activity_title' => (string) $row['title'],
                'teacher_feedback' => $feedback,
                'graded_at' => $row['submission']['graded_at'] ?? null,
            ];
        }

        $dueAt = $assign->due_at ? $assign->due_at->toIso8601String() : null;
        $parentSubmittedAt = $assignStudent && $assignStudent->submitted_at
            ? $assignStudent->submitted_at->toIso8601String()
            : null;

        $isLate = false;
        if ($assign->due_at && $parentSubmittedAt) {
            $isLate = strtotime($parentSubmittedAt) > $assign->due_at->getTimestamp();
        }

        $isOverdue = false;
        if (
            $lifecycleMode === 'homework_hero'
            && $assign->due_at
            && $assign->due_at->getTimestamp() < time()
        ) {
            $isOverdue = true;
        }

        $canSubmit = $lifecycleStatus === AssignmentParentSubmissionService::STATUS_ACTIVE
            && $parent->canSubmitAssignment($assign, $studentId);

        $rubricAvailable = AssignmentRubric::query()->where('assign_id', $assign->id)->exists();

        $gradePayload = null;
        $assignmentXp = null;
        if ($assignStudent) {
            try {
                /** @var AssignmentGradeService $grades */
                $grades = app(AssignmentGradeService::class);
                $gradePayload = $grades->showForStudent((int) $assign->id, $studentId);
            } catch (\Throwable $e) {
                $gradePayload = null;
            }

            if (
                is_array($gradePayload)
                && ($gradePayload['status'] ?? null) === AssignmentGrade::STATUS_FINALIZED
            ) {
                $assignmentXp = $gradePayload['earned_xp'] ?? null;
            }
        }

        // Students only see finalized assignment grades (not drafts).
        if (
            is_array($gradePayload)
            && ($gradePayload['status'] ?? null) !== AssignmentGrade::STATUS_FINALIZED
        ) {
            $gradePayload = null;
        }

        return [
            'assign_id' => (int) $assign->id,
            'assign_student_id' => $assignStudent ? (int) $assignStudent->id : null,
            'title' => (string) $assign->assigned_name,
            'due_at' => $dueAt,
            'type' => (string) $assign->type,
            'subject_id' => (int) ($assign->subject_id ?? 0),
            'progress' => [
                'tasks_completed' => (int) ($progress['tasks_completed'] ?? 0),
                'tasks_total' => (int) ($progress['tasks_total'] ?? 0),
                'completion_percent' => $progress['completion_percent'],
                'fully_complete' => (bool) ($progress['fully_complete'] ?? false),
                'last_submitted_at' => $progress['last_submitted_at'] ?? null,
                'score_percent' => $progress['score_percent'],
            ],
            'lifecycle' => [
                'mode' => $lifecycleMode,
                'status' => $lifecycleStatus,
                'submitted_at' => $parentSubmittedAt,
                'is_late' => $isLate,
                'is_overdue' => $isOverdue,
                'source' => 'assigns_students',
                'can_submit' => $canSubmit,
            ],
            'teacher_feedback_items' => $feedbackItems,
            'grade' => $gradePayload,
            'activities' => $activityRows,
            'materials' => [],
            'my_work' => [],
            'rubric_available' => $rubricAvailable,
            'assignment_xp' => $assignmentXp,
            'redo_allowed' => false,
        ];
    }

    /**
     * Legacy activity-only soft mode (unit tests / diagnostics).
     * Parent lifecycle uses AssignmentParentSubmissionService.
     */
    public function deriveLifecycleMode(Collection $submissions): string
    {
        $hasGraded = false;
        $hasSubmittedAwaiting = false;

        foreach ($submissions as $submission) {
            $status = (string) ($submission->status ?? '');
            if ($status === AssignActivitySubmission::STATUS_GRADED) {
                $hasGraded = true;
            }
            if ($status === AssignActivitySubmission::STATUS_SUBMITTED) {
                $hasSubmittedAwaiting = true;
            }
        }

        if ($hasGraded) {
            return 'assignment_graded';
        }

        if ($hasSubmittedAwaiting) {
            return 'waiting_on_teacher';
        }

        return 'homework_hero';
    }

    public function isTerminalSubmissionStatus(string $status): bool
    {
        return in_array(
            $status,
            [
                AssignActivitySubmission::STATUS_GRADED,
                AssignActivitySubmission::STATUS_COMPLETED,
            ],
            true
        );
    }

    /**
     * Serialize activities for student todo / teacher review.
     *
     * @return array<int, array<string, mixed>>
     */
    public function activitiesPayloadForAssign(Assigns $assign, ?int $studentId = null): array
    {
        $activities = $assign->relationLoaded('activities')
            ? $assign->activities
            : $assign->activities()->orderBy('sort_order')->orderBy('id')->get();

        $submissionsByActivity = collect();
        if ($studentId !== null && $studentId > 0) {
            $submissionsByActivity = AssignActivitySubmission::query()
                ->where('assign_id', $assign->id)
                ->where('student_id', $studentId)
                ->get()
                ->keyBy('assign_activity_id');
        }

        return $activities->map(function (AssignActivity $activity) use ($assign, $studentId, $submissionsByActivity) {
            $submission = $submissionsByActivity->get($activity->id);

            return [
                'assign_activity_id' => (int) $activity->id,
                'assign_id' => (int) $activity->assign_id,
                'activity_type' => (string) $activity->activity_type,
                'activity_id' => (int) $activity->activity_id,
                'source_table' => (string) $activity->source_table,
                'grading_mode' => (string) $activity->grading_mode,
                'title' => (string) ($activity->title_snapshot ?: ucfirst($activity->activity_type)),
                'sort_order' => (int) $activity->sort_order,
                'subject_id' => (int) ($assign->subject_id ?? 0),
                'path' => $this->studentPath($activity, (int) ($assign->subject_id ?? 0), $studentId),
                'submission' => $submission ? [
                    'id' => (int) $submission->id,
                    'status' => (string) $submission->status,
                    'score' => $submission->score,
                    'max_score' => $submission->max_score,
                    'percent' => $submission->percent,
                    'completeness' => $submission->completeness,
                    'submitted_at' => optional($submission->submitted_at)->toIso8601String(),
                    'graded_at' => optional($submission->graded_at)->toIso8601String(),
                    'teacher_feedback' => $submission->teacher_feedback,
                ] : null,
            ];
        })->values()->all();
    }

    private function studentPath(AssignActivity $activity, int $subjectId, ?int $studentId): ?string
    {
        if ($subjectId <= 0) {
            return null;
        }

        $id = (int) $activity->activity_id;
        $type = (string) $activity->activity_type;

        if ($type === LearningActivityMap::TYPE_EBOOK) {
            return '/learn/'.$subjectId.'/details/'.$id;
        }

        if ($type === LearningActivityMap::TYPE_GAME) {
            return '/learn/'.$subjectId.'/detailsGame/'.$id;
        }

        if ($type === LearningActivityMap::TYPE_QUIZ) {
            $qs = ['assign_activity_id='.(int) $activity->id];
            if ($studentId) {
                $assignStudentId = AssignsStudents::query()
                    ->where('assign_id', $activity->assign_id)
                    ->where('student_id', $studentId)
                    ->value('id');
                if ($assignStudentId) {
                    $qs[] = 'assign_student_id='.(int) $assignStudentId;
                }
            }

            return '/learn/'.$subjectId.'/quiz/'.$id.'?'.implode('&', $qs);
        }

        if ($type === LearningActivityMap::TYPE_WORKSHEET) {
            return '/todo/activities/'.(int) $activity->id;
        }

        return '/todo';
    }

    private function maybeMarkAssignOpened(AssignsStudents $assignStudent): void
    {
        if (! $assignStudent->opened_at) {
            $assignStudent->opened_at = now();
            $assignStudent->save();
        }
    }
}
