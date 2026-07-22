<?php

namespace App\Http\Middleware;

use App\Support\Ownership\OwnershipGate;
use Closure;
use Illuminate\Http\Request;

/**
 * F-045D — Quiz library authoring is admin-only; teachers are consumers (browse/use).
 */
class EnsureQuizLibraryAdminOnly
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if ($user !== null && ! OwnershipGate::isAdminUser($user)) {
            abort(403, 'Forbidden.');
        }

        return $next($request);
    }
}
