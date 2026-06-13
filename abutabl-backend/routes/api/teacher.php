<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
// use App\Http\Controllers\Api\AuthApiController;
// use App\Http\Controllers\App\Http\Controllers\Api\AuthApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Route::middleware('auth:api')->get('/user', function (Request $request) {
//     return $request->user();
// });


// Route::group([ 'middleware' => ['users-api' , 'checkSecretApi' , 'changeLanguage'], 'namespace' => 'Api'], function () {
Route::group([ 'middleware' => ['api' , 'checkSecretApi' , 'changeLanguage'] , 'namespace' => 'Api'], function () {
   
    Route::post('/login', 'AuthApiController@login');

    // Route::post('/register', 'AuthApiController@register');
    // Route::post('/verification_code', 'AuthApiController@Verification');
    // Route::post('/ForgetPassword', 'AuthApiController@ForgetPassword');         
    
});



