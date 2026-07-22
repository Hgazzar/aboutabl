<?php

namespace App\Repositories\QuizRuntime;

use App\Models\QuizRuntime\QuizIntegrationOutbox;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

/**
 * Persistence only for quiz_integration_outbox (F-009D Sprint 1 Step 4).
 */
class OutboxRepository
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): QuizIntegrationOutbox
    {
        return QuizIntegrationOutbox::query()->create($attributes);
    }

    public function markPublished(QuizIntegrationOutbox $event, ?Carbon $publishedAt = null): QuizIntegrationOutbox
    {
        $event->fill([
            'status' => QuizIntegrationOutbox::STATUS_PUBLISHED,
            'published_at' => $publishedAt ?? Carbon::now(),
            'last_error' => null,
        ]);
        $event->save();

        return $event;
    }

    public function markFailed(QuizIntegrationOutbox $event, ?string $lastError = null): QuizIntegrationOutbox
    {
        $event->fill([
            'status' => QuizIntegrationOutbox::STATUS_DEAD,
            'last_error' => $lastError,
            'relay_attempts' => (int) $event->relay_attempts + 1,
        ]);
        $event->save();

        return $event;
    }

    /**
     * @return Collection|QuizIntegrationOutbox[]
     */
    public function pendingEvents(int $limit = 100): Collection
    {
        return QuizIntegrationOutbox::query()
            ->where('status', QuizIntegrationOutbox::STATUS_PENDING)
            ->orderBy('id')
            ->limit($limit)
            ->get();
    }

    public function findByIdempotencyKey(string $idempotencyKey): ?QuizIntegrationOutbox
    {
        return QuizIntegrationOutbox::query()
            ->where('idempotency_key', $idempotencyKey)
            ->first();
    }
}
