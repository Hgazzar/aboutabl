<?php

namespace App\Http\Controllers\login;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Hash;
use Session;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
class CustomAuthController extends Controller
{
    public function index()
    {
        if (Auth::check())
        {
            toastr(__('main.UserLoginSuccess'),'success');
            return view('pages.home');
        }
        return view('pages.auth.login');
    }  
      
    public function PostLogin(Request $request)
    {
        // dd($request->all());

        $request->validate([
            'email' => 'required',
            'password' => 'required',
        ]);
        $credentials = $request->only('email', 'password');
        if (Auth::attempt($credentials)) {
            toastr()->success(__('main.UserLoginSuccess'));
            return redirect()->intended('home');
        }
        Session::flash('error',  __('main.HaveMistakeIndata')); 
        return redirect("/");
    }

    
    public function signOut() {
        Session::flush();
        Auth::logout();
  
        return Redirect('/');
    }
}
