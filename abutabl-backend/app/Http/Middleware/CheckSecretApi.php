<?php

namespace App\Http\Middleware;
use App\Traits\GeneralTrait;
use Closure;
use Facade\FlareClient\Http\Response;
use Illuminate\Http\Request;

class CheckSecretApi
{
    
    use GeneralTrait ;

    public function handle(Request $request, Closure $next)
    {
        $secret = $request->header('apiSecret');

        if(!isset($secret))
            return $this->returnError('E3000','Enter apiSecret ',403 );
        
        if( $secret !== env('API_SECRET','OASzRok654E0AJ20KH'))
            return $this->returnError('E3000',' apiSecret not correct.',403 );
            
        return $next($request);
    }
}
