# Live Competitions catalog (Slice B)

Admin CMS for `live_games` / `live_game_questions` / `live_game_schools`.
Legacy `interactive-games` APIs and SCORM `games` are unchanged.

Feature flag: `LIVE_COMPETITIONS_ENABLED` (default `false`). All catalog endpoints return 404 when disabled.

## Excel workbook

Download: `GET /api/live-competitions/template` (admin JWT + `apiSecret` + flag on).

Three sheets:

1. **Readme** — instructions.
2. **Game** — exactly one metadata row.
3. **Questions** — one row per question.

### Game columns

| Column | Required | Notes |
|---|---|---|
| name | yes | Catalog title |
| time | yes | `mm:ss` / `h:mm`, example `10:00` |
| logo | no | File Management `name.ext` |
| type | yes | `classic`, `hacking`, or `gold_quest` |
| level | no | Integer 0–255 |
| background | no | File Management `name.ext` |

### Question columns

| Column | Required | Notes |
|---|---|---|
| sort_order | no | Defaults to Excel row offset; must be unique when set |
| question | yes | Question text |
| image | if `answer_type=image` | File Management `name.ext` |
| voice_url | no | File Management `name.ext` |
| answer_type | yes | `text` or `image` |
| correct_answer | yes | Must exactly equal one of answer1–4 after resolution |
| answer1–answer4 | yes | Text, or `name.ext` when `answer_type=image` |
| explanation | no | |

### Example

Game row:

`Classic | 10:00 | aboutabl-bird.svg | classic | 1 | classic-bg.jpg`

Question rows:

1. `1 | What do we need to start a campfire? | | | text | Wood | Sun | Rocks | Wood | Leaves | Fire needs fuel such as wood.`
2. `2 | Who is that animal | monkey.png | | image | monkey.png | bog.png | monkey.png | cat.png | rat.png |`

## Media rules

- Resolve only through `file_management` using `name` + `type` (`findFileByCell` convention).
- Physical files live under `storage/app/public/files_maanger/` (existing typo path).
- Catalog stores `storage/files_maanger/{hashName}`.
- Duplicate `name.type` rows fail closed.
- Missing / unregistered / missing-on-disk required media fails preview.
- Empty optional media is omitted (`null`). A filled cell that does not resolve is an error.
- Standalone `public/assets/...` files are **not** copied. Upload them to File Management first.
- Seed audio `/assets/monkey.mp3` and `/assets/112.mp3` were not present in the standalone `public/` tree.

## Import workflow

1. **Preview** `POST /api/live-competitions/import/preview` — parse + validate, no catalog writes, returns row errors, `preview_token`, and `preview_expires_at`.
2. **Confirm** `POST /api/live-competitions/import/confirm` with the same file + token — revalidates workbook and media, checks expiry/admin binding/content hash, consumes the token once, then persists an unpublished game with **no** school entitlements in one transaction.
3. Tokens last 10 minutes (`LIVE_COMPETITIONS_PREVIEW_TTL`). They are HMAC-signed, bound to the admin user id, and marked used under `storage/framework/cache/live-competitions-preview/` with an exclusive lock so a second confirm on the same app server fails. A failed persist still spends the token; preview again.

## Publish and entitlements

- `status` `0` unpublished, `1` published.
- Publishing does not grant schools.
- Empty `school_ids` means no school is authorized.
- A game is selectable for a school only when published **and** that school is entitled.

## Teacher catalog read (Slice C.1)

`GET /api/live-competitions/available` — admin-api JWT + `apiSecret` + flag on. **Teachers only** (`type !== admin`). School scope is `GeneralTrait::SchoolsIDs()` (`schools_roles` ∪ `teachers_grades`, fallback `users.school_id`). Returns published games entitled to those schools. Empty school list or no matching games → `games: []`. Does not expose import, publish, unpublish, or entitlement management.

## Teacher session create (Slice C.2)

`POST /api/live-competitions/sessions` — same auth as catalog read. Body: `live_game_id`, `class_id`. **`school_id` from the client is ignored.** School is `classes.school_id`. Class access is `TeacherDashboardService::hasClassAccess` (`teachers_grades.assignedToTeacher`, same membership as `resolveClassAccess`). Game must be published and entitled to that class school. Session is created in `lobby` with catalog question snapshots, never `playing`. One class per session. Application-level one-active (`lobby`/`playing`) check after locking the class row; the schema has no filtered unique index. No Begin or gameplay yet.

## Teacher lobby reads (Slice C.3)

Same teacher auth + flag. Class access is `hasClassAccess` on `session.class_id`.

- `GET /api/live-competitions/sessions` — lobby sessions for classes the teacher is assigned to teach.
- `GET /api/live-competitions/sessions/{id}` — lobby payload: session (no questions/answers) + eligible students.
- `GET /api/live-competitions/sessions/{id}/students` — eligible students only.

Eligible students SSOT: `students.class_id` + `status = 1` (`Student::activeInClasses`). Non-lobby sessions return 409. Lobby payloads never include question snapshots or correct answers.

### Invite / student join — stopped (schema)

`live_game_session_players` is unique on `(live_game_session_id, student_id)` but has **no** invited/joined discriminator (`joined_at`, status, or invites table). Overloading gameplay columns (`question_started_at`, `last_protocol`, `reward_type`) is unsafe for C.4. AbuTabl `notifications` are not a session-scoped unique invitation store.

Invite, join, and “which invitees have joined” are **not implemented**. No student live-competition routes. No new private broadcast channel (existing `student-online.{id}` authorizes any authenticated user). Teachers poll `GET .../sessions/{id}`.

Smallest additive migration (not created, not run): nullable `joined_at` on `live_game_session_players`. Invite inserts a player row (`joined_at` null); student join (student JWT, class membership, prior invite, lobby only) sets `joined_at`. Duplicate joins stay one row. Alternative: additive `live_game_session_invites` so players remain in-game participants only.
