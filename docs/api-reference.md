# API Reference

> Complete REST API catalog for `abutabl-backend`.  
> Route files: `routes/api/admin.php`, `routes/api/student.php`, `routes/web.php`, `routes/channels.php`.

---

## Route Registration

Defined in `app/Providers/RouteServiceProvider.php`:

| URL Prefix | Route File | Audience | ~Routes |
|------------|-----------|----------|---------|
| `/api` | `routes/api/admin.php` | Admin/teacher SPA | 168 |
| `/api/student` | `routes/api/student.php` | Student portal | 43 |
| `/api/teacher` | `routes/api/teacher.php` | Legacy — login only | 7 |
| `/api/user` | `routes/api/api.php` | Legacy — login only | 7 |

> **Important:** Admin endpoints live at `/api/*`, **not** `/api/admin/*`.

---

## Request Contract (Mandatory)

### Headers

| Header | Value | Required | Notes |
|--------|-------|----------|-------|
| `apiSecret` | Matches `API_SECRET` in backend `.env` | **All routes** | Validated by `CheckSecretApi` middleware |
| `Authorizations` | `Bearer <JWT>` | Protected routes | **With an "s"** — not `Authorization` |
| `lang` | `ar` | Optional | Sets Arabic locale; default English |
| `Accept-Language` | `en` / `ar` | Optional | Used by student frontend |

### The `Authorizations` Header Rule

```
✅ CORRECT:  Authorizations: Bearer eyJhbGciOiJIUzI1NiIs...
❌ WRONG:    Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

This is **intentional** — a workaround for Apache/cPanel environments. Both frontends and the backend expect `Authorizations`. CORS exposes this header name. Do not "fix" to standard `Authorization` without coordinated backend + both frontend changes.

**Backend acceptance:** Middleware reads `Authorizations` header; `public/index.php` may also normalize Apache-stripped headers.

### JWT Guards

| Guard | Middleware | Model | Route prefix |
|-------|-----------|-------|--------------|
| `admin-api` | `checkUserToken:admin-api` | `App\Models\User` | `/api/*` (protected) |
| `user-api` | `checkStudentToken:user-api` | `App\Models\Student` | `/api/student/*` (protected) |

### Global Middleware Stack

All API routes receive (in order):

1. `api` — throttle 120 requests/minute
2. `checkSecretApi` — validates `apiSecret` header
3. `changeLanguage` — reads `lang` header
4. JWT middleware (protected routes only)
5. `can:*` Spatie permissions (many admin routes)
6. `ensureInteractiveGamesEnabled` (interactive game routes)

### Response Format

Via `app/Traits/GeneralTrait.php`:

```json
{
  "status": true,
  "errNum": "S000",
  "msg": "Success message",
  "data_key": {}
}
```

Dynamic `data_key` name varies per endpoint (e.g. `data`, `user`, `subjects`).

---

## Admin API — `/api/*`

Namespace: `App\Http\Controllers\Api\AdminControllers`

### Public (no JWT)

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/login` | `Auth\AuthApiController@login` |
| POST | `/api/forgetPassword` | `Auth\AuthApiController@ForgetPassword` |
| POST | `/api/verification_code` | `Auth\AuthApiController@Verification` |
| POST | `/api/setPassword` | `Auth\AuthApiController@setPassword` |

**Login note:** Falls back to student credentials; may return `portal: "student"` for SSO redirect.

### Protected (JWT `admin-api`)

#### Dashboard

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/dashboard/stats` | `DashboardController@stats` |
| GET | `/api/dashboard/teacher-assignments` | `DashboardController@teacherAssignments` |

#### Roles & Permissions

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/roles/create` | `RolesController@create` |
| POST | `/api/roles/store` | `RolesController@store` |
| GET | `/api/roles/list` | `RolesController@index` |
| PUT | `/api/roles/status/{id}` | `RolesController@status` |
| DELETE | `/api/roles/delete/{id}` | `RolesController@destroy` |
| GET | `/api/roles/edit` | `RolesController@edit` |
| PUT | `/api/roles/update/{id}` | `RolesController@update` |
| GET | `/api/permissions` | `RolesController@userPermissions` |

#### Employees (Teachers)

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/employees/store` | `EmployessController@store` |
| GET | `/api/employees/list` | `EmployessController@index` |
| GET | `/api/employees/show/{id}` | `EmployessController@show` |
| PUT | `/api/employees/status/{id}` | `EmployessController@status` |
| POST | `/api/employees/delete/{id}` | `EmployessController@destroy` |
| PUT | `/api/employees/update/{id}` | `EmployessController@update` |
| POST | `/api/employees/assign_grade/{id}` | `EmployessController@assign_grade` |
| GET | `/api/employees/subjects/{id}` | `EmployessController@Subjects` |
| GET | `/api/employees/grades/{id}` | `EmployessController@Grades` |
| GET | `/api/employees/assigning/{id}` | `EmployessController@assigning` |
| GET | `/api/employees/export` | `EmployessController@export` |
| POST | `/api/employees/fileImport` | `EmployessController@fileImport` |

#### Admins

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/admin/store` | `AdminsController@store` |
| GET | `/api/admin/list` | `AdminsController@index` |
| GET | `/api/admin/show/{id}` | `AdminsController@show` |
| PUT | `/api/admin/status/{id}` | `AdminsController@status` |
| DELETE | `/api/admin/delete/{id}` | `AdminsController@destroy` |
| PUT | `/api/admin/update/{id}` | `AdminsController@update` |
| PUT | `/api/admin/assign_schools/{id}` | `AdminsController@assign_schools` |

#### Schools

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/school/get` | `SchoolsController@getUserSchool` |
| POST | `/api/school/set` | `SchoolsController@SetUserSchool` |
| POST | `/api/school/store` | `SchoolsController@store` |
| POST | `/api/school/update/{id}` | `SchoolsController@update` |
| GET | `/api/school/list` | `SchoolsController@index` |
| PUT | `/api/school/status/{id}` | `SchoolsController@status` |
| DELETE | `/api/school/delete/{id}` | `SchoolsController@destroy` |
| GET | `/api/school/show/{id}` | `SchoolsController@show` |
| POST | `/api/school/assign_subject/{id}` | `SchoolsController@assignSubject` |
| POST | `/api/school/fileImport` | `SchoolsController@fileImport` |

#### Subjects

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/subject/list` | `SubjectsController@index` |
| GET | `/api/subject/grades/{id}` | `SubjectsController@subjectGrades` |
| GET | `/api/subject/teachers/{id}` | `SubjectsController@subjectTeachers` |
| GET | `/api/subject/units/{id}` | `SubjectsController@subjectUnits` |
| GET | `/api/subject/show/{id}` | `SubjectsController@show` |
| GET | `/api/subject/students/{id}` | `SubjectsController@SubjectStudents` |
| POST | `/api/subject/store` | `SubjectsController@store` |
| POST | `/api/subject/update/{id}` | `SubjectsController@update` |
| PUT | `/api/subject/assignGrade/{id}` | `SubjectsController@assignGrade` |
| POST | `/api/subject/assignTeacher` | `SubjectsController@assignTeacher` |
| PUT | `/api/subject/updateAssignTeacher/{id}` | `SubjectsController@updateAssignTeacher` |
| DELETE | `/api/subject/deleteAssignTeacher/{id}` | `SubjectsController@deleteAssignTeacher` |
| PUT | `/api/subject/status/{id}` | `SubjectsController@status` |
| POST | `/api/subject/delete/{id}` | `SubjectsController@destroy` |
| POST | `/api/assignsSchools/delete` | `SubjectsController@destroyAssignsSchools` |

#### Grades & Classes

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/grade/store` | `GradesController@store` |
| GET | `/api/grade/list` | `GradesController@index` |
| GET | `/api/grade/show/{id}` | `GradesController@show` |
| PUT | `/api/grade/status/{id}` | `GradesController@status` |
| POST | `/api/grade/delete/{id}` | `GradesController@destroy` |
| PUT | `/api/grade/update/{id}` | `GradesController@update` |
| POST | `/api/class/store` | `ClassesController@store` |
| GET | `/api/class/list` | `ClassesController@index` |
| GET | `/api/class/show/{id?}` | `ClassesController@show` |
| PUT | `/api/class/status/{id}` | `ClassesController@status` |
| DELETE | `/api/class/delete/{id}` | `ClassesController@destroy` |
| PUT | `/api/class/update/{id}` | `ClassesController@update` |

#### Lookups

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/govern/list` | `GovernsController@index` |
| GET | `/api/city/list` | `CitiesController@index` |
| GET | `/api/jobs/list` | `JobsController@index` |

#### Students

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/students/store` | `StudentsController@store` |
| GET | `/api/students/list` | `StudentsController@index` |
| GET | `/api/students/show/{id}` | `StudentsController@show` |
| PUT | `/api/students/status/{id}` | `StudentsController@status` |
| DELETE | `/api/students/delete/{id}` | `StudentsController@destroy` |
| PUT | `/api/students/update/{id}` | `StudentsController@update` |
| GET | `/api/students/todo/{id}` | `StudentsController@todo` |
| GET | `/api/students/export` | `StudentsController@export` |
| POST | `/api/students/fileImport` | `StudentsController@fileImport` |

#### Profile

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/profile` | `ProfileController@prfile` |
| PUT | `/api/profile` | `ProfileController@update` |
| POST | `/api/profile/update` | `ProfileController@update` |

#### Units

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/units/store` | `UnitsController@store` |
| PUT | `/api/units/update/{id}` | `UnitsController@update` |
| PUT | `/api/units/assign_students/{id}` | `UnitsController@assign_students` |
| PUT | `/api/units/status_type/{id}` | `UnitsController@type` |
| PUT | `/api/units/status/{id}` | `UnitsController@status` |
| DELETE | `/api/units/delete/{id}` | `UnitsController@destroy` |
| GET | `/api/units/show/{id}` | `UnitsController@show` |

#### Lessons

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/lessons/store` | `LessonsController@store` |
| PUT | `/api/lessons/update/{id}` | `LessonsController@update` |
| PUT | `/api/lessons/status/{id}` | `LessonsController@status` |
| DELETE | `/api/lessons/delete/{id}` | `LessonsController@destroy` |
| GET | `/api/lessons/show/{id}` | `LessonsController@show` |

#### Lesson Contents (SCORM)

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/contents/scorm-directories` | `LessonscContentsController@listScormDirectories` |
| POST | `/api/contents/store` | `LessonscContentsController@store` |
| POST | `/api/contents/update/{id}` | `LessonscContentsController@update` |
| DELETE | `/api/contents/delete/{id}` | `LessonscContentsController@destroy` |
| GET | `/api/contents/show/{id}` | `LessonscContentsController@show` |

#### Resources & Libraries

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/resources/store` | `ResourcesController@store` |
| GET | `/api/libraries/get` | `LibrariesController@index` |

#### SCORM Games

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/games/store` | `GamesController@store` |
| GET | `/api/games/list` | `GamesController@index` |
| GET | `/api/games/show/{id}` | `GamesController@show` |
| DELETE | `/api/games/delete/{id}` | `GamesController@destroy` |
| POST | `/api/games/update/{id}` | `GamesController@update` |

#### Tickets

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/tickets/store` | `TicketsController@store` |
| GET | `/api/tickets/list` | `TicketsController@index` |
| GET | `/api/tickets/show/{id}` | `TicketsController@show` |
| PUT | `/api/tickets/close/{id}` | `TicketsController@close` |
| POST | `/api/tickets/add_reply/{id}` | `TicketsController@addReply` |

#### Quizzes

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/quizes/store` | `QuizesController@store` |
| GET | `/api/quizes/list` | `QuizesController@index` |
| GET | `/api/quizes/show/{id}` | `QuizesController@show` |
| POST | `/api/quizes/assignQuestion/{id}` | `QuizesController@assignQuestion` |
| DELETE | `/api/quizes/delete/{id}` | `QuizesController@destroy` |
| POST | `/api/quizes/update/{id}` | `QuizesController@update` |

#### Questions (Question Bank)

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/questions/fileImport` | `QuestionsController@fileImport` |
| POST | `/api/questions/fileImportUpdate` | `QuestionsController@fileImportUpdate` |
| GET | `/api/questions/export` | `QuestionsController@export` |
| GET | `/api/questions/list` | `QuestionsController@index` |
| POST | `/api/questions/store` | `QuestionsController@store` |
| PUT | `/api/questions/update/{id}` | `QuestionsController@update` |
| GET | `/api/questions/show/{id}` | `QuestionsController@show` |
| POST | `/api/questions/delete` | `QuestionsController@destroy` |

#### Assignments

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/assigns/get_module_data` | `AssignsController@get_module_data` |
| POST | `/api/assigns/store` | `AssignsController@store` |
| GET | `/api/assigns/list` | `AssignsController@index` |
| DELETE | `/api/assigns/delete/{id}` | `AssignsController@destroy` |

#### File Manager

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/file_maanger/store` | `FileManagerController@store` |
| GET | `/api/file_maanger/list` | `FileManagerController@index` |
| DELETE | `/api/file_maanger/delete/{id}` | `FileManagerController@destroy` |

> **Legacy typo:** `file_maanger` (missing "n") — preserve until coordinated rename.

#### Worksheets

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/worksheets/store` | `WorkSheetsController@store` |
| GET | `/api/worksheets/list` | `WorkSheetsController@index` |
| GET | `/api/worksheets/show/{id}` | `WorkSheetsController@show` |
| DELETE | `/api/worksheets/delete/{id}` | `WorkSheetsController@destroy` |
| POST | `/api/worksheets/update/{id}` | `WorkSheetsController@update` |

#### Notifications

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/notifications/list` | `NotificationsController@index` |
| POST | `/api/notifications/update_read/{id}` | `NotificationsController@update` |
| DELETE | `/api/notifications/delete_all` | `NotificationsController@delete_all` |

#### Subject Activities

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/subject_activities/list/{type}` | `SubjectActivitiesController@index` |
| POST | `/api/subject_activities/store` | `SubjectActivitiesController@store` |
| POST | `/api/subject_activities/update/{id}` | `SubjectActivitiesController@update` |
| POST | `/api/subject_activities/change_status/{id}` | `SubjectActivitiesController@change_status` |
| POST | `/api/subject_activities/delete/{id}` | `SubjectActivitiesController@destroy` |
| GET | `/api/subject_activities/show/{id}` | `SubjectActivitiesController@show` |

#### Activity Lessons

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/activity_lessons/list` | `ActivityLessonsController@index` |
| POST | `/api/activity_lessons/store` | `ActivityLessonsController@store` |
| POST | `/api/activity_lessons/update/{id}` | `ActivityLessonsController@update` |
| POST | `/api/activity_lessons/change_status/{id}` | `ActivityLessonsController@change_status` |
| POST | `/api/activity_lessons/delete/{id}` | `ActivityLessonsController@destroy` |
| GET | `/api/activity_lessons/show/{id}` | `ActivityLessonsController@show` |
| POST | `/api/activity_lessons/fileImport` | `ActivityLessonsController@fileImport` |

#### Interactive Games (Live) — requires `ensureInteractiveGamesEnabled`

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/interactive-games` | `InteractiveGamesAdminController@index` |
| GET | `/api/interactive-games/{id}` | `InteractiveGamesAdminController@show` |
| POST | `/api/interactive-games/{id}/start` | `InteractiveGamesAdminController@startRound` |
| GET | `/api/interactive-games/{id}/facts` | `InteractiveGamesAdminController@facts` |
| GET | `/api/interactive-games/{id}/students/{studentId}/answers` | `InteractiveGamesAdminController@studentAnswers` |

---

## Student API — `/api/student/*`

Namespace: `App\Http\Controllers\Api\StudentControllers`

### Public (no JWT)

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/student/login` | `Auth\AuthApiController@login` |
| POST | `/api/student/register` | `Auth\AuthApiController@register` |
| POST | `/api/student/verification_code` | `Auth\AuthApiController@Verification` |
| POST | `/api/student/forgetPassword` | `Auth\AuthApiController@ForgetPassword` |
| POST | `/api/student/setPassword` | `Auth\AuthApiController@setPassword` |

### Protected (JWT `user-api`)

#### Subjects & Learning

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/student/getSubjects` | `SubjectController@index` |
| GET | `/api/student/certificates` | `SubjectController@earnedCertificates` |
| GET | `/api/student/viewSubject/{id}` | `SubjectController@show` |
| GET | `/api/student/subjects/{id}/certificate` | `SubjectController@certificatePreview` |
| GET | `/api/student/quizesList/{id}` | `SubjectController@quizesList` |
| GET | `/api/student/subjectUnits/{id}` | `SubjectController@subjectUnits` |
| GET | `/api/student/subjectGames/{id}` | `SubjectController@subjectGames` |
| GET | `/api/student/lessons/show/{id}` | `SubjectController@lessonView` |
| GET | `/api/student/games/show/{id}` | `SubjectController@gamesView` |
| GET | `/api/student/quizes/show/{id}` | `SubjectController@quizesView` |

#### Profile & Progress

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/student/profile` | `Auth\AuthApiController@getProfile` |
| GET | `/api/student/progress` | `SubjectController@getProgressOverview` |
| POST | `/api/student/changePassword` | `Auth\AuthApiController@updatePassword` |
| POST | `/api/student/editProfile` | `Auth\AuthApiController@editProfile` |
| POST | `/api/student/logout` | `Auth\AuthApiController@logout` |

#### Todo (Assignments)

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/student/todaoList` | `SubjectController@TodoList` |
| POST | `/api/student/todo/markOpened` | `SubjectController@markTodoOpened` |

#### Tickets

| Method | Path | Controller@action |
|--------|------|-------------------|
| POST | `/api/student/tickets/create` | `TicketController@store` |

#### Notifications

| Method | Path | Controller@action |
|--------|------|-------------------|
| GET | `/api/student/notifications/list` | `NotificationsController@index` |
| POST | `/api/student/notifications/update_read/{id}` | `NotificationsController@update` |
| DELETE | `/api/student/notifications/delete_all` | `NotificationsController@delete_all` |

#### Interactive Games (Live) — requires `ensureInteractiveGamesEnabled`

| Method | Path | Controller@action | Notes |
|--------|------|-------------------|-------|
| GET | `/api/student/interactive-games` | `InteractiveGamesStudentController@index` | List games |
| GET | `/api/student/interactive-games/{id}` | `InteractiveGamesStudentController@show` | Summary (no answers) |
| GET | `/api/student/interactive-games/{id}/questions` | `InteractiveGamesStudentController@questions` | Includes correct_answer for client feedback |
| POST | `/api/student/interactive-games/answer` | `InteractiveGamesStudentController@answerQuestion` | Body: `game_id`, `question_id`, `answer` |
| POST | `/api/student/interactive-games/{id}/password` | `InteractiveGamesStudentController@savePassword` | Body: `password` |
| GET | `/api/student/interactive-games/{id}/hacking` | `InteractiveGamesStudentController@showPasswordHacking` | Decoy passwords |
| POST | `/api/student/interactive-games/hacking` | `InteractiveGamesStudentController@savePasswordHacking` | Body: `id` (target student) — steals 15% coins |
| GET | `/api/student/interactive-games/{id}/gifts` | `InteractiveGamesStudentController@gifts` | Gift screen meta |
| POST | `/api/student/interactive-games/{id}/gifts/pull` | `InteractiveGamesStudentController@pullGift` | Body: `variant` = `hacking` \| `gold_quest` |
| POST | `/api/student/interactive-games/gifts` | `InteractiveGamesStudentController@saveGift` | Optional body `coins`; default +5 |
| GET | `/api/student/interactive-games/{id}/facts` | `InteractiveGamesStudentController@facts` | Leaderboard + personal stats |
| GET | `/api/student/interactive-games/{id}/answer-list` | `InteractiveGamesStudentController@answerList` | Current student's answers |

---

## Web & Broadcasting Routes

| Method | Path | Middleware | Purpose |
|--------|------|-----------|---------|
| GET | `/welcome/{locale}` | web | Switch session locale |
| GET | `/proxy/{path}` | web | External URL proxy |
| GET | `/test` | web | Health check |
| GET | `/questions/export` | web | Unauthenticated export |
| POST | `/broadcasting/auth` | api, checkSecretApi, authenticateBroadcastJwt | WebSocket channel auth |

### Broadcasting Channels (`routes/channels.php`)

| Channel | Type | Auth |
|---------|------|------|
| `App.User.{id}` | Private | User ID match |
| `presence-online-users.{interactiveGameId}` | Presence | Admin or student JWT |
| `student-online.{interactiveGameId}` | Private | Game participant |

**Event:** `InteractiveGameStatusChanged` → broadcast name `interactive-game.status`

---

## Frontend HTTP Clients

| App | Canonical client | Base URL env |
|-----|-----------------|--------------|
| Admin | `abutabl-admin/src/utils/fetchMethods.tsx` | `REACT_APP_BASE_URL` |
| Student (auth) | `abutabl-student/src/guards/axiosInstane.tsx` | `VITE_BASE_URL` |
| Student (helpers) | `abutabl-student/src/lib/requests.ts` | `VITE_BASE_URL` |

Both attach `apiSecret` and `Authorizations: Bearer <token_>` on protected requests.

---

## Routes Without Spatie Permission Middleware

These require JWT + apiSecret only (no `can:*`):

- Dashboard stats
- Assignments (`/api/assigns/*`)
- Notifications
- Interactive games admin
- Subject activities & activity lessons
- Resources & libraries

---

## Related Documentation

- [user-flows.md](./user-flows.md) — auth and game flows using these endpoints
- [database-structure.md](./database-structure.md) — tables behind each endpoint
- `abutabl-backend/docs/INTERACTIVE_GAMES.md` — interactive games deep dive

---

*Last updated: June 2026*
