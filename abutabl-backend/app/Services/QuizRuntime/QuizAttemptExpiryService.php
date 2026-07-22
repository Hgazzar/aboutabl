<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Repositories\QuizRuntime\AttemptRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * F-015 — Timed quiz enforcement from frozen ends_at + do_when_time_end.
 * Owns expire / auto-submit decisions. Does not grade; reuses QuizSubmitService.
 */
class QuizAttemptExpiryService
{
    /** Existing Definition / Timing UI values (do not invent new ones). */
    public const POLICY_AUTO_SUBMIT = 'open attempts are submitted automatically';

    public const POLICY_GRACE = 'there is a grace period when open attempts can be submitted. but no more question answared';

    public const POLICY_BLOCK = 'attempts must be submitted before time expires. or they are not counted';

    public const ACTION_AUTO_SUBMIT = 'auto_submit';

    public const ACTION_GRACE = 'grace';

    public const ACTION_BLOCK = 'block';

    /** @var AttemptRepository */
    private $attempts;

    public function __construct(AttemptRepository $attempts)
    {
        $this->attempts = $attempts;
    }

    public function isPastEndsAt(QuizAttempt $attempt, ?Carbon $now = null): bool
    {
        if ($attempt->ends_at === null) {
            return false;
        }

        $now = $now ?? Carbon::now();

        return $now->greaterThanOrEqualTo(Carbon::parse($attempt->ends_at));
    }

    /**
     * Map frozen do_when_time_end to an action. Unknown / empty → block (safe default).
     */
    public function resolveAction(QuizAttempt $attempt): string
    {
        $raw = strtolower(trim((string) ($attempt->do_when_time_end ?? '')));
        if ($raw === '') {
            return self::ACTION_BLOCK;
        }

        if ($raw === strtolower(self::POLICY_AUTO_SUBMIT)
            || strpos($raw, 'submitted automatically') !== false) {
            return self::ACTION_AUTO_SUBMIT;
        }

        if ($raw === strtolower(self::POLICY_GRACE)
            || strpos($raw, 'grace period') !== false) {
            return self::ACTION_GRACE;
        }

        if ($raw === strtolower(self::POLICY_BLOCK)
            || strpos($raw, 'not counted') !== false) {
            return self::ACTION_BLOCK;
        }

        return self::ACTION_BLOCK;
    }

    /**
     * Save path: reject any write after ends_at (or once already expired).
     * Block/grace: mark expired. Auto-submit: leave in_progress for the sweep.
     */
    public function assertWritableForSave(QuizAttempt $attempt, ?Carbon $now = null): void
    {
        if ($attempt->status === QuizAttempt::STATUS_EXPIRED) {
            throw new RuntimeException('Attempt has expired.', 409);
        }

        if (! $this->isPastEndsAt($attempt, $now)) {
            return;
        }

        $action = $this->resolveAction($attempt);

        // Auto-submit attempts stay in_progress so ExpireAttemptsCommand can submit them.
        if ($action !== self::ACTION_AUTO_SUBMIT
            && $attempt->status === QuizAttempt::STATUS_IN_PROGRESS) {
            $this->markExpired($attempt);
        }

        throw new RuntimeException('Attempt has expired.', 409);
    }

    /**
     * Submit path: block late submits when policy requires it; allow grace / auto-submit.
     * May mark the attempt expired under grace so subsequent Saves fail.
     */
    public function assertSubmittable(QuizAttempt $attempt, ?Carbon $now = null): void
    {
        $past = $this->isPastEndsAt($attempt, $now);
        $alreadyExpired = $attempt->status === QuizAttempt::STATUS_EXPIRED;

        if (! $past && ! $alreadyExpired) {
            return;
        }

        $action = $this->resolveAction($attempt);

        if ($action === self::ACTION_BLOCK) {
            if ($attempt->status === QuizAttempt::STATUS_IN_PROGRESS) {
                $this->markExpired($attempt);
            }
            throw new RuntimeException('Late submission is not allowed. Attempt has expired.', 409);
        }

        // Grace / auto-submit: allow Submit. Do not bump row_version here (would
        // break the caller's optimistic lock). Save is already blocked by ends_at.
    }

    /**
     * Process one overdue in_progress attempt (scheduler / sweep).
     *
     * @return string skipped|expired|auto_submitted
     */
    public function processDueAttempt(int $attemptId, ?Carbon $now = null): string
    {
        $now = $now ?? Carbon::now();
        $shouldAutoSubmit = false;
        $studentId = 0;
        $rowVersion = 0;

        $outcome = DB::transaction(function () use (
            $attemptId,
            $now,
            &$shouldAutoSubmit,
            &$studentId,
            &$rowVersion
        ) {
            $attempt = $this->attempts->lockForUpdate($attemptId);
            if ($attempt === null) {
                return 'skipped';
            }

            if ($attempt->status !== QuizAttempt::STATUS_IN_PROGRESS) {
                return 'skipped';
            }

            if (! $this->isPastEndsAt($attempt, $now)) {
                return 'skipped';
            }

            $action = $this->resolveAction($attempt);

            if ($action === self::ACTION_AUTO_SUBMIT) {
                $shouldAutoSubmit = true;
                $studentId = (int) $attempt->student_id;
                $rowVersion = (int) $attempt->row_version;

                return 'auto_submit_pending';
            }

            $this->markExpired($attempt);

            return 'expired';
        });

        if ($outcome !== 'auto_submit_pending') {
            return $outcome;
        }

        // Lazy resolve avoids constructor cycle with QuizSubmitService.
        /** @var QuizSubmitService $submit */
        $submit = app(QuizSubmitService::class);

        // Reuse existing Submit → Auto Grade → Finalize pipeline (no duplicated grading).
        $submit->submit([
            'attempt_id' => $attemptId,
            'student_id' => $studentId,
            'row_version' => $rowVersion,
            'answers' => [],
            'submit_idempotency_key' => 'auto-expire:'.$attemptId.':'.$rowVersion,
        ]);

        return 'auto_submitted';
    }

    /**
     * Mark attempt expired. Keeps active_slot_key (schema allows it while expired).
     */
    public function markExpired(QuizAttempt $attempt): QuizAttempt
    {
        return $this->attempts->update($attempt, [
            'status' => QuizAttempt::STATUS_EXPIRED,
            'row_version' => ((int) $attempt->row_version) + 1,
        ]);
    }
}
