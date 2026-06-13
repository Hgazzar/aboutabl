<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthenticateBroadcastJwt
{
    /**
     * Authenticate broadcasting channel subscription using admin-api or user-api JWT.
     */
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        if (! $token && isset($_SERVER['HTTP_AUTHORIZATIONS']) && strpos($_SERVER['HTTP_AUTHORIZATIONS'], 'Bearer ') === 0) {
            $token = substr($_SERVER['HTTP_AUTHORIZATIONS'], 7);
        }

        if (! $token) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        foreach (['admin-api', 'user-api'] as $guard) {
            try {
                JWTAuth::setToken($token);
                Auth::shouldUse($guard);
                $user = JWTAuth::authenticate();
                if ($user) {
                    return $next($request);
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        return response()->json(['message' => 'Unauthorized'], 401);
    }
}
