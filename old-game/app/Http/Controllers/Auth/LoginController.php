<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Game1;
use App\Providers\RouteServiceProvider;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;

class LoginController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles authenticating users for the application and
    | redirecting them to your home screen. The controller uses a trait
    | to conveniently provide its functionality to your applications.
    |
    */

    use AuthenticatesUsers;

    /**
     * Where to redirect users after login.
     *
     * @var string
     */
    protected $redirectTo = RouteServiceProvider::HOME;

    public function login(Request $request){
        //dd($request);
        $game = Game1::with(['questions'])->where('id', $request->game_id)->first();

        if(!empty($request)){
            if($request->type=="user"){

                if (Auth::guard('web')->attempt(['email' => $request->email, 'password' => $request->password])) {
                    $details = Auth::guard('web')->user();
                    $user = $details;
                    //dd($user);
                    return redirect('/admin/home');
                } else {
                    return Redirect::back()->withErrors(['Login Field', 'check your information and try again ']);
                }
            }elseif($request->type=="teacher"){
                //dd(Auth::guard('teacher')->attempt(['school_email' => $request->email, 'password' => $request->password]));
                if (Auth::guard('teacher')->attempt(['email' => $request->email, 'password' => $request->password])) {
                    $details = Auth::guard('teacher')->user();
                    $user = $details;
                    //dd($user);
                    return redirect('/teacher/waiting/'.$request->game_id);
                } else {
                    return Redirect::back()->withErrors(['Login Field', 'check your information and try again ']);
                }
            }elseif($request->type=="student"){
                //dd($request);
                if (Auth::guard('student')->attempt(['email' => $request->email, 'password' => $request->password])|| Auth::guard('student')->attempt(['username' => $request->email, 'password' => $request->password])) {
                    //dd();
                    $details = Auth::guard('student')->user();
                    $user = $details;
                    //
                    //dd($user);
                    if ($game->type == 'hacking') {
                        return redirect('/student/choose_password/' . $request->game_id);
                    } else {
                        return redirect('/student/' . $request->game_id);
                    }
                } else {
                    return Redirect::back()->withErrors(['Login Field', 'check your information and try again ']);
                }
            }elseif($request->type=="supervisor"){
                //dd($request);
                if (Auth::guard('supervisor')->attempt(['mobile' => $request->email, 'password' => $request->password])) {
                    //dd();
                    $details = Auth::guard('supervisor')->user();
                    $user = $details;
                    //
                    //dd($user);
                    return redirect('/admin/home');
                } else {
                    return Redirect::back()->withErrors(['Login Field', 'check your information and try again ']);
                }
            }

            else{
                return Redirect::back()->withErrors(['Login Field', 'check your information and try again ']);

            }

        }
    }

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest')->except('logout');
    }
}
