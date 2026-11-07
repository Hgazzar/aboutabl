<?php

return [
    /*
    | When false, live competition API routes return 404 (feature off).
    | Default is false until Slice H acceptance. Legacy Interactive Games
    | product is retired (INTERACTIVE_GAMES_ENABLED defaults false).
    */
    'enabled' => env('LIVE_COMPETITIONS_ENABLED', false),

    /*
    | Preview tokens expire after this many seconds and can be confirmed once.
    */
    'preview_token_ttl_seconds' => (int) env('LIVE_COMPETITIONS_PREVIEW_TTL', 600),
];
