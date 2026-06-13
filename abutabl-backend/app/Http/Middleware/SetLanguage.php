<?php

namespace App\Http\Middleware;

use Closure;

class SetLanguage
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if(\Session::has('locale')){
            \App::setlocale(\Session::get('locale'));
        }
        \Session::get('locale') === 'ar' ?config(['MIX_CONTENT_DIRECTION' => 'rtl']) : config(['MIX_CONTENT_DIRECTION' => 'ltr']) ;
        return $next($request);
    }
}
