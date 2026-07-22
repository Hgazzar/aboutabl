<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizResult;
use RuntimeException;

/**
 * F-009D — Reports Adapter (Outbox Relay consumer).
 *
 * Existing Reports infrastructure is read-time over assignment completion
 * (`assigns_students.opened_at`) and performance history (`performance_facts`).
 * Those inputs are already refreshed by Learning Progress and Rankings on this
 * same QuizFinalized relay path. There is no separate Reports write API or
 * formula to invoke without redesign.
 *
 * This adapter:
 * - runs only after LP + Rankings succeed
 * - verifies authoritative finalized Result
 * - does not modify Runtime, LP, Rankings, Metrics, Definition, or Authoring
 * - does not invent new report calculations
 *
 * Next Reports API/dashboard reads therefore see post-finalize data without
 * Runtime calling Reports directly.
 */
class QuizReportsAdapter
{
    /**
     * Acknowledge Reports consumer for a finalized authoritative Result.
     *
     * @param  array<string, mixed>  $context  Optional outbox payload identifiers
     */
    public function apply(QuizAttempt $attempt, QuizResult $result, array $context = []): void
    {
        if (! (bool) $result->is_authoritative) {
            throw new RuntimeException('Reports require an authoritative Result.');
        }

        if ((int) $result->attempt_id !== (int) $attempt->id) {
            throw new RuntimeException('Result does not belong to Attempt.');
        }

        if ($attempt->status !== QuizAttempt::STATUS_FINALIZED) {
            throw new RuntimeException('Reports require a finalized Attempt.');
        }

        // Intentionally no-op write:
        // - ClassStandardsService::buildReport / Learning Progress % are read-time
        //   over assign completion already updated by QuizLearningProgressAdapter.
        // - performance_facts history already refreshed by QuizRankingsAdapter.
        // Calling those services here would either be read-only noise or would
        // redesign/duplicate Metrics formulas (forbidden).
        unset($context);
    }
}
