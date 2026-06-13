<?php 
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\login\CustomAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PhonesController;
use App\Http\Controllers\LogController;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
// Route For Change Lang AR ,EN
Route::get('welcome/{locale}', function ($locale) {
    if (! in_array($locale, ['en', 'ar'])) {
        abort(400);
    }
    session::Put('locale', $locale);
    return redirect()->back();
});


Route::get('/proxy/{path}', function ($path) {
    $url = "https://test.poultrystore.net/" . $path;
    return file_get_contents($url);
})->where('path', '.*');

Route::get('/test', function () {
    return 'welcome';
});

    Route::get('/questions/export','Api\AdminControllers\QuestionsController@export');
