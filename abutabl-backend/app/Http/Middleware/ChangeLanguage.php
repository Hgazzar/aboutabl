<?php

namespace App\Http\Middleware;

use Closure;

class ChangeLanguage
{
    
    public function handle($request, Closure $next)
    {
        app()->setLocale('en');
        // $headers = getallheaders();
        $lang = $request->header('lang');
        if(isset($lang)  && $lang == 'ar' )
            app()->setLocale('ar');

        return $next($request);
    }
}
