<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Paths that should handle CORS
    |--------------------------------------------------------------------------
    */
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    /*
    |--------------------------------------------------------------------------
    | Allowed HTTP methods
    |--------------------------------------------------------------------------
    */
    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed origins (your frontend domains)
    |--------------------------------------------------------------------------
    |
    | Note: supports_credentials is true, so wildcard "*" is not valid per
    | the CORS spec. Use explicit origins + allowed_origins_patterns for local.
    |
    */
    'allowed_origins' => array_filter(array_merge(
        [
            'https://aboutabl.com',
            'https://www.aboutabl.com',
            'https://api.aboutabl.com',
            'https://student.aboutabl.com',
            // Staging (new.aboutabl.com)
            'https://new.aboutabl.com',
            'https://admin-new.aboutabl.com',
            'https://api-new.aboutabl.com',
        ],
        env('APP_ENV') === 'local' ? [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:4200',
            'http://localhost:5173',
            'http://localhost:8000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:4200',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:8001',
        ] : [
            'http://localhost:8000',
            'http://localhost:3000',
            'http://localhost:4200',
            'http://localhost:5173',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:4200',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:8001',
        ]
    )),

    /*
    |--------------------------------------------------------------------------
    | Allowed origin patterns
    |--------------------------------------------------------------------------
    |
    | Local dev: allow any localhost / 127.0.0.1 port (e.g. CRA on :3001).
    |
    */
    'allowed_origins_patterns' => env('APP_ENV') === 'local'
        ? ['#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#']
        : [],

    /*
    |--------------------------------------------------------------------------
    | Allowed headers
    |--------------------------------------------------------------------------
    |
    | Explicit list required: wildcard "*" is unreliable with credentials, and
    | the admin SPA sends Authorizations + apiSecret on every API call.
    |
    */
    'allowed_headers' => [
        'Authorizations',
        'Authorization',
        'apiSecret',
        'Content-Type',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-Socket-Id',
    ],

    /*
    |--------------------------------------------------------------------------
    | Exposed headers
    |--------------------------------------------------------------------------
    */
    'exposed_headers' => ['Authorizations'],

    /*
    |--------------------------------------------------------------------------
    | Max age (for OPTIONS caching)
    |--------------------------------------------------------------------------
    */
    'max_age' => 0,

    /*
    |--------------------------------------------------------------------------
    | Support credentials
    |--------------------------------------------------------------------------
    */
    'supports_credentials' => true,

];
