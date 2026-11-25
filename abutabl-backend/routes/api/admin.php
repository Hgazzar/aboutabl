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

/**
 * Public Excel templates for admin "Download Template" (window.open — no auth headers).
 * Old admin builds request: /api/Questions Bank Template.xlsx
 */
Route::get('/Questions Bank Template.xlsx', function () {
    $path = public_path('Questions Bank Template.xlsx');
    abort_unless(is_file($path), 404, 'Questions Bank Template.xlsx missing in public/');

    return response()->file($path, [
        'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition' => 'attachment; filename="Questions Bank Template.xlsx"',
    ]);
});

Route::get('/Activities Questions Template.xlsx', function () {
    $path = public_path('Activities Questions Template.xlsx');
    abort_unless(is_file($path), 404, 'Activities Questions Template.xlsx missing in public/');

    return response()->file($path, [
        'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition' => 'attachment; filename="Activities Questions Template.xlsx"',
    ]);
});

foreach (
    [
        'Schools Template.xlsx',
        'Students Template.xlsx',
        'Employees Template.xlsx',
    ] as $templateName
) {
    Route::get('/'.$templateName, function () use ($templateName) {
        $path = public_path($templateName);
        abort_unless(is_file($path), 404, $templateName.' missing in public/');

        return response()->file($path, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$templateName.'"',
        ]);
    });
}

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
    Route::get('/dashboard/teacher/classes/{classId}/assignments', 'TeacherClassesController@assignments');
    Route::get('/dashboard/teacher/classes/{classId}/assignments/{assignmentId}', 'TeacherClassesController@assignmentShow');
    Route::post('/dashboard/teacher/classes/{classId}/assignments/{assignmentId}/remind-missing', 'TeacherClassesController@remindMissing');
    Route::get('/dashboard/teacher/classes/{classId}/students-overview', 'TeacherClassesController@studentsOverview');
    Route::get('/dashboard/teacher/classes/{classId}/students/{studentId}/profile', 'TeacherClassesController@studentProfile');
    Route::get('/dashboard/teacher/classes/{classId}/students/{studentId}/evaluations', 'TeacherEvaluationsController@index');
    Route::get('/dashboard/teacher/classes/{classId}/students/{studentId}/evaluations/latest', 'TeacherEvaluationsController@latest');
    Route::post('/dashboard/teacher/classes/{classId}/students/{studentId}/evaluations', 'TeacherEvaluationsController@store');
    Route::put('/dashboard/teacher/classes/{classId}/students/{studentId}/evaluations/{evaluationId}', 'TeacherEvaluationsController@update');
    Route::patch('/dashboard/teacher/classes/{classId}/students/{studentId}/evaluations/{evaluationId}', 'TeacherEvaluationsController@update');
    Route::delete('/dashboard/teacher/classes/{classId}/students/{studentId}/evaluations/{evaluationId}', 'TeacherEvaluationsController@destroy');
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
    Route::post('/quizes/status/{id}','QuizesController@status');
    Route::post('/quizes/list_fields/{id}','QuizesController@listFields');

        //// questions
    Route::post('/questions/fileImport','QuestionsController@fileImport');
    Route::post('/questions/fileImportUpdate','QuestionsController@fileImportUpdate');
    Route::get('/questions/export','QuestionsController@export');
    Route::get('/questions/list','QuestionsController@index');
    Route::post('/questions/store','QuestionsController@store');
    Route::put('/questions/update/{id}','QuestionsController@update');
    Route::get('/questions/show/{id}','QuestionsController@show');
    Route::post('/questions/delete','QuestionsController@destroy');

    Route::post('/quiz_workbook/preview', 'QuizWorkbookImportController@preview');
    Route::post('/quiz_workbook/commit', 'QuizWorkbookImportController@commit');


    ///// Assigns
    Route::get('/assigns/get_module_data','AssignsController@get_module_data');
    Route::get('/assigns/learning_activities/books','AssignsController@learningActivityBooks');
    Route::get('/assigns/learning_activities/sections','AssignsController@learningActivitySections');
    Route::get('/assigns/learning_activities/activities','AssignsController@learningActivityItems');
    Route::post('/assigns/store','AssignsController@store');
    Route::get('/assigns/list','AssignsController@index');
    Route::delete('/assigns/delete/{id}','AssignsController@destroy');
    Route::get('/assigns/{assignId}/rubric','AssignsController@showRubric');
    Route::put('/assigns/{assignId}/rubric','AssignsController@upsertRubric');
    Route::delete('/assigns/{assignId}/rubric','AssignsController@destroyRubric');
    Route::put('/assigns/{assignId}/possible_xp','AssignsController@updatePossibleXp');
    Route::put('/assigns/{assignId}/due_at','AssignsController@extendDueAt');
    Route::post('/assigns/{assignId}/reassign','AssignsController@reassign');
    Route::put('/assigns/{assignId}','AssignsController@update');
    Route::get('/assigns/{assignId}/learning_activities/review','AssignActivityTeacherController@review');
    Route::get('/assigns/{assignId}/my-work/{workId}/file','AssignActivityTeacherController@downloadMyWork');
    Route::post('/assigns/learning_activities/{assignActivityId}/manual_grade','AssignActivityTeacherController@manualGrade');
    Route::post('/assigns/{assignId}/students/{studentId}/finalize_parent','AssignActivityTeacherController@finalizeParent');
    Route::put('/assigns/{assignId}/students/{studentId}/grade','AssignActivityTeacherController@upsertGrade');
    Route::get('/assigns/{assignId}/students/{studentId}/grade','AssignActivityTeacherController@showGrade');
    Route::get('/assigns/{assignId}/materials','AssignmentMaterialController@index');
    Route::post('/assigns/{assignId}/materials','AssignmentMaterialController@store');
    Route::delete('/assigns/{assignId}/materials/{materialId}','AssignmentMaterialController@destroy');


       ///// file_maanger
    Route::post('/file_maanger/store','FileManagerController@store');
    Route::get('/file_maanger/list','FileManagerController@index');
    Route::get('/file_maanger/download/{id}','FileManagerController@download');
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
    Route::post('/notifications/mark_all_read','NotificationsController@mark_all_read');
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

    // LIVE-GAMES-DELIVERY-005: legacy Interactive Games admin APIs retired from active product.
    // Controllers and tables retained; routes unregistered so the product cannot be reached.

    // Teacher catalog (C.1), session create (C.2), lobby reads (C.3), Begin (C.5).
    // Flag on; not admin-only. Student Join remains on the student API.
    Route::group(['middleware' => ['ensureLiveCompetitionsEnabled']], function () {
        Route::get('/live-competitions/available', 'LiveCompetitionsTeacherController@available');
        Route::get('/live-competitions/sessions', 'LiveCompetitionsTeacherController@indexSessions');
        Route::post('/live-competitions/sessions', 'LiveCompetitionsTeacherController@storeSession');
        Route::get('/live-competitions/sessions/{id}', 'LiveCompetitionsTeacherController@showSession');
        Route::get('/live-competitions/sessions/{id}/students', 'LiveCompetitionsTeacherController@sessionStudents');
        Route::post('/live-competitions/sessions/{id}/begin', 'LiveCompetitionsTeacherController@beginSession');
        Route::post('/live-competitions/sessions/{id}/end', 'LiveCompetitionsTeacherController@endSession');
        Route::post('/live-competitions/sessions/{id}/cancel', 'LiveCompetitionsTeacherController@cancelLobbySession');
        Route::get('/live-competitions/sessions/{id}/host', 'LiveCompetitionsTeacherController@hostSession');
        Route::get(
            '/live-competitions/sessions/{id}/players/{studentId}/answers',
            'LiveCompetitionsTeacherController@playerAnswers'
        );
    });

    // Live Competitions catalog (Slice B). SCORM `games` table unchanged.
    Route::group(['middleware' => ['ensureLiveCompetitionsEnabled', 'ensureLiveCompetitionsAdminOnly']], function () {
        Route::get('/live-competitions', 'LiveCompetitionsAdminController@index');
        Route::get('/live-competitions/template', 'LiveCompetitionsAdminController@template');
        Route::post('/live-competitions/import/preview', 'LiveCompetitionsAdminController@preview');
        Route::post('/live-competitions/import/confirm', 'LiveCompetitionsAdminController@confirm');
        Route::get('/live-competitions/{id}', 'LiveCompetitionsAdminController@show');
        Route::post('/live-competitions/{id}/publish', 'LiveCompetitionsAdminController@publish');
        Route::post('/live-competitions/{id}/unpublish', 'LiveCompetitionsAdminController@unpublish');
        Route::get('/live-competitions/{id}/schools', 'LiveCompetitionsAdminController@schools');
        Route::put('/live-competitions/{id}/schools', 'LiveCompetitionsAdminController@updateSchools');
    });

});

// F-009D Sprint 1 — Quiz Runtime (teacher/admin). /api/quiz-runtime/*
// Separate group so namespace is not nested under Api\AdminControllers.
Route::group([
    'middleware' => ['api', 'checkSecretApi', 'changeLanguage', 'checkUserToken:admin-api'],
    'prefix' => 'quiz-runtime',
    'namespace' => 'Api\Admin\QuizRuntime',
], function () {
    // F-009D Sprint 2 — Teacher Runtime READ + Manual Grade + Regrade
    Route::get('/attempts', 'TeacherQuizRuntimeController@attempts');
    Route::get('/attempts/{attemptId}', 'TeacherQuizRuntimeController@attempt');
    Route::post('/attempts/{attemptId}/manual-grade', 'TeacherQuizRuntimeController@manualGrade');
    Route::post('/attempts/{attemptId}/regrade', 'TeacherQuizRuntimeController@regrade');
});
