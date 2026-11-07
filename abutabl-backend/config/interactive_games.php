<?php

return [
    /*
    | Legacy Interactive Games product — retired from the active product.
    | Default false so the old APIs cannot be re-enabled by omitting the env var.
    | Set INTERACTIVE_GAMES_ENABLED=true only for emergency recovery (not supported UX).
    | When false, interactive-game API routes return 404.
    */
    'enabled' => env('INTERACTIVE_GAMES_ENABLED', false),
];
