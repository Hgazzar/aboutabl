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
Route::group([ 'middleware' => ['api' , 'checkSecretApi' , 'changeLanguage'] , 'namespace' => 'Api\StudentControllers'], function () {
   
    Route::post('/login', 'Auth\AuthApiController@login');
    Route::post('/register', 'Auth\AuthApiController@register');
    Route::post('/verification_code', 'Auth\AuthApiController@Verification');
    Route::post('/forgetPassword', 'Auth\AuthApiController@ForgetPassword');  
    Route::post('/setPassword', 'Auth\AuthApiController@setPassword');

    // Public landing Contact Us → info@aboutabl.com (no student token).
    Route::post('/contact', 'ContactController@store');
       
    
});

Route::group([ 'middleware' => ['api' , 'checkSecretApi' , 'changeLanguage','checkStudentToken:user-api'] , 'namespace' => 'Api\StudentControllers'], function () {
    
    ///Subjects
    Route::get('/getSubjects','SubjectController@index');
    Route::get('/certificates','SubjectController@earnedCertificates');
    Route::get('/viewSubject/{id}','SubjectController@show');
    Route::get('/subjects/{id}/certificate','SubjectController@certificatePreview');
    Route::get('/quizesList/{id}','SubjectController@quizesList');
    Route::get('/subjectUnits/{id}','SubjectController@subjectUnits');
    Route::get('/subjectGames/{id}','SubjectController@subjectGames');
    Route::get('/lessons/show/{id}','SubjectController@lessonView');
    // F-030 — Canonical lesson content completion (F-029a contract).
    Route::post('/lesson-contents/{contentId}/complete','LessonContentCompletionController@complete');
    Route::get('/games/show/{id}','SubjectController@gamesView');
    Route::get('/quizes/show/{id}','SubjectController@quizesView');


    ///Tickets
    Route::post('/tickets/create','TicketController@store');

    ///Profile
    Route::get('/profile','Auth\AuthApiController@getProfile');
    Route::get('/navbar','StudentNavbarController@index');
    Route::get('/search','StudentSearchController@index');
    Route::get('/dashboard','StudentDashboardController@index');
    Route::get('/leaderboard','StudentLeaderboardController@index');
    Route::get('/streak/calendar','StudentStreakCalendarController@index');
    Route::get('/friends','StudentFriendsController@index');
    Route::post('/friends/invite','StudentFriendsController@invite');
    Route::post('/friends/{id}/accept','StudentFriendsController@accept');
    Route::delete('/friends/{id}','StudentFriendsController@destroy');
    Route::get('/achievements','StudentAchievementsController@index');
    Route::get('/my-progress','StudentMyProgressController@index');
    Route::get('/progress','SubjectController@getProgressOverview');
    Route::post('/changePassword','Auth\AuthApiController@updatePassword');
    Route::post('/editProfile','Auth\AuthApiController@editProfile');
    Route::post('/avatar/select','Auth\AuthApiController@selectAvatar');
  	///Auth
    Route::post('/logout','Auth\AuthApiController@logout');


    ////todo
    Route::get('/todaoList','SubjectController@TodoList');
    Route::post('/todo/markOpened','SubjectController@markTodoOpened');

    // Multi-activity assignment detail + per-activity submit (student scope).
    Route::get('/assigns/{assignId}/learning_activities','AssignActivityStudentController@show');
    Route::post('/assigns/{assignId}/submit','AssignActivityStudentController@submitAssignment');
    Route::post('/assigns/{assignId}/redo','AssignActivityStudentController@redoAssignment');
    Route::get('/assign-activities/{assignActivityId}','AssignActivityStudentController@activityShow');
    Route::post('/assign-activities/{assignActivityId}/submit','AssignActivityStudentController@submit');
    Route::post('/assign-activities/{assignActivityId}/redo','AssignActivityStudentController@redoActivity');

    // Student My Work (optional image/document/voice — independent of parent submit).
    Route::get('/assigns/{assignId}/my-work','AssignmentStudentWorkController@index');
    Route::post('/assigns/{assignId}/my-work','AssignmentStudentWorkController@store');
    Route::delete('/assigns/{assignId}/my-work/{workId}','AssignmentStudentWorkController@destroy');
    Route::get('/assigns/{assignId}/my-work/{workId}/file','AssignmentStudentWorkController@download');


       ////NOTIFICATION
    Route::get('/notifications/list','NotificationsController@index');
    Route::post('/notifications/update_read/{id}','NotificationsController@update');
    Route::post('/notifications/mark_all_read','NotificationsController@mark_all_read');
    Route::delete('/notifications/delete_all','NotificationsController@delete_all');

    Route::group(['middleware' => ['ensureLiveCompetitionsEnabled']], function () {
        Route::get('/live-competitions/invitations', 'LiveCompetitionsStudentController@invitations');
        Route::post('/live-competitions/sessions/{id}/join', 'LiveCompetitionsStudentController@join');
        Route::get('/live-competitions/sessions/{id}/preview', 'LiveCompetitionsStudentController@preview');
        Route::get('/live-competitions/sessions/{id}/current', 'LiveCompetitionsStudentController@current');
        Route::post('/live-competitions/sessions/{id}/start-question-clock', 'LiveCompetitionsStudentController@startQuestionClock');
        Route::post('/live-competitions/sessions/{id}/answers', 'LiveCompetitionsStudentController@answer');
        Route::post('/live-competitions/sessions/{id}/timeout', 'LiveCompetitionsStudentController@timeout');
        Route::post('/live-competitions/sessions/{id}/reinforce', 'LiveCompetitionsStudentController@reinforce');
        Route::post('/live-competitions/sessions/{id}/claim-reward', 'LiveCompetitionsStudentController@claimReward');
        Route::post('/live-competitions/sessions/{id}/use-power', 'LiveCompetitionsStudentController@usePower');
        Route::post('/live-competitions/sessions/{id}/pick-password', 'LiveCompetitionsStudentController@pickPassword');
    });

    // LIVE-GAMES-DELIVERY-005: legacy Interactive Games student APIs retired from active product.
    // Controllers and tables retained; routes unregistered so the product cannot be reached.

});

// F-009D Sprint 1 — Quiz Runtime (student). /api/student/quiz-runtime/*
// Separate group so namespace is not nested under Api\StudentControllers.
Route::group([
    'middleware' => ['api', 'checkSecretApi', 'changeLanguage', 'checkStudentToken:user-api'],
    'prefix' => 'quiz-runtime',
    'namespace' => 'Api\Student\QuizRuntime',
], function () {
    // F-009D Sprint 1 — Start / Resume / Save / Submit
    // Finalize is internal (Submit → Auto Grade → Finalize when ready).
    Route::post('/attempts', 'StudentQuizRuntimeController@start');
    Route::get('/attempts/active', 'StudentQuizRuntimeController@resume');
    Route::put('/attempts/{attemptId}/answers', 'StudentQuizRuntimeController@save');
    Route::patch('/attempts/{attemptId}/answers', 'StudentQuizRuntimeController@save');
    Route::post('/attempts/{attemptId}/submit', 'StudentQuizRuntimeController@submit');
    // F-009E Step 3 — Post-submission Review (frozen Version/Snapshot only).
    Route::get('/attempts/{attemptId}/review', 'StudentQuizRuntimeController@review');
    // F-009F — Student attempt latest / history (summary only).
    Route::get('/attempts/latest', 'StudentQuizRuntimeController@latest');
    Route::get('/attempts/history', 'StudentQuizRuntimeController@history');
});



