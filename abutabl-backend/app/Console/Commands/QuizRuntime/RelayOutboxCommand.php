<?php

namespace App\Console\Commands\QuizRuntime;

use App\Services\QuizRuntime\QuizOutboxRelayService;
use Illuminate\Console\Command;

/**
 * F-009D Runtime — Outbox Relay artisan entry (Sprint 1 Step 6).
 * Reads pending outbox rows and marks them published. No consumers.
 */
class RelayOutboxCommand extends Command
{
    protected $signature = 'quiz-runtime:relay-outbox
                            {--limit=100 : Max pending rows to process this run}';

    protected $description = 'Relay pending Quiz Runtime integration outbox rows to published (no consumers)';

    public function handle(QuizOutboxRelayService $relay)
    {
        $limit = (int) $this->option('limit');
        $summary = $relay->relay($limit);

        $this->info(sprintf(
            'Outbox relay complete — processed=%d published=%d failed=%d skipped=%d',
            $summary['processed'],
            $summary['published'],
            $summary['failed'],
            $summary['skipped']
        ));

        return 0;
    }
}
