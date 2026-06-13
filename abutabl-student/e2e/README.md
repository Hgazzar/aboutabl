# E2E Tests (Playwright)

End-to-end tests for the student app, aligned with the Student Account Browser Test Plan (see project docs).

## Prerequisites

- **Backend** running and reachable (the app uses `VITE_BASE_URL` from `.env` for API calls).
- **Student app** will be started automatically by Playwright unless you set `PLAYWRIGHT_BASE_URL` to an already-running app, or run with an existing dev server (see below).

## Running tests

### Option 1: Let Playwright start the app (default)

From the project root (`abutabl-student/`):

```bash
npm run test:e2e
```

Playwright will run `npm run dev`, wait for `http://localhost:5173` to be ready, then run the tests. Ensure port 5173 is free.

### Option 2: Use an already-running app

In one terminal, start the app:

```bash
npm run dev
```

In another terminal, point tests at it and run:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run test:e2e
```

Playwright will reuse the existing server (`reuseExistingServer: true` when not in CI).

### Option 3: Test against a deployed URL

```bash
PLAYWRIGHT_BASE_URL=https://your-student-app.example.com npm run test:e2e
```

## Authenticated tests

Several tests (Learn, Todo, Profile, Support, Notifications) require a logged-in student. They are **skipped** unless you provide:

- `PLAYWRIGHT_TEST_STUDENT_CODE` – student code (username)
- `PLAYWRIGHT_TEST_STUDENT_PASSWORD` – password

Example:

```bash
PLAYWRIGHT_TEST_STUDENT_CODE=428943 PLAYWRIGHT_TEST_STUDENT_PASSWORD=yourpass npm run test:e2e
```

Use a real student that exists in your backend (status = active, verified) and has at least one subject assigned for full coverage.

## Test scope

| Spec | Coverage |
|------|----------|
| `auth.spec.ts` | Login page, wrong credentials, correct login redirect, logout |
| `learn.spec.ts` | Learn page, sort, open subject (requires auth + subjects) |
| `todo.spec.ts` | Todo page (requires auth) |
| `profile.spec.ts` | Profile, edit profile modal, change password modal, logout (requires auth) |
| `support.spec.ts` | Support/tickets page (requires auth) |
| `notifications.spec.ts` | Post-login layout (requires auth) |

## Other commands

- **UI mode** (interactive): `npm run test:e2e:ui`
- **Single spec**: `npx playwright test e2e/auth.spec.ts`
- **Headed browser**: `npx playwright test --headed`
- **Debug**: `npx playwright test --debug`

## Test data (admin)

For full coverage, prepare data in the **admin dashboard** (same backend as the student app):

1. **School / grade / class** – Ensure the test student’s school has at least one grade and one class (and that the class is not full if you add more students).
2. **Subject** – Assign at least one subject to that school/grade so the student sees it under Learn. Add at least one unit, one lesson, and one quiz (subject- or unit-level) so “open subject” and quiz tests can run.
3. **Assignment (Todo)** – Create at least one assignment (assign) targeting the test student or their class/grade so the Todo page shows items.
4. **Student** – Create or pick a student; note **student code** (= username) and **password**. Set status = Active and ensure the account is verified (or run the verification flow once).
5. **Optional** – One support ticket created by this student (to test the ticket list in Support).

Use the same student code and password for `PLAYWRIGHT_TEST_STUDENT_CODE` and `PLAYWRIGHT_TEST_STUDENT_PASSWORD`.
