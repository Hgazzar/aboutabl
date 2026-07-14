# Module Map

> Feature matrix, permission mapping, implementation status, and legacy state.  
> Trace any feature from UI → API → database using this document.

---

## Feature Overview Matrix

| Feature Domain | Admin UI | Student UI | Backend API | DB Tables | Real-time |
|---------------|----------|------------|-------------|-----------|-----------|
| Authentication | ✅ | ✅ | ✅ | `users`, `students` | — |
| School Management | ✅ | — | ✅ | `schools`, `schools_roles` | — |
| Grade/Class Management | ✅ | — | ✅ | `grades`, `classes` | — |
| Subject/Curriculum | ✅ | ✅ view | ✅ | `subjects`, `units`, `lessons` | — |
| SCORM Content | ✅ | ✅ view | ✅ | `lessons_contents` | — |
| Question Bank | ✅ | — | ✅ | `questions` | — |
| Quizzes | ✅ | ✅ take | ✅ | `quizes`, `quizes_questions` | — |
| Worksheets | ✅ | ✅ view | ✅ | `work_sheets` | — |
| SCORM Games | ✅ | ✅ play | ✅ | `games` | — |
| Live Interactive Games | ✅ | ✅ | ✅ | `interactive_games` | ✅ WebSocket |
| Assignments (Todo) | ✅ create | ✅ view | ✅ | `assigns`, `assigns_students` | — |
| Student Management | ✅ | — | ✅ | `students`, `student_families` | — |
| Employee Management | ✅ | — | ✅ | `users`, `teachers_grades` | — |
| Role/Permission (RBAC) | ✅ | — | ✅ | `roles`, `permissions` | — |
| Support Tickets | ⚠️ scaffold | ⚠️ hidden | ✅ | `tickets`, `tickets_replies` | — |
| Notifications | ✅ | ✅ | ✅ | `notifications` | — |
| File Management | ✅ | — | ✅ | `file_management` | — |
| Libraries/Resources | ✅ | — | ✅ | `libraries`, `resources` | — |
| Subject Activities | ✅ | — | ✅ | `subject_activities`, `activity_lessons` | — |
| Dashboard/Reports | ⚠️ partial mock | — | ✅ | various | — |
| Profile Management | ✅ | ✅ | ✅ | `users`, `students` | — |
| Certificates | — | ✅ | ✅ | `student_subject_progress` | — |
| Excel Import/Export | ✅ | — | ✅ | — | — |
| i18n (EN/AR) | ✅ | ✅ | ✅ | — | — |

**Legend:** ✅ Complete | ⚠️ Partial/scaffold/hidden | — N/A

---

## Admin Modules

### Route → API → Permission Map

| Module | Admin routes (sample) | API prefix | Permission module | Spatie enforced |
|--------|----------------------|------------|-------------------|-----------------|
| Dashboard | `/dashboard` | `/api/dashboard/*` | — | ❌ |
| Schools | `/school/*` | `/api/school/*` | `schools` | ✅ |
| Grades | `/school/grade` | `/api/grade/*` | `grades` | ✅ |
| Classes | `/school/classes/:id` | `/api/class/*` | `grades` | ✅ |
| Subjects | `/subjects/*` | `/api/subject/*` | `subjects` | ✅ |
| Question Bank | `/question-bank/*` | `/api/questions/*` | `questions` | ✅ |
| Quizzes | `/subjects/quiz/*` | `/api/quizes/*` | `quizes` | ✅ |
| Worksheets | `/subjects/add-worksheet/*` | `/api/worksheets/*` | `worksheets` | ✅ |
| SCORM Games | `/subject/add-game/*` | `/api/games/*` | `games` | ✅ |
| SCORM Content | `/subjects/add-content/*` | `/api/contents/*` | `contents` | ✅ |
| Live Games | `/games/*` | `/api/interactive-games/*` | — | ❌ |
| Assignments | (subject detail) | `/api/assigns/*` | — | ❌ |
| Employees | `/user/employee/*` | `/api/employees/*` | `teachers` | ✅ |
| Students | `/user/student/*` | `/api/students/*` | `students` | ✅ |
| Roles | `/roles/*` | `/api/roles/*` | `roles` | ✅ |
| Tickets | `/tickets/list` | `/api/tickets/*` | `tickets` | ✅ (API) / ⚠️ (UI) |
| File Manager | `/file-management` | `/api/file_maanger/*` | `file_managers` | ✅ |
| Reports | `/report/list` | — | `reports` | ⚠️ mock UI |
| Profile | `/profile` | `/api/profile` | — | ❌ |
| Notifications | Top nav | `/api/notifications/*` | — | ❌ |
| Activities | Subject tab | `/api/subject_activities/*` | — | ❌ |

### Admin Redux Slices

| Slice | File | Domain |
|-------|------|--------|
| `login` | `redux/reducers/loginReducer` | Auth session |
| `permissions` | `redux/reducers/permissionsReducer` | RBAC |
| `school` | `redux/reducers/schoolReducer` | Schools |
| `grade`, `classes` | respective reducers | School hierarchy |
| `subjects` | `redux/reducers/subjectsReducer` | **Largest** — curriculum, units, lessons, quizzes, games |
| `employee`, `student` | respective reducers | User management |
| `roles` | `redux/reducers/rolesReducer` | Role CRUD |
| `questions` | `redux/reducers/questionsReducer` | Question bank |
| `files` | `redux/reducers/filesReducer` | File manager |
| `profile` | `redux/reducers/profileReducer` | Admin profile |
| `common` | `redux/reducers/commonReducer` | Shared dropdowns |
| `interactiveGames` | `redux/reducers/interactiveGamesReducer` | Live game Echo events |
| `notificationsApi` | RTK Query | Notifications polling |
| `pagesToggle` | `redux/reducers/pagesToggleReducer` | Nav labels |

---

## Student Modules

### Route → API Map

| Module | Student routes | API endpoints | Status |
|--------|---------------|---------------|--------|
| Landing | `/welcome` | — | ✅ |
| Auth | `/login`, `/login/*` | `/api/student/login`, etc. | ✅ |
| Learn catalog | `/learn` | `getSubjects` | ✅ |
| Subject detail | `/learn/:id` | `viewSubject`, `subjectUnits`, etc. | ✅ |
| Lessons | `/learn/:id/details/:unitId` | `lessons/show/:id` | ✅ |
| SCORM games | `/learn/:id/detailsGame/:idGame` | `games/show/:id` | ✅ |
| Quizzes | `/learn/quiz/:idQuiz` | `quizes/show/:id` | ⚠️ client-side scoring |
| Todo | `/todo` | `todaoList`, `todo/markOpened` | ✅ |
| Live games | `/games/*` | `interactive-games/*` | ✅ (Echo not wired) |
| Profile | `/profile` | `profile`, `progress`, `certificates` | ✅ |
| Support | `/support` | `tickets/create` | ⚠️ hidden from sidebar |
| Notifications | Learn header | `notifications/list` | ✅ |

### Student Redux Slices

| Slice | Domain |
|-------|--------|
| `LoginReducer` | Login |
| `LogputReducer` | Logout |
| `SubjectsReducer` | Subject list + details |
| `LessonReducer` | Lesson content |
| `GamesReducer` | Subject SCORM games |
| `QuizzesReducer`, `QuizReducer` | Quiz list + play |
| `todoReducer` | Assignments |
| `interactiveLiveGames` | Live game events (Echo not subscribed) |
| `notificationsApi` | RTK Query |

### Student Recoil Atoms

| Atom | Purpose |
|------|---------|
| `langState` | EN/AR locale |
| `isLoadingAtom` | Global loading |
| `isPartiallyLoadingAtom` | Partial loading |
| `is-sidebarOpen` | Sidebar toggle |

---

## Spatie Permission Mapping

### Permission Key Format

`{action}-{resource}`

**Actions:** `view`, `add`, `edit`, `delete`, `export`, `import` (varies)  
**Resources:** `schools`, `subjects`, `teachers`, `students`, `questions`, `quizes`, `units`, `contents`, `games`, `worksheets`, `grades`, `tickets`, `file_managers`, `reports`, `users`

### Full Permission → Feature Map

| Permission | Gated feature |
|------------|--------------|
| `view-schools` | School list/details |
| `add-schools` | Create school |
| `edit-schools` | Edit school |
| `delete-schools` | Delete school |
| `view-subjects` | Subject list/details |
| `add-subjects` | Create subject |
| `edit-subjects` | Edit subject |
| `delete-subjects` | Delete subject |
| `view-teachers` | Employee list |
| `add-teachers` | Create employee |
| `edit-teachers` | Edit employee |
| `delete-teachers` | Delete employee |
| `export-teachers` | Employee Excel export |
| `view-students` | Student list |
| `add-students` | Create student |
| `edit-students` | Edit student |
| `delete-students` | Delete student |
| `export-students` | Student Excel export |
| `view-questions` | Question bank |
| `add-questions` | Create question |
| `edit-questions` | Edit question |
| `delete-questions` | Delete question |
| `view-quizes` | Quiz list |
| `add-quizes` | Create quiz |
| `edit-quizes` | Edit quiz |
| `delete-quizes` | Delete quiz |
| `view-units` | Unit management |
| `add-units` | Create unit |
| `edit-units` | Edit unit |
| `delete-units` | Delete unit |
| `view-contents` | SCORM content |
| `add-contents` | Upload content |
| `edit-contents` | Edit content |
| `delete-contents` | Delete content |
| `view-games` | SCORM games |
| `add-games` | Create SCORM game |
| `edit-games` | Edit SCORM game |
| `delete-games` | Delete SCORM game |
| `view-worksheets` | Worksheets |
| `add-worksheets` | Create worksheet |
| `edit-worksheets` | Edit worksheet |
| `delete-worksheets` | Delete worksheet |
| `view-grades` | Grade management |
| `view-tickets` | Support tickets |
| `view-file_managers` | File manager |
| `view-reports` | Reports |
| `view-users` | User management |

### Permission Guard Modules (Admin `PermissionGuard`)

`schools`, `grades`, `teachers`, `students`, `roles`, `subjects`, `questions`, `worksheets`, `games`, `contents`, `quizes`, `reports`, `file_managers`, `users`, `tickets`

### Routes Without Permission Middleware

JWT + apiSecret only — no `can:*`:

- Dashboard (`/api/dashboard/*`)
- Assignments (`/api/assigns/*`)
- Notifications (`/api/notifications/*`)
- Interactive games admin (`/api/interactive-games/*`)
- Subject activities (`/api/subject_activities/*`)
- Activity lessons (`/api/activity_lessons/*`)
- Resources (`/api/resources/*`)
- Libraries (`/api/libraries/*`)

---

## Backend Controller Modules

| Controller group | Count | Route file |
|-----------------|-------|------------|
| `Api/AdminControllers/*` | 25+ controllers | `routes/api/admin.php` |
| `Api/StudentControllers/*` | 5 controllers | `routes/api/student.php` |

### Student controllers

| Controller | Responsibility |
|------------|---------------|
| `Auth\AuthApiController` | Login, register, profile, password |
| `SubjectController` | Subjects, lessons, quizzes, games, progress, todo |
| `TicketController` | Support tickets |
| `NotificationsController` | Notifications |
| `InteractiveGamesStudentController` | Live games |

---

## Excel Import/Export Modules

| Entity | Import | Export |
|--------|--------|--------|
| Students | `POST /api/students/fileImport` | `GET /api/students/export` |
| Employees | `POST /api/employees/fileImport` | `GET /api/employees/export` |
| Schools | `POST /api/school/fileImport` | — |
| Questions | `POST /api/questions/fileImport` | `GET /api/questions/export` |
| Questions (update) | `POST /api/questions/fileImportUpdate` | — |
| Activity lessons | `POST /api/activity_lessons/fileImport` | — |

**Implementation:** `app/Exports/`, `app/Imports/` — Maatwebsite Excel.

---

## Legacy State: `old-game`

### Status: READ-ONLY REFERENCE — DO NOT EXTEND

| Aspect | Legacy (`old-game`) | Modern replacement |
|--------|---------------------|-------------------|
| Backend | Standalone Laravel 8 Blade | `abutabl-backend` `/api/interactive-games/*` |
| Teacher UI | Blade `/teacher/*` | `abutabl-admin` `/games/*` |
| Student UI | Blade `/student/*` | `abutabl-student` `/games/*` |
| DB tables | `game1s`, `game_questions`, `student_answer_games` | `interactive_games`, `interactive_game_questions`, `interactive_student_answers` |
| WebSocket event | `UserStatusChanged` | `InteractiveGameStatusChanged` |
| Channel | `student-online.{gameId}` | Same pattern |
| Game modes | `classic`, `hacking`, `gold_quest` | Same enum |

### Legacy route mapping

| Legacy route | Modern equivalent |
|-------------|-------------------|
| `GET /teacher/games/index` | Admin `/games` |
| `GET /teacher/waiting/{id}` | Admin `/games/:id/waiting` |
| `GET /teacher/statistics-list/{id}` | Admin `/games/:id/statistics` |
| `GET /teacher/facts/{id}` | Admin `/games/:id/facts` |
| `GET /student/games/index` | Student `/games` |
| `GET /student/{id}` | Student `/games/:id/lobby` |
| `GET /student/question/{id}` | Student `/games/:id/play` |
| `POST /student/answer-question` | `POST /api/student/interactive-games/answer` |

**No cross-references:** Other apps do not import or env-reference `old-game`.

---

## Known Gaps & Partial Implementations

| Area | Gap | Risk if ignored |
|------|-----|----------------|
| Quiz scoring | Client-side only, no submit API | Adding server scoring needs new endpoint |
| Student Echo | Configured but not subscribed | Live game real-time updates missing on student |
| Support (student) | Sidebar link commented out | Feature exists but undiscoverable |
| Support (admin) | UI scaffold, may not call API | Incomplete ticket management |
| Reports (admin) | Mock chart data | Misleading analytics display |
| Select school page | Mock data at `/select-school` | Non-functional school picker |
| Permission gaps | Dashboard, games admin, assigns | Any authenticated admin can access |
| Dual axios (student) | Support uses bare instance | Inconsistent auth/error handling |

---

## Feature → Table Quick Reference

| Feature | Primary tables |
|---------|---------------|
| Schools | `schools`, `schools_roles`, `subjects_schools` |
| Curriculum | `subjects`, `units`, `lessons`, `lessons_contents` |
| Question bank | `questions` |
| Quizzes | `quizes`, `quizes_questions` |
| Worksheets | `work_sheets`, `work_sheets_questions` |
| SCORM games | `games`, `games_questions`, `games_students` |
| Live games | `interactive_games`, `interactive_game_questions`, `interactive_student_answers` |
| Assignments | `assigns`, `assigns_students` |
| Users | `users`, `students`, `teachers_grades` |
| RBAC | `roles`, `permissions`, `model_has_*` |
| Tickets | `tickets`, `tickets_replies`, `tickets_files` |
| Notifications | `notifications` |
| Progress | `student_subject_progress`, `subject_students` |

---

## Related Documentation

- [project-overview.md](./project-overview.md) — stacks and directories
- [api-reference.md](./api-reference.md) — full endpoint list
- [user-flows.md](./user-flows.md) — behavioral flows
- [database-structure.md](./database-structure.md) — model detail

---

*Last updated: June 2026*
