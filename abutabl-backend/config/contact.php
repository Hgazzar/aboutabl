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

];
