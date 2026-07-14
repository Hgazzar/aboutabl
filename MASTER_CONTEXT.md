# MASTER_CONTEXT.md

> **The brain of the Aboutabl project.**  
> Read this file — and relevant `/docs` files — before writing any code, planning any feature, or making any structural change.

---

## What This Project Is

**Aboutabl** is a multi-tenant **Learning Management System (LMS)** delivered as a monorepo with three active applications and one legacy reference app:

```
aboutabl/
├── docs/                 ← Canonical documentation (read before coding)
├── MASTER_CONTEXT.md     ← This file
├── .cursor/rules/project-rules.mdc  ← Auto-loaded every session (alwaysApply: true)
├── abutabl-backend/      ← Laravel 8 API (START HERE)
├── abutabl-admin/        ← React admin/teacher SPA (CRA + MUI 5)
├── abutabl-student/      ← React student SPA (Vite + Mantine 6)
└── old-game/             ← Legacy prototype (READ-ONLY, do not extend)
```

**Production URLs:** `aboutabl.com` (admin) · `student.aboutabl.com` (student) · `api.aboutabl.com` (API)

---

## Non-Negotiable Constraints

These are established patterns. Breaking them introduces technical debt or production failures.

### 1. Custom auth header: `Authorizations` (with an "s")

```
✅ Authorizations: Bearer <JWT>
❌ Authorization: Bearer <JWT>
```

Both frontends and the backend expect `Authorizations`. This is an intentional Apache/cPanel workaround. Never change on one layer without coordinating all three.

### 2. Dual JWT guards

| Guard | Model | API prefix |
|-------|-------|------------|
| `admin-api` | `App\Models\User` | `/api/*` |
| `user-api` | `App\Models\Student` | `/api/student/*` |

Admin endpoints are at `/api/*` — **not** `/api/admin/*`.

### 3. API secret on every request

All API calls require header: `apiSecret: <API_SECRET>`

### 4. Two separate "games" systems

| System | Table | API |
|--------|-------|-----|
| SCORM subject games | `games` | `/api/games/*`, `/api/student/games/*` |
| Live interactive games | `interactive_games` | `/api/interactive-games/*`, `/api/student/interactive-games/*` |

Never merge, confuse, or cross-reference these.

### 5. Legacy typos — preserve until coordinated rename

| Quirk | Location |
|-------|----------|
| `public/scrom/` | SCORM content path (missing "a") |
| `/api/file_maanger/*` | File manager API (missing "n") |
| `quizes` | Table/model name (not "quizzes") |
| `todaoList` | Student todo endpoint |

### 6. `old-game` is read-only reference

Do not modify `old-game/` when implementing features. Use `abutabl-backend` interactive-games module instead.

---

## Technology Summary

| App | Stack | UI library | HTTP client | State |
|-----|-------|-----------|-------------|-------|
| **backend** | Laravel 8, PHP, MySQL, Eloquent | — | — | — |
| **admin** | React 18, TS, CRA+CRACO | **MUI 5** + Tailwind | `src/utils/fetchMethods.tsx` | Redux Toolkit |
| **student** | React 18, TS, Vite | **Mantine 6** + MUI + Tailwind | `src/guards/axiosInstane.tsx` | Redux + Recoil |

**Auth:** JWT (`tymon/jwt-auth`) + Spatie RBAC (admin only)  
**Real-time:** Laravel WebSockets + Echo + Pusher protocol (port 6001)  
**i18n:** EN/AR — i18next (admin), react-intl (student), `lang` header (API)

---

## Where to Look in the Codebase

### Backend (`abutabl-backend`) — understand the system here first

| Need | Path |
|------|------|
| Admin routes | `routes/api/admin.php` |
| Student routes | `routes/api/student.php` |
| Route registration | `app/Providers/RouteServiceProvider.php` |
| Models (56) | `app/Models/` |
| Controllers | `app/Http/Controllers/Api/` |
| Middleware | `app/Http/Middleware/` |
| API responses & school scope | `app/Traits/GeneralTrait.php` |
| Auth config | `config/auth.php` |
| Migrations | `database/migrations/` |

### Admin frontend (`abutabl-admin`)

| Need | Path |
|------|------|
| Routes + guards | `src/App.tsx` |
| HTTP client | `src/utils/fetchMethods.tsx` |
| Auth guards | `src/auth/AuthGuard.tsx`, `PermissionGuard.tsx` |
| Redux store | `src/redux/store.tsx` |
| Feature pages | `src/pages/` |
| WebSocket | `src/utils/echo.ts` |

### Student frontend (`abutabl-student`)

| Need | Path |
|------|------|
| Routes | `src/routes/routes.tsx` |
| HTTP helpers | `src/lib/requests.ts` |
| Auth axios | `src/guards/axiosInstane.tsx` |
| Protected route | `src/components/ProtectedRoute` |
| Redux store | `src/redux-toolkit/store/store.tsx` |
| Feature views | `src/views/` |
| SSO handoff | `src/views/auth/AdminPortalHandoff.tsx` |

---

## Documentation Index

| File | When to read |
|------|-------------|
| [docs/README.md](docs/README.md) | Navigation hub — start here for doc map |
| [docs/project-overview.md](docs/project-overview.md) | Onboarding, tech stacks, env vars |
| [docs/database-structure.md](docs/database-structure.md) | Any DB/model/migration work |
| [docs/api-reference.md](docs/api-reference.md) | Any API endpoint work |
| [docs/user-flows.md](docs/user-flows.md) | Auth, games, assignments, flows |
| [docs/module-map.md](docs/module-map.md) | Features, permissions, legacy, gaps |
| `abutabl-backend/docs/INTERACTIVE_GAMES.md` | Live games API detail |

---

## Development Workflow Protocol

**For every feature or change, follow this sequence:**

### Phase 1 — Read (mandatory)
1. Read this file (`MASTER_CONTEXT.md`)
2. Read relevant `/docs` files for the affected domain
3. Search existing models, routes, controllers, and components before creating anything new

### Phase 2 — Impact Analysis (mandatory before coding)
Document:
- **Affected apps:** backend / admin / student / old-game?
- **Affected files:** list specific paths
- **Database impact:** new migration? existing model extension?
- **API impact:** new endpoint or modify existing? which guard?
- **Permission impact:** new Spatie permission needed?
- **Frontend impact:** which pages/components? admin or student?
- **Breaking change risks:** auth header, school scoping, CORS, WebSockets
- **Known gaps:** does this touch quiz scoring, student Echo, support module?

### Phase 3 — Implementation Plan (mandatory before coding)
Provide a clear plan covering:
- **DB:** migrations, model changes, relationships
- **API:** routes, controller methods, middleware, validation
- **Admin UI:** pages, Redux slices, MUI components
- **Student UI:** views, Redux/Recoil, Mantine components
- **Tests:** what to verify manually or automatically

### Phase 4 — Green Light Required
**Do NOT write code until explicit approval** from the project owner.

---

## Coding Standards

### General
- **Minimize scope** — smallest correct diff; no unrelated changes
- **No over-engineering** — no premature abstractions or one-line helpers
- **Match existing conventions** — read surrounding code before writing
- **Reuse before create** — search models, endpoints, components first

### Backend
- Add routes to existing route files (`admin.php` / `student.php`)
- Use existing controllers where the domain matches
- Return responses via `GeneralTrait` format
- Apply `can:*` middleware for new admin endpoints unless there's a documented reason not to
- Scope queries by school via `GeneralTrait::SchoolsIDs()` for tenant data

### Admin frontend
- Use `fetchMethods.tsx` for all API calls
- Add Redux thunks to existing reducers when domain matches
- Use **MUI 5** components; Tailwind for layout utilities
- Gate new routes with `AuthGuard` + `PermissionGuard`
- Add i18n keys to `src/locales/en.json` and `ar.json`

### Student frontend
- Use `lib/requests.ts` + `guards/axiosInstane.tsx` for API calls
- Add Redux thunks to existing slices when domain matches
- Use **Mantine 6** as primary UI; MUI where already used in context
- Protect routes via `ProtectedRoute`
- Add i18n keys to `src/translations/en.json` and `ar.json`

### Naming conventions
- Backend routes: snake_case paths (`/api/subject/list`)
- Models: PascalCase (`Subject`, `InteractiveGame`)
- Admin pages: `src/pages/{domain}/`
- Student views: `src/views/{domain}/`
- Redux slices: `{domain}Reducer` or descriptive name matching existing files

---

## Authentication Quick Reference

### Login endpoints
| Portal | Endpoint |
|--------|----------|
| Admin | `POST /api/login` |
| Student | `POST /api/student/login` |

### Token storage (both frontends)
Cookies: `token_`, `username`, `abotable_id`, `expiration`  
Student also: `localStorage.user_info`

### SSO handoff
Admin login returns `portal: "student"` → redirect to `{STUDENT_APP_URL}/login/handoff#access_token=<JWT>`

### Password reset (both)
`forgetPassword` → `verification_code` → `setPassword`

---

## Environment Variables

| App | Key vars |
|-----|----------|
| Backend | `API_SECRET`, `JWT_SECRET`, `DB_*`, `PUSHER_*`, `INTERACTIVE_GAMES_ENABLED`, `AWS_*` |
| Admin | `REACT_APP_BASE_URL`, `REACT_APP_API_SECRET`, `REACT_APP_STUDENT_APP_URL`, `REACT_APP_PUSHER_*` |
| Student | `VITE_BASE_URL`, `VITE_API_SECRET`, `VITE_PUSHER_*` |

---

## Known Gaps (Do Not Assume These Exist)

| Gap | Detail |
|-----|--------|
| Quiz submit API | Student scores quizzes client-side only |
| Student WebSocket | Echo configured in `lib/echo.ts` but not subscribed in game components |
| Support module | Built but hidden/de-emphasized in student; scaffold in admin |
| Reports | Admin reports page uses mock data |
| Permission gaps | Dashboard, assigns, notifications, interactive games admin lack Spatie middleware |

---

## Impact Analysis Template

Use this when planning any change:

```markdown
## Impact Analysis: [Feature/Change Name]

### Scope
- Apps affected: [backend / admin / student]
- Change type: [feature / bugfix / refactor]

### Database
- [ ] No DB changes
- [ ] Extend existing model: ___
- [ ] New migration needed: ___

### API
- [ ] No API changes
- [ ] Extend existing endpoint: ___
- [ ] New endpoint: ___ (guard: admin-api / user-api)
- [ ] Permission needed: ___

### Frontend
- Admin pages/components: ___
- Student views/components: ___
- Redux/Recoil changes: ___

### Risks
- [ ] Auth header compatibility
- [ ] School scoping
- [ ] CORS origins
- [ ] WebSocket channels
- [ ] Breaking existing clients
- [ ] Legacy typo paths (scrom, file_maanger)

### Testing plan
- ___
```

---

*This file is the single source of truth for project context. Keep `/docs` in sync when architecture changes.*

*Last updated: June 2026*
