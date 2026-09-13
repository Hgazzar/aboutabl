<?php

return [
    /**
     * Local UI QA only: surface Activities chips on My Progress book cards.
     * Counts SLCC rows per subject — NOT product SSOT. Keep false in production.
     *
     * Enable: MY_PROGRESS_DEMO_ACTIVITIES=true (APP_ENV=local)
     */
    'demo_show_activities' => env('APP_ENV') === 'local'
        && filter_var(env('MY_PROGRESS_DEMO_ACTIVITIES', false), FILTER_VALIDATE_BOOLEAN),
];
