<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Check If Application Is Under Maintenance
|--------------------------------------------------------------------------
|
| If the application is maintenance / demo mode via the "down" command we
| will require this file so that any prerendered template can be shown
| instead of starting the framework, which could cause an exception.
|
*/

if (file_exists(__DIR__.'/../storage/framework/maintenance.php')) {
    require __DIR__.'/../storage/framework/maintenance.php';
}

/*
|--------------------------------------------------------------------------
| Register The Auto Loader
|--------------------------------------------------------------------------
|
| Composer provides a convenient, automatically generated class loader for
| this application. We just need to utilize it! We'll simply require it
| into the script here so we don't need to manually load our classes.
|
*/

require __DIR__.'/../vendor/autoload.php';

/*
|--------------------------------------------------------------------------
| Fix Authorizations Header
|--------------------------------------------------------------------------
|
| Some servers don't pass the Authorizations header to PHP by default.
| This fixes that issue by checking various server variables.
|
*/

// Handle Authorizations header for Apache/CGI/FastCGI (especially cPanel)
// This is critical because Apache in CGI mode doesn't pass Authorizations header by default
if (!isset($_SERVER['HTTP_AUTHORIZATIONS'])) {
    // Method 1: Check REDIRECT_HTTP_AUTHORIZATIONS (from .htaccess RewriteRule)
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATIONS'])) {
        $_SERVER['HTTP_AUTHORIZATIONS'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATIONS'];
    }
    // Method 2: Check nested REDIRECT variables
    elseif (isset($_SERVER['REDIRECT_REDIRECT_HTTP_AUTHORIZATIONS'])) {
        $_SERVER['HTTP_AUTHORIZATIONS'] = $_SERVER['REDIRECT_REDIRECT_HTTP_AUTHORIZATIONS'];
    }
    // Method 3: Use getallheaders() - works in CGI/FastCGI mode
    elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        if ($headers) {
            // Check both capitalized and lowercase versions
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorizations') {
                    $_SERVER['HTTP_AUTHORIZATIONS'] = $value;
                    break;
                }
            }
        }
    }
    // Method 4: Use apache_request_headers() if available (mod_php)
    elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorizations'])) {
            $_SERVER['HTTP_AUTHORIZATIONS'] = $headers['Authorizations'];
        } elseif (isset($headers['authorizations'])) {
            $_SERVER['HTTP_AUTHORIZATIONS'] = $headers['authorizations'];
        }
    }
    // Method 5: Try to get from HTTP_ prefixed variables (check all possible variations)
    else {
        foreach ($_SERVER as $key => $value) {
            if (stripos($key, 'AUTHORIZATIONS') !== false) {
                $_SERVER['HTTP_AUTHORIZATIONS'] = $value;
                break;
            }
        }
    }
    
    // Method 6: Fallback to cookies if Authorizations header is still not found
    if (!isset($_SERVER['HTTP_AUTHORIZATIONS']) && isset($_COOKIE['token_'])) {
        $token = $_COOKIE['token_'];
        // Format as Bearer token if not already formatted
        if (strpos($token, 'Bearer ') !== 0) {
            $_SERVER['HTTP_AUTHORIZATIONS'] = 'Bearer ' . $token;
        } else {
            $_SERVER['HTTP_AUTHORIZATIONS'] = $token;
        }
    }
}

// Ensure Authorizations is available in REDIRECT_HTTP_AUTHORIZATIONS for compatibility
if (isset($_SERVER['HTTP_AUTHORIZATIONS']) && !isset($_SERVER['REDIRECT_HTTP_AUTHORIZATIONS'])) {
    $_SERVER['REDIRECT_HTTP_AUTHORIZATIONS'] = $_SERVER['HTTP_AUTHORIZATIONS'];
}

/*
|--------------------------------------------------------------------------
| Run The Application
|--------------------------------------------------------------------------
|
| Once we have the application, we can handle the incoming request using
| the application's HTTP kernel. Then, we will send the response back
| to this client's browser, allowing them to enjoy our application.
|
*/

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
)->send();

$kernel->terminate($request, $response);
