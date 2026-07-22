<?php

namespace App\Services\QuizRuntime;

use App\Models\AssignsStudents;
use App\Models\QuizRuntime\QuizAttempt;
use App\Repositories\QuizRuntime\AttemptRepository;
use App\Repositories\QuizRuntime\ResultRepository;
use App\Repositories\QuizRuntime\SnapshotRepository;
use App\Repositories\QuizRuntime\VersionRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * F-009D Runtime — Start / Resume attempt.
 * Creates or returns an active QuizAttempt from frozen Version + Snapshot.
 * Owns assign_student ownership / assign_id resolution.
 * Enforces frozen Open At / Close At / Max Attempts on new starts only.
 * Extends with F-009G retry policy (pass/fail lock + cooldown) after max attempts.
 * Applies frozen shuffle_questions / shuffle_answers once per new attempt.
 * Does not create answers, results, outbox, events, or jobs.
 */
class QuizAttemptStartService
{
    /** @var AttemptRepository */
    private $attempts;

    /** @var VersionRepository */
    private $versions;

    /** @var SnapshotRepository */
    private $snapshots;

    /** @var ResultRepository */
    private $results;

    /** @var QuizPublishService */
    private $publishService;

    public function __construct(
        AttemptRepository $attempts,
        VersionRepository $versions,
        SnapshotRepository $snapshots,
        ResultRepository $results,
        QuizPublishService $publishService
    ) {
        $this->attempts = $attempts;
        $this->versions = $versions;
        $this->snapshots = $snapshots;
        $this->results = $results;
        $this->publishService = $publishService;
    }

    /**
     * Start a new attempt, or return the existing active one for the same slot.
     *
     * Input:
     * - quiz_id (required)
     * - student_id (required)
     * - school_id (nullable)
     * - assign_student_id (nullable)
     * - start_idempotency_key (optional)
     * - client_instance_id (nullable)
     *
     * @param  array<string, mixed>  $input
     */
    public function start(array $input): QuizAttempt
    {
        $quizId = (int) ($input['quiz_id'] ?? 0);
        $studentId = (int) ($input['student_id'] ?? 0);
        $schoolId = $this->nullableInt($input, 'school_id');
        $assignStudentId = $this->nullableInt($input, 'assign_student_id');
        $startIdempotencyKey = $input['start_idempotency_key'] ?? null;
        $clientInstanceId = $input['client_instance_id'] ?? null;

        $assignId = $this->resolveAssignId($studentId, $assignStudentId);

        return DB::transaction(function () use (
            $quizId,
            $studentId,
            $schoolId,
            $assignId,
            $assignStudentId,
            $startIdempotencyKey,
            $clientInstanceId
        ) {
            [$version, $snapshot] = $this->resolvePublishedVersionAndSnapshot($quizId);

            // F-012 — row-level lock critical section (active check → attempt_no → create).
            $this->attempts->lockForUpdateByStudentQuiz($studentId, $quizId);

            $active = $this->attempts->findActiveAttempt(
                $studentId,
                $quizId,
                $assignStudentId
            );
            if ($active !== null) {
                $active->loadMissing(['snapshot', 'version', 'answers']);

                // Already running: return active attempt (Close At does not block resume).
                return $active;
            }

            $settings = is_array($version->settings_frozen) ? $version->settings_frozen : [];
            $startedAt = Carbon::now();

            // Enforce frozen window / attempt limits only when creating a new attempt.
            $this->assertOpenAt($settings, $startedAt);
            $this->assertCloseAt($settings, $startedAt);
            $this->assertMaxAttempts($settings, $studentId, $quizId);
            // F-009G — extend with pass/fail retry locks + cooldown (after max attempts).
            $this->assertRetryPolicy($settings, $studentId, $quizId, $startedAt);

            $timeLimitSeconds = $this->resolveTimeLimitSeconds($settings);
            $endsAt = $timeLimitSeconds !== null
                ? $startedAt->copy()->addSeconds($timeLimitSeconds)
                : null;

            $latest = $this->attempts->findLatestAttempt($studentId, $quizId);
            $attemptNo = $latest !== null ? ((int) $latest->attempt_no + 1) : 1;

            $activeSlotKey = sprintf(
                's:%d:q:%d:a:%d',
                $studentId,
                $quizId,
                $assignStudentId ?? 0
            );

            $questionOrder = $this->resolveQuestionOrder($snapshot, $settings);
            $answerOrder = $this->resolveAnswerOrder($snapshot, $settings);

            return $this->attempts->create([
                'quiz_id' => $quizId,
                'quiz_version_id' => (int) $version->id,
                'quiz_snapshot_id' => (int) $snapshot->id,
                'student_id' => $studentId,
                'school_id' => $schoolId,
                'assign_id' => $assignId,
                'assign_student_id' => $assignStudentId,
                'attempt_no' => $attemptNo,
                'status' => QuizAttempt::STATUS_IN_PROGRESS,
                'started_at' => $startedAt,
                'ends_at' => $endsAt,
                'time_limit_seconds' => $timeLimitSeconds,
                'do_when_time_end' => $settings['do_when_time_end'] ?? null,
                'question_order' => $questionOrder,
                'answer_order' => $answerOrder,
                'client_instance_id' => $clientInstanceId,
                'start_idempotency_key' => $startIdempotencyKey,
                'row_version' => 1,
                'active_slot_key' => $activeSlotKey,
            ]);
        });
    }

    /**
     * Resume the student's active attempt for a quiz slot (F-009C).
     *
     * Input:
     * - student_id (required)
     * - quiz_id (required)
     * - assign_student_id (nullable)
     *
     * @param  array<string, mixed>  $input
     */
    public function resume(array $input): QuizAttempt
    {
        $studentId = (int) ($input['student_id'] ?? 0);
        $quizId = (int) ($input['quiz_id'] ?? 0);
        $assignStudentId = $this->nullableInt($input, 'assign_student_id');

        if ($assignStudentId !== null) {
            $this->resolveAssignId($studentId, $assignStudentId);
        }

        $attempt = $this->attempts->findActiveAttempt(
            $studentId,
            $quizId,
            $assignStudentId
        );

        if ($attempt === null) {
            throw new RuntimeException('Active attempt not found.', 404);
        }

        if ((int) $attempt->student_id !== $studentId) {
            throw new RuntimeException('Active attempt not found.', 404);
        }

        if (! in_array($attempt->status, [
            QuizAttempt::STATUS_IN_PROGRESS,
            QuizAttempt::STATUS_EXPIRED,
        ], true)) {
            throw new RuntimeException('Active attempt not found.', 404);
        }

        // Ensure play Resource can serialize Runtime Snapshot + draft answers.
        $attempt->loadMissing(['snapshot', 'version', 'answers']);

        if ($attempt->snapshot === null) {
            throw new RuntimeException('Quiz snapshot missing for attempt.', 404);
        }

        return $attempt;
    }

    /**
     * Resolve a playable published Version + Snapshot, materializing from Definition when needed.
     *
     * @return array{0: \App\Models\QuizRuntime\QuizVersion, 1: \App\Models\QuizRuntime\QuizSnapshot}
     */
    private function resolvePublishedVersionAndSnapshot(int $quizId): array
    {
        $version = $this->versions->latestPublished($quizId);
        $snapshot = $version !== null
            ? $this->snapshots->findByVersion((int) $version->id)
            : null;

        if ($version !== null && $snapshot !== null && $this->snapshotHasPlayableQuestions($snapshot)) {
            return [$version, $snapshot];
        }

        $published = $this->publishService->publish(['quiz_id' => $quizId]);
        $version = $published['version'];
        $snapshot = $published['snapshot'];

        if (! $this->snapshotHasPlayableQuestions($snapshot)) {
            throw new RuntimeException('Quiz snapshot has no playable questions.');
        }

        return [$version, $snapshot];
    }

    /**
     * @param  \App\Models\QuizRuntime\QuizSnapshot  $snapshot
     */
    private function snapshotHasPlayableQuestions($snapshot): bool
    {
        $payload = is_array($snapshot->payload) ? $snapshot->payload : [];

        if (($payload['dev'] ?? false) === true) {
            return false;
        }

        $questions = isset($payload['questions']) && is_array($payload['questions'])
            ? $payload['questions']
            : [];

        if ($questions === []) {
            return false;
        }

        foreach ($questions as $question) {
            if (! is_array($question)) {
                continue;
            }
            $key = (string) ($question['snapshot_question_key'] ?? '');
            if ($key !== '') {
                return true;
            }
        }

        return false;
    }

    /**
     * Resolve assign_id from owned assign_student_id, or null when not provided.
     *
     * @throws RuntimeException when assign_student_id is set but not owned by student
     */
    private function resolveAssignId(int $studentId, ?int $assignStudentId): ?int
    {
        if ($assignStudentId === null) {
            return null;
        }

        $assignStudent = AssignsStudents::query()
            ->whereKey($assignStudentId)
            ->where('student_id', $studentId)
            ->first();

        if ($assignStudent === null) {
            throw new RuntimeException('Assign student not found for this user.', 403);
        }

        return $assignStudent->assign_id !== null
            ? (int) $assignStudent->assign_id
            : null;
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function nullableInt(array $input, string $key): ?int
    {
        if (! array_key_exists($key, $input) || $input[$key] === null || $input[$key] === '') {
            return null;
        }

        return (int) $input[$key];
    }

    /**
     * Derive frozen time_limit_seconds from Version settings_frozen.
     *
     * @param  array<string, mixed>  $settings
     */
    private function resolveTimeLimitSeconds(array $settings): ?int
    {
        if (! isset($settings['time_limit']) || $settings['time_limit'] === null) {
            return null;
        }

        $limit = (float) $settings['time_limit'];
        if ($limit <= 0) {
            return null;
        }

        $type = strtolower((string) ($settings['type_time'] ?? 'minutes'));

        if ($type === 'hours') {
            return (int) round($limit * 3600);
        }

        return (int) round($limit * 60);
    }

    /**
     * Open At — cannot start before frozen start_date.
     *
     * @param  array<string, mixed>  $settings
     */
    private function assertOpenAt(array $settings, Carbon $now): void
    {
        $startDate = $settings['start_date'] ?? null;
        if (! is_string($startDate) || $startDate === '') {
            return;
        }

        if ($now->lt(Carbon::parse($startDate)->startOfDay())) {
            throw new RuntimeException('Quiz is not open yet.', 403);
        }
    }

    /**
     * Close At — cannot start a new attempt after frozen due_date.
     * In-progress attempts are unaffected (existing Runtime submit behavior applies).
     *
     * @param  array<string, mixed>  $settings
     */
    private function assertCloseAt(array $settings, Carbon $now): void
    {
        $dueDate = $settings['due_date'] ?? null;
        if (! is_string($dueDate) || $dueDate === '') {
            return;
        }

        if ($now->gt(Carbon::parse($dueDate)->endOfDay())) {
            throw new RuntimeException('Quiz is closed.', 403);
        }
    }

    /**
     * Max Attempts — honor frozen num_attempts / unlimited_attempts.
     *
     * @param  array<string, mixed>  $settings
     */
    private function assertMaxAttempts(array $settings, int $studentId, int $quizId): void
    {
        if ($this->flagEnabled($settings['unlimited_attempts'] ?? null)) {
            return;
        }

        if (! isset($settings['num_attempts']) || $settings['num_attempts'] === null || $settings['num_attempts'] === '') {
            return;
        }

        $maxAttempts = (int) $settings['num_attempts'];
        if ($maxAttempts <= 0) {
            return;
        }

        $latest = $this->attempts->findLatestAttempt($studentId, $quizId);
        $used = $latest !== null ? (int) $latest->attempt_no : 0;

        if ($used >= $maxAttempts) {
            throw new RuntimeException('Maximum attempts reached.', 409);
        }
    }

    /**
     * F-009G — Retry policy after a finalized attempt.
     * Pass/fail locks + optional cooldown from frozen settings.
     * Missing allow_retry_after_pass → false; missing allow_retry_after_fail → true.
     *
     * @param  array<string, mixed>  $settings
     */
    private function assertRetryPolicy(
        array $settings,
        int $studentId,
        int $quizId,
        Carbon $now
    ): void {
        $latestFinalized = $this->attempts->findLatestFinalizedAttempt($studentId, $quizId);
        if ($latestFinalized === null) {
            return;
        }

        $delayMinutes = $settings['retry_delay_minutes'] ?? null;
        if ($delayMinutes !== null && $delayMinutes !== '') {
            $delay = (int) $delayMinutes;
            if ($delay > 0 && $latestFinalized->submitted_at !== null) {
                $eligibleAt = Carbon::parse($latestFinalized->submitted_at)->addMinutes($delay);
                if ($now->lt($eligibleAt)) {
                    throw new RuntimeException(
                        'Retry delay has not elapsed. Retry available after '.$eligibleAt->toIso8601String().'.',
                        422
                    );
                }
            }
        }

        $result = $this->results->findAuthoritative((int) $latestFinalized->id);
        if ($result === null) {
            return;
        }

        if ((bool) $result->passed) {
            if (! $this->retryFlagEnabled($settings['allow_retry_after_pass'] ?? null, false)) {
                throw new RuntimeException('Retry after pass is not allowed.', 403);
            }

            return;
        }

        if (! $this->retryFlagEnabled($settings['allow_retry_after_fail'] ?? null, true)) {
            throw new RuntimeException('Retry after fail is not allowed.', 403);
        }
    }

    /**
     * @param  mixed  $value
     */
    private function retryFlagEnabled($value, bool $defaultWhenMissing): bool
    {
        if ($value === null || $value === '') {
            return $defaultWhenMissing;
        }

        return $this->flagEnabled($value);
    }

    /**
     * @param  mixed  $value
     */
    private function flagEnabled($value): bool
    {
        return $value === true || $value === 1 || $value === '1';
    }

    /**
     * Build attempt question_order once at Start when shuffle_questions is on.
     * Returns null when shuffle is off (play uses Snapshot order).
     * Does not mutate Snapshot.
     *
     * @param  \App\Models\QuizRuntime\QuizSnapshot  $snapshot
     * @param  array<string, mixed>  $settings
     * @return array<int, string>|null
     */
    private function resolveQuestionOrder($snapshot, array $settings): ?array
    {
        if (! $this->flagEnabled($settings['shuffle_questions'] ?? null)) {
            return null;
        }

        $payload = is_array($snapshot->payload) ? $snapshot->payload : [];
        $questions = isset($payload['questions']) && is_array($payload['questions'])
            ? $payload['questions']
            : [];

        $keys = [];
        foreach ($questions as $question) {
            if (! is_array($question)) {
                continue;
            }
            $key = (string) ($question['snapshot_question_key'] ?? '');
            if ($key !== '') {
                $keys[] = $key;
            }
        }

        if ($keys === []) {
            return null;
        }

        shuffle($keys);

        return array_values($keys);
    }

    /**
     * Build attempt answer_order once at Start when shuffle_answers is on.
     * Map: snapshot_question_key => shuffled list of choice keys (answer1..answer8).
     * Choice identity keys are preserved; only display order changes.
     * Does not mutate Snapshot. Returns null when shuffle is off.
     *
     * @param  \App\Models\QuizRuntime\QuizSnapshot  $snapshot
     * @param  array<string, mixed>  $settings
     * @return array<string, array<int, string>>|null
     */
    private function resolveAnswerOrder($snapshot, array $settings): ?array
    {
        if (! $this->flagEnabled($settings['shuffle_answers'] ?? null)) {
            return null;
        }

        $payload = is_array($snapshot->payload) ? $snapshot->payload : [];
        $questions = isset($payload['questions']) && is_array($payload['questions'])
            ? $payload['questions']
            : [];

        $orderByQuestion = [];

        foreach ($questions as $question) {
            if (! is_array($question)) {
                continue;
            }

            $qKey = (string) ($question['snapshot_question_key'] ?? '');
            if ($qKey === '') {
                continue;
            }

            $options = isset($question['options']) && is_array($question['options'])
                ? $question['options']
                : [];

            $choiceKeys = [];
            for ($i = 1; $i <= 8; $i++) {
                $choiceKey = 'answer'.$i;
                if (! array_key_exists($choiceKey, $options)) {
                    continue;
                }
                $value = $options[$choiceKey];
                if ($value === null || $value === '') {
                    continue;
                }
                $choiceKeys[] = $choiceKey;
            }

            if (count($choiceKeys) < 2) {
                continue;
            }

            shuffle($choiceKeys);
            $orderByQuestion[$qKey] = array_values($choiceKeys);
        }

        return $orderByQuestion === [] ? null : $orderByQuestion;
    }
}
