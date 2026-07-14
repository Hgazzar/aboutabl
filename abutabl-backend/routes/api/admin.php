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
Route::group([ 'middleware' => ['api' , 'checkSecretApi' , 'changeLanguage'] , 'namespace' => 'Api\AdminControllers'], function () {
   
    Route::post('/login', 'Auth\AuthApiController@login');
    Route::post('/forgetPassword', 'Auth\AuthApiController@ForgetPassword');
    Route::post('/verification_code', 'Auth\AuthApiController@Verification'); 
    Route::post('/setPassword', 'Auth\AuthApiController@setPassword');
});


Route::group([ 'middleware' => ['api' , 'checkSecretApi' , 'changeLanguage','checkUserToken:admin-api'] , 'namespace' => 'Api\AdminControllers'], function () {

    Route::get('/dashboard/stats', 'DashboardController@stats');
    Route::get('/dashboard/teacher-assignments', 'DashboardController@teacherAssignments');
    Route::get('/dashboard/teacher/overview', 'TeacherDashboardController@overview');
    Route::get('/dashboard/teacher/stats', 'TeacherDashboardController@stats');
    Route::get('/dashboard/teacher/alerts', 'TeacherDashboardController@alerts');
    Route::get('/dashboard/teacher/classes', 'TeacherClassesController@index');
    Route::get('/dashboard/teacher/classes/{classId}/overview', 'TeacherClassesController@overview');
    Route::get('/dashboard/teacher/classes/{classId}/standards', 'TeacherClassesController@standards');
    Route::get('/dashboard/teacher/classes/{classId}/activities-tasks', 'TeacherClassesController@activitiesTasks');
    Route::get('/dashboard/teacher/classes/{classId}/students-overview', 'TeacherClassesController@studentsOverview');
    Route::get('/dashboard/teacher/classes/{classId}/students/{studentId}/profile', 'TeacherClassesController@studentProfile');
    Route::get('/dashboard/teacher/classes/{classId}/alerts', 'TeacherClassesController@classAlerts');
    Route::post('/dashboard/teacher/classes/{classId}/alerts/dismiss', 'TeacherClassesController@dismissClassAlert');
    Route::post('/dashboard/teacher/classes/{classId}/alerts/reset-dismissals', 'TeacherClassesController@resetClassAlertDismissals');
    Route::delete('/dashboard/teacher/classes/{classId}/alerts/{alertKey}', 'TeacherClassesController@undoClassAlertDismiss')
        ->where('alertKey', '.*');
    
    ///roles
    Route::get('/roles/create','RolesController@create');
    Route::post('/roles/store','RolesController@store');
    Route::get('/roles/list','RolesController@index');
    Route::put('/roles/status/{id}','RolesController@status');
    Route::delete('/roles/delete/{id}','RolesController@destroy');
    Route::get('/roles/edit','RolesController@edit');
    Route::put('/roles/update/{id}','RolesController@update');
    Route::get('/permissions','RolesController@userPermissions');

    ///employees
    Route::post('/employees/store','EmployessController@store');
    Route::get('/employees/list','EmployessController@index');
    Route::get('/employees/show/{id}','EmployessController@show');
    Route::put('/employees/status/{id}','EmployessController@status');
    Route::post('/employees/delete/{id}','EmployessController@destroy');
    Route::put('/employees/update/{id}','EmployessController@update');
    Route::post('/employees/assign_grade/{id}','EmployessController@assign_grade');
    Route::get('/employees/subjects/{id}','EmployessController@Subjects');
    Route::get('/employees/grades/{id}','EmployessController@Grades');
    Route::get('/employees/assigning/{id}','EmployessController@assigning');
    
    Route::get('/employees/export','EmployessController@export');
    Route::post('/employees/fileImport','EmployessController@fileImport');


     ///admin
    Route::post('/admin/store','AdminsController@store');
    Route::get('/admin/list','AdminsController@index');
    Route::get('/admin/show/{id}','AdminsController@show');
    Route::put('/admin/status/{id}','AdminsController@status');
    Route::delete('/admin/delete/{id}','AdminsController@destroy');
    Route::put('/admin/update/{id}','AdminsController@update');
    Route::put('/admin/assign_schools/{id}','AdminsController@assign_schools');

    //school
    Route::get('/school/get','SchoolsController@getUserSchool');
    Route::post('/school/set','SchoolsController@SetUserSchool');
    Route::post('/school/store','SchoolsController@store');
    Route::post('/school/update/{id}','SchoolsController@update');
    Route::get('/school/list','SchoolsController@index');
    Route::put('/school/status/{id}','SchoolsController@status');
    Route::delete('/school/delete/{id}','SchoolsController@destroy');
    Route::get('/school/show/{id}','SchoolsController@show');
    Route::post('/school/assign_subject/{id}','SchoolsController@assignSubject');
    // Route::get('/employees/export','SchoolsController@export');
    Route::post('/school/fileImport','SchoolsController@fileImport');

    ///subject
    Route::get('/subject/list','SubjectsController@index');
    Route::get('/subject/grades/{id}','SubjectsController@subjectGrades');
    Route::get('/subject/teachers/{id}','SubjectsController@subjectTeachers');
    Route::get('/subject/units/{id}','SubjectsController@subjectUnits');
    Route::get('/subject/show/{id}','SubjectsController@show');
    Route::get('/subject/students/{id}','SubjectsController@SubjectStudents');
    Route::post('/subject/store','SubjectsController@store');
    Route::post('/subject/update/{id}','SubjectsController@update');
    Route::put('/subject/assignGrade/{id}','SubjectsController@assignGrade');
    Route::post('/subject/assignTeacher','SubjectsController@assignTeacher');
    Route::put('/subject/updateAssignTeacher/{id}','SubjectsController@updateAssignTeacher');
    Route::delete('/subject/deleteAssignTeacher/{id}','SubjectsController@deleteAssignTeacher');
    Route::put('/subject/status/{id}','SubjectsController@status');
    Route::post('/subject/delete/{id}','SubjectsController@destroy');
    Route::post('/assignsSchools/delete','SubjectsController@destroyAssignsSchools');

    ///Grades 
    Route::post('/grade/store','GradesController@store');
    Route::get('/grade/list','GradesController@index');
    Route::get('/grade/show/{id}','GradesController@show');
    Route::put('/grade/status/{id}','GradesController@status');
    Route::post('/grade/delete/{id}','GradesController@destroy');
    Route::put('/grade/update/{id}','GradesController@update');

    ///Classes
    Route::post('/class/store','ClassesController@store');
    Route::get('/class/list','ClassesController@index');
    Route::get('/class/show/{id?}','ClassesController@show');
    Route::put('/class/status/{id}','ClassesController@status');
    Route::delete('/class/delete/{id}','ClassesController@destroy');
    Route::put('/class/update/{id}','ClassesController@update');

    //govern
    Route::get('/govern/list','GovernsController@index');

   //cities
    Route::get('/city/list','CitiesController@index');

    //jobs
    Route::get('/jobs/list','JobsController@index');
   
       ///students
    Route::post('/students/store','StudentsController@store');
    Route::get('/students/list','StudentsController@index');
    Route::get('/students/show/{id}','StudentsController@show');
    Route::put('/students/status/{id}','StudentsController@status');
    Route::delete('/students/delete/{id}','StudentsController@destroy');
    Route::put('/students/update/{id}','StudentsController@update');
    Route::get('/students/todo/{id}','StudentsController@todo');
    Route::get('/students/export','StudentsController@export');
    Route::post('/students/fileImport','StudentsController@fileImport');


     //profile
    Route::get('/profile','ProfileController@prfile');
    Route::put('/profile','ProfileController@update');
    Route::post('/profile/update','ProfileController@update');

    //units
    Route::post('/units/store','UnitsController@store');
    Route::put('/units/update/{id}','UnitsController@update');
    Route::put('/units/assign_students/{id}','UnitsController@assign_students');
    // Route::get('/school/list','SchoolsController@index');
    Route::put('/units/status_type/{id}','UnitsController@type');
    Route::put('/units/status/{id}','UnitsController@status');
    Route::delete('/units/delete/{id}','UnitsController@destroy');
    Route::get('/units/show/{id}','UnitsController@show');


      //lessons
    Route::post('/lessons/store','LessonsController@store');
    Route::put('/lessons/update/{id}','LessonsController@update');
    Route::put('/lessons/status/{id}','LessonsController@status');
    Route::delete('/lessons/delete/{id}','LessonsController@destroy');
    Route::get('/lessons/show/{id}','LessonsController@show');
   
     ////// lessons contents
    Route::get('/contents/scorm-directories','LessonscContentsController@listScormDirectories');
    Route::post('/contents/store','LessonscContentsController@store');
    Route::post('/contents/update/{id}','LessonscContentsController@update');
    Route::delete('/contents/delete/{id}','LessonscContentsController@destroy');
    Route::get('/contents/show/{id}','LessonscContentsController@show');

    /////////resources
   Route::post('/resources/store','ResourcesController@store');

    /////////libraries
   Route::get('/libraries/get','LibrariesController@index');

      //Games
    Route::post('/games/store','GamesController@store');
    Route::get('/games/list','GamesController@index');
    Route::get('/games/show/{id}','GamesController@show');
    Route::delete('/games/delete/{id}','GamesController@destroy');
    Route::post('/games/update/{id}','GamesController@update');

      //tickets
    Route::post('/tickets/store','TicketsController@store');
    Route::get('/tickets/list','TicketsController@index');
    Route::get('/tickets/show/{id}','TicketsController@show');
    Route::put('/tickets/close/{id}','TicketsController@close');
    Route::post('/tickets/add_reply/{id}','TicketsController@addReply');
    
       //quizes
    Route::post('/quizes/store','QuizesController@store');
    Route::get('/quizes/list','QuizesController@index');
    Route::get('/quizes/show/{id}','QuizesController@show');
    Route::post('/quizes/assignQuestion/{id}','QuizesController@assignQuestion');
    Route::delete('/quizes/delete/{id}','QuizesController@destroy');
    Route::post('/quizes/update/{id}','QuizesController@update');

        //// questions
    Route::post('/questions/fileImport','QuestionsController@fileImport');
    Route::post('/questions/fileImportUpdate','QuestionsController@fileImportUpdate');
    Route::get('/questions/export','QuestionsController@export');
    Route::get('/questions/list','QuestionsController@index');
    Route::post('/questions/store','QuestionsController@store');
    Route::put('/questions/update/{id}','QuestionsController@update');
    Route::get('/questions/show/{id}','QuestionsController@show');
    Route::post('/questions/delete','QuestionsController@destroy');


    ///// Assigns
    Route::get('/assigns/get_module_data','AssignsController@get_module_data');
    Route::post('/assigns/store','AssignsController@store');
    Route::get('/assigns/list','AssignsController@index');
    Route::delete('/assigns/delete/{id}','AssignsController@destroy');


       ///// file_maanger
    Route::post('/file_maanger/store','FileManagerController@store');
    Route::get('/file_maanger/list','FileManagerController@index');
    Route::delete('/file_maanger/delete/{id}','FileManagerController@destroy');


      //quizes
    Route::post('/worksheets/store','WorkSheetsController@store');
    Route::get('/worksheets/list','WorkSheetsController@index');
    Route::get('/worksheets/show/{id}','WorkSheetsController@show');
    Route::delete('/worksheets/delete/{id}','WorkSheetsController@destroy');
    Route::post('/worksheets/update/{id}','WorkSheetsController@update');
    

       ////NOTIFICATION
    Route::get('/notifications/list','NotificationsController@index');
    Route::post('/notifications/update_read/{id}','NotificationsController@update');
    Route::delete('/notifications/delete_all','NotificationsController@delete_all');
    
    //Subject Activity
    Route::get('/subject_activities/list/{type}','SubjectActivitiesController@index');
    Route::post('/subject_activities/store','SubjectActivitiesController@store');
    Route::post('/subject_activities/update/{id}','SubjectActivitiesController@update');
    Route::post('/subject_activities/change_status/{id}','SubjectActivitiesController@change_status');
    Route::post('/subject_activities/delete/{id}','SubjectActivitiesController@destroy');
    Route::get('/subject_activities/show/{id}','SubjectActivitiesController@show');
    
    //Activity Lesson
    Route::get('/activity_lessons/list','ActivityLessonsController@index');
    Route::post('/activity_lessons/store','ActivityLessonsController@store');
    Route::post('/activity_lessons/update/{id}','ActivityLessonsController@update');
    Route::post('/activity_lessons/change_status/{id}','ActivityLessonsController@change_status');
    Route::post('/activity_lessons/delete/{id}','ActivityLessonsController@destroy');
    Route::get('/activity_lessons/show/{id}','ActivityLessonsController@show');
    Route::post('/activity_lessons/fileImport','ActivityLessonsController@fileImport');

    // Interactive games (live classroom games; separate from SCORM `games` table)
    Route::group(['middleware' => ['ensureInteractiveGamesEnabled']], function () {
        Route::get('/interactive-games', 'InteractiveGamesAdminController@index');
        Route::get('/interactive-games/{id}', 'InteractiveGamesAdminController@show');
        Route::post('/interactive-games/{id}/start', 'InteractiveGamesAdminController@startRound');
        Route::get('/interactive-games/{id}/facts', 'InteractiveGamesAdminController@facts');
        Route::get('/interactive-games/{id}/students/{studentId}/answers', 'InteractiveGamesAdminController@studentAnswers');
    });

});
