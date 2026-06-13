<?php

use Illuminate\Support\Facades\Route;

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

\Illuminate\Support\Facades\Broadcast::routes(['middleware' => ['auth:web,teacher,student']]);

Route::get('login', [\App\Http\Controllers\Auth\LoginController::class, 'showLoginForm'])->name('login');
Route::post('login', [\App\Http\Controllers\Auth\LoginController::class, 'login'])->name('auth.login');
//Route::get('login', 'Auth\LoginController@showLoginForm');
//Route::post('login', 'Auth\LoginController@login')->name('auth.login');

Route::get('/teacher/games/index', [App\Http\Controllers\HomeController::class, 'index']);
Route::get('/student/games/index', [App\Http\Controllers\StudentController::class, 'index']);
//Route::get('/teacher/{game_id}', [App\Http\Controllers\HomeController::class, 'teacher_index']);
Route::get('/teacher/waiting/{game_id}', [App\Http\Controllers\HomeController::class, 'teacher_waiting']);
Route::get('/teacher/statistics-list/{game_id}', [App\Http\Controllers\HomeController::class, 'teacher_statistics_list']);
Route::get('/teacher/facts/{game_id}', [App\Http\Controllers\HomeController::class, 'teacher_facts']);
Route::get('/teacher/student_detail/{student_id}/{game_id}', [App\Http\Controllers\HomeController::class, 'student_answerList']);

Route::get('/student/{game_id}', [App\Http\Controllers\StudentController::class, 'student_index']);
Route::get('/student/startTimer/{game_id}', [App\Http\Controllers\StudentController::class, 'startTimer']);
Route::get('/student/question/{game_id}', [App\Http\Controllers\StudentController::class, 'student_question']);
Route::get('/student/facts/{game_id}', [App\Http\Controllers\StudentController::class, 'student_facts']);
Route::get('/student/answer-list/{game_id}', [App\Http\Controllers\StudentController::class, 'student_answerList']);
Route::post('/student/answer-question', [App\Http\Controllers\StudentController::class, 'answer_question'])->name('answer.question');

Route::get('/student/choose_password/{game_id}', [App\Http\Controllers\StudentController::class, 'choose_password']);
Route::get('/student/save_password/{game_id}/{password}', [App\Http\Controllers\StudentController::class, 'student_save_password']);
Route::get('/student/gifts/show/{game_id}', [App\Http\Controllers\StudentController::class, 'show_gifts']);
Route::post('/student/gift/save', [App\Http\Controllers\StudentController::class, 'save_gift']);
Route::post('/student/password_hacking/save', [App\Http\Controllers\StudentController::class, 'save_password_hacking']);
Route::get('/student/password_hacking/show/{game_id}', [App\Http\Controllers\StudentController::class, 'show_password_hacking']);

//Auth::routes();

Route::get('/', function () {
    return view('welcome');
});

Route::get('/gifts', function () {
    return view('student.hacking.gifts');
});
Route::get('/hacking', function () {
    return view('student.hacking');
});
