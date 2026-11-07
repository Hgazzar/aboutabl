<?php

namespace App\Http\Middleware;

use App\Support\Ownership\OwnershipGate;
use App\Traits\GeneralTrait;
use Closure;
use Illuminate\Http\Request;

class EnsureLiveCompetitionsAdminOnly
{
    use GeneralTrait;

    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (! OwnershipGate::isAdminUser($user)) {
            return $this->returnError('403', 'Forbidden.', 403);
        }

        return $next($request);
    }
}
