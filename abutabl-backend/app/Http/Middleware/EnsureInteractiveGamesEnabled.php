<?php

namespace App\Http\Middleware;

use App\Traits\GeneralTrait;
use Closure;
use Illuminate\Http\Request;

class EnsureInteractiveGamesEnabled
{
    use GeneralTrait;

    public function handle(Request $request, Closure $next)
    {
        if (! config('interactive_games.enabled', true)) {
            return $this->returnError('404', 'Interactive games are disabled.', 404);
        }

        return $next($request);
    }
}
