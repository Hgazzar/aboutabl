# Aboutabl Documentation

> Canonical knowledge base for developers and AI agents working in this monorepo.  
> **Read before writing any code.**

---

## Start Here

| Document | Purpose | When to read |
|----------|---------|--------------|
| [**MASTER_CONTEXT.md**](../MASTER_CONTEXT.md) | Project brain — constraints, workflow, impact analysis template | **Every new task / session** |
| [.cursor/rules/project-rules.mdc](../.cursor/rules/project-rules.mdc) | Permanent Cursor rules (`alwaysApply: true`) | Loaded automatically every session |

---

## Domain Documentation

| Document | Contents | Read when you need to… |
|----------|----------|------------------------|
| [project-overview.md](./project-overview.md) | Monorepo layout, tech stacks, directories, env vars, architecture diagram | Onboard, choose the right app, understand deployment |
| [database-structure.md](./database-structure.md) | 56 Eloquent models, tables, relationships, SCORM vs live games boundary | Add migrations, models, or queries |
| [api-reference.md](./api-reference.md) | ~210 endpoints, JWT guards, `Authorizations` header, middleware, response format | Add or change API routes or HTTP clients |
| [user-flows.md](./user-flows.md) | Login, SSO handoff, assignments, quizzes, live games WebSockets | Implement or change user-facing flows |
| [module-map.md](./module-map.md) | Feature matrix, Spatie permissions, Redux slices, legacy `old-game`, known gaps | Scope a feature, map UI → API → DB |

---

## Applications at a Glance

| App | Path | Stack | Role |
|-----|------|-------|------|
| Backend | `abutabl-backend/` | Laravel 8, MySQL, JWT | API, auth, DB, WebSockets |
| Admin | `abutabl-admin/` | React 18, CRA, MUI 5 | School admin & teacher portal |
| Student | `abutabl-student/` | React 18, Vite, Mantine 6 | Student learning portal |
| Legacy | `old-game/` | Laravel Blade | Read-only reference — do not extend |

---

## Recommended Reading Order

```
1. MASTER_CONTEXT.md          ← constraints & workflow
2. docs/project-overview.md   ← where everything lives
3. Domain file(s) for your task:
   • DB work      → database-structure.md
   • API work     → api-reference.md
   • Flows/UX     → user-flows.md
   • New feature  → module-map.md (+ others as needed)
4. Impact Analysis → plan only, no code until approved
```

---

## Feature Request Prompt (copy-paste)

Use this when starting a new feature:

```
Read MASTER_CONTEXT.md and all relevant files in /docs.

For [FEATURE NAME]:
- Where does this feature belong?
- Which modules will be affected?
- Database changes required?
- API changes required?
- UI changes required (admin / student)?
- List every file that must be modified and why.
- Estimate risks.

Provide an implementation plan.
Do not write code yet.
```

---

## Supplementary Docs

| Document | Location | Notes |
|----------|----------|-------|
| Interactive games API | `abutabl-backend/docs/INTERACTIVE_GAMES.md` | Live games endpoint detail |
| Root redirects | `PROJECT_KNOWLEDGE.md`, `SYSTEM_ARCHITECTURE.md`, `FEATURE_MAP.md` | Point to this `/docs` folder |

---

## Key Constraints (quick reference)

- Auth header: `Authorizations: Bearer <JWT>` — **not** `Authorization`
- Every API call requires `apiSecret` header
- Admin API: `/api/*` · Student API: `/api/student/*`
- SCORM games (`games` table) ≠ live games (`interactive_games` table)
- Do not modify `old-game/` for new features

---

*Last updated: June 2026*
