<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Contact form inbox
    |--------------------------------------------------------------------------
    |
    | Public landing "Contact Us" messages are delivered here.
    |
    */

    'to' => env('CONTACT_MAIL_TO', 'info@aboutabl.com'),

    'from_address' => env('CONTACT_MAIL_FROM_ADDRESS', env('MAIL_FROM_ADDRESS', 'noreply@aboutabl.com')),

    'from_name' => env('CONTACT_MAIL_FROM_NAME', env('MAIL_FROM_NAME', 'ABOUTABL')),

    /*
    | When SMTP fails, still accept the form and append to storage/app/contact_messages.jsonl.
    | Defaults on for local/staging via ContactController; force with CONTACT_FALLBACK_STORE=1.
    */
    'fallback_store_on_mail_failure' => filter_var(
        env('CONTACT_FALLBACK_STORE', false),
        FILTER_VALIDATE_BOOLEAN
    ),

];
