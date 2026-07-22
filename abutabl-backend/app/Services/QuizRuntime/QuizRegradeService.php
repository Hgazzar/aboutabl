<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizResult;
use App\Models\User;
use App\Repositories\QuizRuntime\AnswerRepository;
use App\Repositories\QuizRuntime\AttemptRepository;
use App\Repositories\QuizRuntime\ResultRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * F-009D Sprint 2 Step 3 — Regrade engine.
 * Creates a new authoritative Result (new grade_version); preserves history.
 * Does not modify Answers, Snapshot, or Definition.
 * Outbox publish delegated to QuizFinalizeService::publishAuthoritativeResult().
 */
class QuizRegradeService
{
    /** @var AttemptRepository */
    private $attempts;

    /** @var AnswerRepository */
    private $answers;

    /** @var ResultRepository */
    private $results;

    /** @var QuizTeacherRuntimeReadService */
    private $teacherRead;

    /** @var QuizFinalizeService */
    private $finalize;

    public function __construct(
        AttemptRepository $attempts,
        AnswerRepository $answers,
        ResultRepository $results,
        QuizTeacherRuntimeReadService $teacherRead,
        QuizFinalizeService $finalize
    ) {
        $this->attempts = $attempts;
        $this->answers = $answers;
        $this->results = $results;
        $this->teacherRead = $teacherRead;
        $this->finalize = $finalize;
    }

    /**
     * Explicit regrade producing a new grade_version.
     *
     * Input:
     * - attempt_id (required)
     * - teacher (User)
     * - reason (optional)
     * - mode (optional; default snapshot_rules — recalculate from frozen answer scores)
     *
     * @param  array<string, mixed>  $input
     * @return array{attempt: QuizAttempt, result: QuizResult}
     */
    public function regrade(array $input): array
    {
        /** @var User|null $teacher */
        $teacher = $input['teacher'] ?? Auth::guard('admin-api')->user();
        if ($teacher === null) {
            throw new RuntimeException('Unauthenticated.', 401);
        }

        $attemptId = (int) ($input['attempt_id'] ?? 0);
        $reason = isset($input['reason']) ? trim((string) $input['reason']) : null;
        $mode = isset($input['mode']) && (string) $input['mode'] !== ''
            ? (string) $input['mode']
            : 'snapshot_rules';

        $newResultId = 0;

        DB::transaction(function () use (
            $teacher,
            $attemptId,
            $reason,
            $mode,
            &$newResultId
        ) {
            $attempt = $this->attempts->lockForUpdate($attemptId);
            if ($attempt === null) {
                throw new RuntimeException('Attempt not found.', 404);
            }

            $this->teacherRead->assertCanAccessAttempt($teacher, $attempt);

            if ($attempt->status !== QuizAttempt::STATUS_FINALIZED) {
                throw new RuntimeException('Only finalized attempts can be regraded.', 409);
            }

            $previous = $this->results->findAuthoritative($attemptId);
            if ($previous === null) {
                throw new RuntimeException('Authoritative quiz result not found.', 404);
            }

            $previous = QuizResult::query()
                ->whereKey($previous->id)
                ->lockForUpdate()
                ->first();

            if ($previous === null) {
                throw new RuntimeException('Authoritative quiz result not found.', 404);
            }

            $answerRows = $this->answers->findByAttempt($attemptId);

            $autoScoreTotal = 0.0;
            $manualScoreTotal = 0.0;
            foreach ($answerRows as $answer) {
                if ($answer->auto_score !== null) {
                    $autoScoreTotal += (float) $answer->auto_score;
                }
                if ($answer->manual_score !== null) {
                    $manualScoreTotal += (float) $answer->manual_score;
                }
            }

            $maxScore = (float) $previous->max_score;
            $rawScore = $autoScoreTotal + $manualScoreTotal;
            $percent = $maxScore > 0.0 ? round(($rawScore / $maxScore) * 100, 2) : 0.0;

            $attempt->loadMissing('version');
            $passed = $this->resolvePassed($attempt, $rawScore);

            $previousVersion = (int) $previous->grade_version;
            $newVersion = $previousVersion + 1;
            $finalizedAt = Carbon::now();

            // Release authoritative_slot before inserting the new authoritative row
            // (unique index on authoritative_slot; NULL when not authoritative).
            $previous->is_authoritative = false;
            $previous->authoritative_slot = null;
            $this->results->save($previous);

            $breakdown = is_array($previous->breakdown) ? $previous->breakdown : [];
            $breakdown['regrade'] = [
                'from_grade_version' => $previousVersion,
                'to_grade_version' => $newVersion,
                'mode' => $mode,
                'reason' => $reason,
                'regraded_by' => (int) $teacher->id,
                'regraded_at' => $finalizedAt->toIso8601String(),
            ];

            $created = $this->results->create([
                'attempt_id' => (int) $attempt->id,
                'student_id' => (int) $attempt->student_id,
                'quiz_id' => (int) $attempt->quiz_id,
                'school_id' => $attempt->school_id,
                'raw_score' => $rawScore,
                'max_score' => $maxScore,
                'scaled_score' => $previous->scaled_score,
                'percent' => $percent,
                'auto_score_total' => $autoScoreTotal,
                'manual_score_total' => $manualScoreTotal,
                'pending_manual' => false,
                'passed' => $passed,
                'grade_version' => $newVersion,
                'is_authoritative' => true,
                'authoritative_slot' => (int) $attempt->id,
                'finalized_at' => $finalizedAt,
                'breakdown' => $breakdown,
            ]);

            $this->attempts->update($attempt, [
                'row_version' => ((int) $attempt->row_version) + 1,
            ]);

            $newResultId = (int) $created->id;
        });

        return $this->finalize->publishAuthoritativeResult([
            'attempt_id' => $attemptId,
            'result_id' => $newResultId,
        ]);
    }

    private function resolvePassed(QuizAttempt $attempt, float $rawScore): bool
    {
        $settings = [];
        if ($attempt->relationLoaded('version') && $attempt->version !== null) {
            $settings = is_array($attempt->version->settings_frozen)
                ? $attempt->version->settings_frozen
                : [];
        }

        if (! isset($settings['score_to_pass']) || $settings['score_to_pass'] === null) {
            return false;
        }

        return $rawScore >= (float) $settings['score_to_pass'];
    }
}
