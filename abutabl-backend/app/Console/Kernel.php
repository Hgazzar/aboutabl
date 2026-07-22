<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        //
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('performance:capture-daily')->dailyAt('01:15');

        // F-015 — timed quiz expire / auto-submit sweep (production interval).
        $schedule->command('quiz-runtime:expire-attempts --limit=200')
            ->everyMinute()
            ->withoutOverlapping();

        // F-045B — relay finalized quiz outbox → Completion / Performance Snapshot / Notifications.
        $schedule->command('quiz-runtime:relay-outbox --limit=100')
            ->everyMinute()
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
