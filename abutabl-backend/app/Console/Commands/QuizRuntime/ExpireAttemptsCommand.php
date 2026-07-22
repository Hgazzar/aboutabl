<?php

namespace App\Console\Commands\QuizRuntime;

use App\Repositories\QuizRuntime\AttemptRepository;
use App\Services\QuizRuntime\QuizAttemptExpiryService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Throwable;

/**
 * F-015 — Expire / auto-submit timed Quiz Runtime attempts past ends_at.
 * Reuses QuizAttemptExpiryService + existing Submit pipeline. No grading logic here.
 */
class ExpireAttemptsCommand extends Command
{
    protected $signature = 'quiz-runtime:expire-attempts
                            {--limit=100 : Max overdue attempts to process this run}';

    protected $description = 'Expire or auto-submit Quiz Runtime attempts past ends_at (F-015)';

    public function handle(AttemptRepository $attempts, QuizAttemptExpiryService $expiry)
    {
        $limit = max(1, (int) $this->option('limit'));
        $now = Carbon::now();
        $ids = $attempts->findDueInProgressIds($limit, $now);

        $expired = 0;
        $autoSubmitted = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($ids as $attemptId) {
            try {
                $outcome = $expiry->processDueAttempt((int) $attemptId, $now);
                if ($outcome === 'expired') {
                    $expired++;
                } elseif ($outcome === 'auto_submitted') {
                    $autoSubmitted++;
                } else {
                    $skipped++;
                }
            } catch (Throwable $ex) {
                $failed++;
                $this->error(sprintf(
                    'attempt_id=%d failed: %s',
                    $attemptId,
                    $ex->getMessage()
                ));
            }
        }

        $this->info(sprintf(
            'Expire sweep complete — due=%d expired=%d auto_submitted=%d skipped=%d failed=%d',
            count($ids),
            $expired,
            $autoSubmitted,
            $skipped,
            $failed
        ));

        return $failed > 0 ? 1 : 0;
    }
}
