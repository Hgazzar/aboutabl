<?php

namespace App\Jobs\QuizRuntime;

use App\Services\QuizRuntime\QuizOutboxRelayService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * F-009D Runtime — Outbox Relay worker (Sprint 1 Step 6).
 * Drains pending outbox rows to published. No downstream consumers.
 */
class RelayQuizOutboxJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** @var int */
    public $limit;

    public function __construct(int $limit = 100)
    {
        $this->limit = $limit;
    }

    public function handle(QuizOutboxRelayService $relay): void
    {
        $relay->relay($this->limit);
    }
}
