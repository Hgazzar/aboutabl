<?php

namespace App\Http\Middleware;
use App\Traits\GeneralTrait;
use Closure;
use Tymon\JWTAuth\Facades\JWTAuth;

class CheckStudentToken
{

    use GeneralTrait;

    public function __construct()
    {
        auth()->setDefaultDriver('user-api');
    }

    public function handle($request, Closure $next, $guard = 'user-api')
    {
        auth()->setDefaultDriver($guard);

        $user = null;

        try {
            // Try to get token from request
            $token = $request->bearerToken();

            if (!$token) {
                // Try alternative methods to get the token
                $token = $_SERVER['HTTP_AUTHORIZATIONS'] ?? null;
                if ($token && strpos($token, 'Bearer ') === 0) {
                    $token = substr($token, 7);
                }
            }

            if (!$token) {
                return $this->returnError('E3001', 'TOKEN_NOTFOUND', 401);
            }

            // Set the token and authenticate
            JWTAuth::setToken($token);
            $user = JWTAuth::authenticate();

        } catch (\Exception $e) {
            if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenInvalidException) {
                return $this->returnError('E3001', 'INVALID_TOKEN', 401);
            } else if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenExpiredException) {
                return $this->returnError('E3001', 'EXPIRED_TOKEN', 401);
            } else {
                return $this->returnError('E3001', 'TOKEN_NOTFOUND: ' . $e->getMessage(), 401);
            }
        } catch (\Throwable $e) {
            if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenInvalidException) {
                return $this->returnError('E3001', 'INVALID_TOKEN', 401);
            } else if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenExpiredException) {
                return $this->returnError('E3001', 'EXPIRED_TOKEN', 401);
            } else {
                return $this->returnError('E3001', 'TOKEN_ERROR: ' . $e->getMessage(), 401);
            }
        }

        if (!$user) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        $userId = $user->id;
        $request->u_id = $userId;
        return $next($request);
    }
}
