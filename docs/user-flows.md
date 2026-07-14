# User Flows

> End-to-end behavioral flows across admin, student, backend, and WebSockets.  
> Use when implementing or modifying auth, assignments, learning, or live games.

---

## Table of Contents

1. [Admin Login & Session](#1-admin-login--session)
2. [Student Login & Session](#2-student-login--session)
3. [Admin → Student SSO Handoff](#3-admin--student-sso-handoff)
4. [Password Reset Flow](#4-password-reset-flow)
5. [School Scoping Flow](#5-school-scoping-flow)
6. [Permission Gating (Admin)](#6-permission-gating-admin)
7. [Learning Flow (Student)](#7-learning-flow-student)
8. [Assignment (Todo) Flow](#8-assignment-todo-flow)
9. [Quiz Flow (Student)](#9-quiz-flow-student)
10. [Live Interactive Games Flow](#10-live-interactive-games-flow)
11. [Notification Flow](#11-notification-flow)
12. [API Request Lifecycle](#12-api-request-lifecycle)

---

## 1. Admin Login & Session

```mermaid
sequenceDiagram
    participant U as Admin User
    participant A as abutabl-admin
    participant API as abutabl-backend

    U->>A: Enter email + password at /
    A->>API: POST /api/login<br/>Headers: apiSecret
    API->>API: Validate User (verify=1, status=1, role)
    alt Admin/teacher found
        API-->>A: { user: { api_token: JWT, ... } }
        A->>A: Cookies: token_, username, abotable_id, expiration
        A->>API: GET /api/permissions
        API-->>A: Permission list
        A->>A: PermissionGuard loads → navigate /dashboard
    else Student credentials (fallback)
        API-->>A: { portal: "student", user: { api_token } }
        Note over A: See SSO Handoff flow
    else Invalid
        API-->>A: 401 error
    end
```

**Cookie storage (admin):**

| Cookie | Purpose |
|--------|---------|
| `token_` | JWT bearer token |
| `username` | Display name |
| `abotable_id` | User ID |
| `expiration` | JWT expiry (ms timestamp) |

**Guards:** `AuthGuard` checks `token_`; `PermissionGuard` checks module permissions from Redux.

**Session expiry:** `fetchMethods.tsx` checks `expiration`; on expiry or 401 → clear cookies → redirect to `/`.

---

## 2. Student Login & Session

```mermaid
sequenceDiagram
    participant S as Student
    participant ST as abutabl-student
    participant API as abutabl-backend

    S->>ST: Enter student code + password at /login
    ST->>API: POST /api/student/login<br/>Headers: apiSecret
    API->>API: Validate Student (username, password, status, verify)
    API-->>ST: { user: { api_token: JWT, ... } }
    ST->>ST: Cookies: token_, username, abotable_id, expiration
    ST->>ST: localStorage: user_info
    ST->>ST: ProtectedRoute passes → /learn
```

**Remember me:** Extended cookie expiry on login form.

**Logout:** `POST /api/student/logout` → clear cookies + localStorage in `LogputReducer`.

**Guard:** `ProtectedRoute` in `src/components/` checks `Cookies.get('token_')`.

---

## 3. Admin → Student SSO Handoff

When a student account logs in via the **admin** login endpoint:

```mermaid
sequenceDiagram
    participant A as abutabl-admin
    participant ST as abutabl-student
    participant API as abutabl-backend

    A->>API: POST /api/login (student credentials)
    API-->>A: { portal: "student", user: { api_token } }
    A->>ST: Redirect REACT_APP_STUDENT_APP_URL/login/handoff#access_token=<JWT>
    ST->>ST: AdminPortalHandoff.tsx parses hash
    ST->>ST: Set cookies (token_, expiration, etc.)
    ST->>API: GET /api/student/profile<br/>Authorizations: Bearer JWT
    API-->>ST: Profile data
    ST->>ST: localStorage: user_info
    ST->>ST: Navigate to /learn
```

**Files involved:**
- Admin: `loginReducer` — detects `portal === "student"`
- Student: `src/views/auth/AdminPortalHandoff.tsx`

---

## 4. Password Reset Flow

Both portals share the same 3-step pattern (different URL prefixes):

```mermaid
flowchart LR
    A[POST /forgetPassword] --> B[POST /verification_code]
    B --> C[POST /setPassword]
    C --> D[Login with new password]
```

| Step | Admin endpoint | Student endpoint |
|------|---------------|------------------|
| Request code | `/api/forgetPassword` | `/api/student/forgetPassword` |
| Verify OTP | `/api/verification_code` | `/api/student/verification_code` |
| Set password | `/api/setPassword` | `/api/student/setPassword` |

**Admin UI:** Modals on login page.  
**Student UI:** `/login/verifyEmail` → `/login/verify` → `/login/reset-password`.

---

## 5. School Scoping Flow

Multi-school admins operate within a selected school context:

```mermaid
flowchart TD
    A[Admin logs in] --> B{Multiple schools?}
    B -->|Yes| C[GET /api/school/get]
    C --> D[POST /api/school/set active school]
    B -->|No| E[Auto-scoped to assigned school]
    D --> F[Controllers use GeneralTrait::SchoolsIDs]
    E --> F
    F --> G[School-filtered queries]
```

**Tables:** `schools_roles` links users to schools.  
**Trait:** `app/Traits/GeneralTrait.php` — `SchoolsIDs()` method.

---

## 6. Permission Gating (Admin)

```mermaid
flowchart TD
    A[Route requested] --> B[AuthGuard: token_ cookie?]
    B -->|No| C[Redirect /]
    B -->|Yes| D[PermissionGuard: module permission?]
    D -->|No| E[Redirect or block]
    D -->|Yes| F[Render page]
    G[GET /api/permissions on login] --> H[Redux permissions slice]
    H --> D
```

**Permission format:** `{action}-{resource}` (e.g. `view-subjects`, `add-teachers`)

**Sidebar:** `DashboardList.tsx` — menu items filtered by permissions.

**Modules:** `schools`, `grades`, `teachers`, `students`, `roles`, `subjects`, `questions`, `worksheets`, `games`, `contents`, `quizes`, `reports`, `file_managers`, `users`, `tickets`

---

## 7. Learning Flow (Student)

```mermaid
flowchart TD
    A[/learn - Subject catalog] --> B[GET /api/student/getSubjects]
    B --> C[/learn/:id - Subject detail]
    C --> D[GET /api/student/viewSubject/:id]
    D --> E{Tabs}
    E --> F[Overview - progress, certificate]
    E --> G[Units - GET subjectUnits/:id]
    E --> H[Games - GET subjectGames/:id]
    E --> I[Quizzes - GET quizesList/:id]
    E --> J[Worksheets]
    G --> K[/learn/:id/details/:unitId]
    K --> L[GET lessons/show/:id - SCORM viewer]
    H --> M[/learn/:id/detailsGame/:gameId]
    M --> N[GET games/show/:id]
    I --> O[/learn/:id/quiz/:quizId → /learn/quiz/:idQuiz]
    O --> P[GET quizes/show/:id]
```

**Default redirect:** `/` → `/learn` (protected).

**Certificate:** `GET /api/student/subjects/{id}/certificate` from overview or profile.

---

## 8. Assignment (Todo) Flow

```mermaid
sequenceDiagram
    participant T as Teacher (Admin)
    participant API as Backend
    participant S as Student

    T->>API: POST /api/assigns/store<br/>(module_type, module_id, students, due_date)
    API->>API: Create Assigns + AssignsStudents rows
    S->>API: GET /api/student/todaoList
    API-->>S: Assignment list with deep-link metadata
    S->>S: Display on /todo
    S->>API: POST /api/student/todo/markOpened
    S->>S: Navigate to lesson/quiz/game/worksheet route
```

**Admin creation:** Subject detail or assigns module — `AssignsController`.  
**Student view:** `/todo` — `todoReducer` in Redux.

---

## 9. Quiz Flow (Student)

```mermaid
flowchart TD
    A[Quiz intro /learn/:id/quiz/:quizId] --> B[GET quizes/show/:id]
    B --> C[Quiz player /learn/quiz/:idQuiz]
    C --> D[Render questions client-side]
    D --> E[Multiple choice, T/F, drag-drop, matching]
    E --> F[Score computed locally]
    F --> G[/learn/quiz/:idQuiz/result/:score]
```

> **Gap:** No server-side quiz submission API. Scoring is entirely client-side. Do not assume a submit endpoint exists.

---

## 10. Live Interactive Games Flow

### 10.1 Overview

Three game modes share the same API surface with mode-specific UI routes:

| Mode | Student routes | Special mechanics |
|------|---------------|-------------------|
| `classic` | `/games/:id/lobby`, `/games/:id/play` | Standard Q&A, coins per answer |
| `hacking` | `/games/:id/hacking/*` | Password setup, steal 15% coins |
| `gold_quest` | `/games/:id/gold-quest/*` | Variant UI, gift pulls |

### 10.2 Teacher (Admin) Flow

```mermaid
sequenceDiagram
    participant T as Teacher (Admin SPA)
    participant API as Backend
    participant WS as WebSocket Server
    participant S as Students

    T->>API: GET /api/interactive-games
    T->>T: /games/:id/waiting (lobby)
    T->>API: POST /api/interactive-games/{id}/start
    API->>WS: Broadcast InteractiveGameStatusChanged (round_started)
    WS-->>S: interactive-game.status event
    T->>T: /games/:id/statistics (Echo subscribed)
    loop Each answer
        S->>API: POST /api/student/interactive-games/answer
        API->>WS: Broadcast status update
        WS-->>T: Live stats refresh
    end
    T->>API: GET /api/interactive-games/{id}/facts
    API->>WS: Broadcast round_ended
    T->>T: /games/:id/facts (leaderboard)
    T->>T: /games/:id/students/:studentId (per-student answers)
```

**Admin Echo:** `src/utils/echo.ts` — **active** on statistics page.  
**Auth:** `POST /broadcasting/auth` with `apiSecret` + `Authorizations: Bearer JWT`.

### 10.3 Student Flow

```mermaid
flowchart TD
    A[/games - game list] --> B[GET /api/student/interactive-games]
    B --> C{Game type?}
    C -->|classic| D[/games/:id/lobby]
    D --> E[/games/:id/play]
    E --> F[GET .../questions]
    F --> G[POST .../answer per question]
    C -->|hacking| H[/games/:id/hacking/password]
    H --> I[POST .../password]
    I --> J[/games/:id/hacking/play]
    J --> K[Optional: hacking screen, gifts]
    K --> L[POST .../hacking - steal coins]
    C -->|gold_quest| M[/games/:id/gold-quest/*]
    G --> N[/games/:id/facts]
    G --> O[/games/:id/answer-list]
```

**Hacking gift pull:** `POST /api/student/interactive-games/{id}/gifts/pull` with `variant: hacking|gold_quest`.

**Password storage:** Encrypted in `students.game_password` field.

### 10.4 WebSocket Architecture

```mermaid
graph LR
    subgraph Clients
        AdminEcho["Admin Echo<br/>utils/echo.ts"]
        StudentEcho["Student Echo<br/>lib/echo.ts (not wired)"]
    end

    subgraph Server
        WSS["laravel-websockets :6001"]
        Auth["POST /broadcasting/auth"]
        Event["InteractiveGameStatusChanged"]
    end

    AdminEcho --> Auth
    StudentEcho -.-> Auth
    AdminEcho --> WSS
    Event --> WSS
    WSS -->|"student-online.{gameId}"| AdminEcho
```

**Channels:**
- `presence-online-users.{interactiveGameId}` — presence
- `student-online.{interactiveGameId}` — game status

**Run server:** `php artisan websockets:serve`  
**Toggle:** `INTERACTIVE_GAMES_ENABLED=false` → all interactive routes return 404.

### 10.5 Legacy Parity (`old-game`)

The `old-game` app implemented the same flows via Blade routes and `UserStatusChanged` events. Modern stack maps as:

| Legacy | Modern |
|--------|--------|
| `GET /teacher/waiting/{id}` | Admin `/games/:id/waiting` |
| `GET /teacher/statistics-list/{id}` | Admin `/games/:id/statistics` |
| `GET /student/question/{id}` | Student `/games/:id/play` |
| `UserStatusChanged` event | `InteractiveGameStatusChanged` |
| `game1s` / `student_answer_games` tables | `interactive_games` / `interactive_student_answers` |

---

## 11. Notification Flow

```mermaid
sequenceDiagram
    participant API as Backend
    participant A as Admin SPA
    participant S as Student SPA

    API->>API: Create Notification row
    loop Polling (RTK Query)
        A->>API: GET /api/notifications/list
        S->>API: GET /api/student/notifications/list
    end
    A->>API: POST /api/notifications/update_read/{id}
    S->>API: POST /api/student/notifications/update_read/{id}
```

**Implementation:** RTK Query slices in both frontends (`notificationsApi`).

---

## 12. API Request Lifecycle

Every authenticated API call follows this path:

```mermaid
flowchart TD
    A[Frontend builds request] --> B[Attach apiSecret header]
    B --> C[Attach Authorizations: Bearer token_]
    C --> D[Optional: lang / Accept-Language]
    D --> E[Axios sends to backend]
    E --> F[checkSecretApi middleware]
    F --> G[changeLanguage middleware]
    G --> H[JWT middleware validates token]
    H --> I[can:* permission check if applicable]
    I --> J[Controller action + school scope]
    J --> K[GeneralTrait JSON response]
    K --> L{status?}
    L -->|401| M[Frontend clears session → login]
    L -->|200| N[Redux/state update + UI render]
```

---

## Related Documentation

- [api-reference.md](./api-reference.md) — endpoint catalog
- [module-map.md](./module-map.md) — feature status matrix
- [database-structure.md](./database-structure.md) — tables involved in flows

---

*Last updated: June 2026*
