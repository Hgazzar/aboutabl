<?php

namespace App\Console\Commands\QuizRuntime;

use Illuminate\Console\Command;

/**
 * quiz-runtime:replay-outbox scaffold (F-009D Sprint 1).
 */
class ReplayOutboxCommand extends Command
{
    protected $signature = 'quiz-runtime:replay-outbox {attempt? : Attempt id to replay (optional)}';

    protected $description = 'Quiz Runtime scaffold — replay outbox events (not implemented)';

    public function handle()
    {
        $this->warn('quiz-runtime:replay-outbox is a Sprint 1 scaffold — not implemented.');

        return 0;
    }
}
