<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizIntegrationOutbox;
use App\Models\QuizRuntime\QuizResult;
use App\Repositories\QuizRuntime\AttemptRepository;
use App\Repositories\QuizRuntime\OutboxRepository;
use App\Repositories\QuizRuntime\ResultRepository;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

/**
 * F-009D Sprint 3 — Outbox Relay consumers (LP → Rankings → Reports → Notifications).
 * Runtime never calls Learning Progress, Rankings, Reports, or Notifications directly.
 * Does not mutate Runtime Result/Attempt beyond Outbox status.
 */
class QuizOutboxRelayService
{
    /** @var OutboxRepository */
    private $outbox;

    /** @var AttemptRepository */
    private $attempts;

    /** @var ResultRepository */
    private $results;

    /** @var QuizLearningProgressAdapter */
    private $learningProgress;

    /** @var QuizRankingsAdapter */
    private $rankings;

    /** @var QuizReportsAdapter */
    private $reports;

    /** @var QuizNotificationsAdapter */
    private $notifications;

    public function __construct(
        OutboxRepository $outbox,
        AttemptRepository $attempts,
        ResultRepository $results,
        QuizLearningProgressAdapter $learningProgress,
        QuizRankingsAdapter $rankings,
        QuizReportsAdapter $reports,
        QuizNotificationsAdapter $notifications
    ) {
        $this->outbox = $outbox;
        $this->attempts = $attempts;
        $this->results = $results;
        $this->learningProgress = $learningProgress;
        $this->rankings = $rankings;
        $this->reports = $reports;
        $this->notifications = $notifications;
    }

    /**
     * Relay pending outbox rows one at a time.
     *
     * @return array{processed: int, published: int, failed: int, skipped: int}
     */
    public function relay(int $limit = 100): array
    {
        $limit = max(1, min($limit, 500));
        $pending = $this->outbox->pendingEvents($limit);

        $published = 0;
        $failed = 0;
        $skipped = 0;

        foreach ($pending as $row) {
            $outcome = $this->processOne((int) $row->id);

            if ($outcome === 'published') {
                $published++;
            } elseif ($outcome === 'failed') {
                $failed++;
            } else {
                $skipped++;
            }
        }

        return [
            'processed' => $published + $failed + $skipped,
            'published' => $published,
            'failed' => $failed,
            'skipped' => $skipped,
        ];
    }

    /**
     * Process a single outbox row by id (idempotent).
     *
     * @return string published|failed|skipped
     */
    public function processOne(int $outboxId): string
    {
        try {
            return DB::transaction(function () use ($outboxId) {
                $row = QuizIntegrationOutbox::query()
                    ->whereKey($outboxId)
                    ->lockForUpdate()
                    ->first();

                if ($row === null) {
                    return 'skipped';
                }

                if ($row->status === QuizIntegrationOutbox::STATUS_PUBLISHED
                    || $row->status === QuizIntegrationOutbox::STATUS_DEAD) {
                    return 'skipped';
                }

                if ($row->status !== QuizIntegrationOutbox::STATUS_PENDING) {
                    return 'skipped';
                }

                $this->dispatch($row);
                $this->outbox->markPublished($row);

                return 'published';
            });
        } catch (Throwable $ex) {
            $row = QuizIntegrationOutbox::query()->find($outboxId);
            if ($row !== null && $row->status === QuizIntegrationOutbox::STATUS_PENDING) {
                $this->outbox->markFailed($row, $ex->getMessage());
            }

            return 'failed';
        }
    }

    /**
     * Route outbox event to adapters.
     * Notifications only via QuizNotificationsAdapter on QuizFinalized.
     */
    private function dispatch(QuizIntegrationOutbox $row): void
    {
        if ((string) $row->event_type === '') {
            throw new RuntimeException('Outbox row missing event_type.');
        }

        if ((string) $row->idempotency_key === '') {
            throw new RuntimeException('Outbox row missing idempotency_key.');
        }

        if ($row->event_type === QuizIntegrationOutbox::EVENT_FINALIZED) {
            $this->handleQuizFinalized($row);

            return;
        }

        // Other event types: acknowledge without consumers (later sprints).
    }

    private function handleQuizFinalized(QuizIntegrationOutbox $row): void
    {
        $payload = is_array($row->payload) ? $row->payload : [];
        $attemptId = (int) ($payload['attempt_id'] ?? $row->attempt_id ?? 0);
        $resultId = (int) ($payload['result_id'] ?? 0);

        if ($attemptId <= 0) {
            throw new RuntimeException('QuizFinalized payload missing attempt_id.');
        }

        $attempt = $this->attempts->findById($attemptId);
        if ($attempt === null) {
            throw new RuntimeException('Attempt not found for QuizFinalized.');
        }

        $result = null;
        if ($resultId > 0) {
            $result = QuizResult::query()->whereKey($resultId)->first();
        }
        if ($result === null) {
            $result = $this->results->findAuthoritative($attemptId);
        }

        if ($result === null) {
            throw new RuntimeException('Authoritative Result not found for QuizFinalized.');
        }

        if (! (bool) $result->is_authoritative) {
            throw new RuntimeException('QuizFinalized Result is not authoritative.');
        }

        if ($attempt->status !== QuizAttempt::STATUS_FINALIZED) {
            throw new RuntimeException('Attempt is not finalized for QuizFinalized.');
        }

        // Ordered: LP → Rankings → Reports → Notifications; then Outbox published by caller.
        $this->learningProgress->apply($attempt, $result, $payload);
        $this->rankings->apply($attempt, $result, $payload);
        $this->reports->apply($attempt, $result, $payload);
        $this->notifications->apply($attempt, $result, $payload);
    }
}
