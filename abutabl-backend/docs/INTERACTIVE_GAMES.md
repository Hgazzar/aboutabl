# Interactive games (API)

Live classroom games use the `interactive_*` tables (not the SCORM `games` table).

## Admin (JWT `admin-api`)

Base path: **`/api/interactive-games`** (admin routes use the same `Route::prefix('api')` as `/api/school/list`, etc. — **not** `/api/admin/...`; requires `apiSecret` header + `Authorizations: Bearer` token like the rest of the admin SPA).

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/interactive-games` | List games with questions |
| GET | `/api/interactive-games/{id}` | Game detail |
| POST | `/api/interactive-games/{id}/start` | Broadcast “round started” on `private-student-online.{id}` |
| GET | `/api/interactive-games/{id}/facts` | Leaderboard + broadcast “round ended” |
| GET | `/api/interactive-games/{id}/students/{studentId}/answers` | Per-student answers (today) |

## Student (JWT `user-api`)

Base path: `/api/student/interactive-games`

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/student/interactive-games` | List |
| GET | `/api/student/interactive-games/{id}` | Summary (no correct answers) |
| GET | `/api/student/interactive-games/{id}/questions` | Questions for play (includes `correct_answer` + `explanation` for client feedback UI) |
| POST | `/api/student/interactive-games/answer` | Body: `game_id`, `question_id`, `answer` — correctness computed server-side |
| POST | `/api/student/interactive-games/{id}/password` | Body: `password` — stored encrypted (`game_password` on `students`) |
| GET | `/api/student/interactive-games/{id}/hacking` | Hacking / gold_quest decoy passwords |
| POST | `/api/student/interactive-games/hacking` | Body: `id` (target student id) — steal 15% coins |
| GET | `/api/student/interactive-games/{id}/gifts` | Gift screen meta |
| POST | `/api/student/interactive-games/{id}/gifts/pull` | Body: `variant` = `hacking` \| `gold_quest` — server random outcome + coin credit |
| POST | `/api/student/interactive-games/gifts` | Optional body `coins`; default +5 |
| GET | `/api/student/interactive-games/{id}/facts` | Top 3 (with names), my answers, `my_correct_count`, `questions_total`, `is_first_place` |
| GET | `/api/student/interactive-games/{id}/answer-list` | Current student’s answers |

## Env

- `INTERACTIVE_GAMES_ENABLED` — set `false` to 404 all routes above (default `true` in config).
- `BROADCAST_DRIVER=pusher` — for realtime.
- `PUSHER_APP_*` — use same app id/key/secret as `laravel-websockets` server.
- `PUSHER_APP_HOST`, `PUSHER_APP_PORT`, `PUSHER_APP_SCHEME` — e.g. `127.0.0.1`, `6001`, `http` for local websockets.

## Broadcasting auth

`POST /broadcasting/auth` uses middleware: `api`, `checkSecretApi`, `authenticateBroadcastJwt` (Bearer = admin or student JWT).

Echo clients must send header `apiSecret` (same as REST API).

## Websockets server

```bash
php artisan websockets:serve
```

## Reference implementation

The legacy Blade app in the repo root `game/` folder is **read-only backup**; parity was implemented against its routes and controllers conceptually — do not modify `game/` when changing this API.

## Quick SQL seed (optional)

```sql
INSERT INTO interactive_games (name, logo, time, type, status, created_by, created_at, updated_at)
VALUES ('Demo classic', NULL, '05:00', 'classic', 1, 1, NOW(), NOW());

SET @gid = LAST_INSERT_ID();

INSERT INTO interactive_game_questions
(interactive_game_id, question, correct_answer, explanation, answer1, answer2, answer3, answer4, image, voice_url, answer_type, sort_order, created_at, updated_at)
VALUES
(@gid, '2 + 2 = ?', '4', 'Basic addition.', '3', '4', '5', '6', NULL, NULL, 'text', 0, NOW(), NOW());
```
