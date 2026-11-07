<?php

namespace App\Support\LiveCompetitions;

use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionAnswer;
use App\Models\LiveGameSessionInvite;
use App\Models\LiveGameSessionPlayer;
use App\Models\LiveGameSessionQuestion;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Services\Notification\NotificationInboxService;
use App\Services\TeacherDashboardService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class LiveCompetitionSessionService
{
    private const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    private const CODE_LENGTH = 8;

    private const CODE_ATTEMPTS = 16;

    private const INVITE_CHUNK = 100;

    /** @var TeacherDashboardService */
    protected $classAccess;

    /** @var NotificationInboxService */
    protected $inbox;

    /** @var LiveCompetitionEngine */
    protected $engine;

    public function __construct(
        ?TeacherDashboardService $classAccess = null,
        ?NotificationInboxService $inbox = null,
        ?LiveCompetitionEngine $engine = null
    ) {
        $this->classAccess = $classAccess ?: app(TeacherDashboardService::class);
        $this->inbox = $inbox ?: app(NotificationInboxService::class);
        $this->engine = $engine ?: app(LiveCompetitionEngine::class);
    }

    /**
     * Create a lobby session for one authorized class.
     * School is taken from the class row, never from the client.
     *
     * @param  int[]  $teacherSchoolIds
     * @return array<string,mixed>
     */
    public function createLobbySession(
        int $teacherId,
        int $liveGameId,
        int $classId,
        array $teacherSchoolIds,
        ?int $durationMinutes = null
    ): array {
        if ($teacherId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($liveGameId <= 0 || $classId <= 0) {
            throw new InvalidArgumentException('live_game_id and class_id are required.');
        }

        if ($durationMinutes !== null) {
            if (
                $durationMinutes < LiveGameSession::DURATION_MINUTES_MIN
                || $durationMinutes > LiveGameSession::DURATION_MINUTES_MAX
            ) {
                throw new InvalidArgumentException(
                    'duration_minutes must be between '
                    .LiveGameSession::DURATION_MINUTES_MIN
                    .' and '
                    .LiveGameSession::DURATION_MINUTES_MAX
                    .'.'
                );
            }
        }

        $game = LiveGame::query()->with('questions')->find($liveGameId);
        if (! $game) {
            throw new RuntimeException('Game not found.', 404);
        }
        if (! $game->isPublished()) {
            throw new InvalidArgumentException('Game is not published.');
        }
        if ($game->questions->isEmpty()) {
            throw new InvalidArgumentException('Game has no questions.');
        }

        $created = DB::transaction(function () use ($teacherId, $game, $classId, $teacherSchoolIds, $durationMinutes) {
            $class = Classes::query()->where('id', $classId)->lockForUpdate()->first();
            if (! $class) {
                throw new RuntimeException('Class not found.', 404);
            }

            if (! $this->classAccess->hasClassAccess($teacherId, $classId)) {
                throw new RuntimeException('You are not authorized for this class.', 403);
            }

            $schoolId = (int) $class->school_id;
            if ($schoolId <= 0) {
                throw new InvalidArgumentException('Class has no school.');
            }
            if (! in_array($schoolId, $this->normalizeSchoolIds($teacherSchoolIds), true)) {
                throw new RuntimeException('You are not authorized for this class school.', 403);
            }
            if (! $game->isSelectableForSchool($schoolId)) {
                throw new InvalidArgumentException('Game is not entitled to this class school.');
            }

            $this->assertNoActiveSession($classId);

            $session = LiveGameSession::create([
                'code' => $this->allocateCode(),
                'live_game_id' => $game->id,
                'host_user_id' => $teacherId,
                'class_id' => $classId,
                'school_id' => $schoolId,
                'status' => LiveGameSession::STATUS_LOBBY,
                'current_question_index' => 0,
                'started_at' => null,
                'ends_at' => null,
                'duration_minutes' => $durationMinutes,
            ]);

            $this->insertSnapshots($session, $game->questions);

            $session->load('questions');
            if ($session->questions->count() !== $game->questions->count()) {
                throw new RuntimeException('Failed to snapshot session questions.');
            }

            $this->insertInvites($session, $classId);

            return $this->serializeCreatedSession($session);
        });

        $this->deliverSessionInviteNotifications((int) $created['id'], (string) $game->name);

        return $created;
    }

    /**
     * Student Join: accept a pending invite and create one player row.
     * Identity is the authenticated students.id only. Session is locked first.
     *
     * @return array{created: bool, join: array<string,mixed>}
     */
    public function joinLobbySession(int $studentId, int $sessionId): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        return DB::transaction(function () use ($studentId, $sessionId) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }

            $invite = LiveGameSessionInvite::query()
                ->where('live_game_session_id', (int) $session->id)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();
            if (! $invite) {
                throw new RuntimeException('Invitation not found.', 404);
            }

            $player = $this->findPlayer((int) $session->id, $studentId);
            if ((string) $invite->status === LiveGameSessionInvite::STATUS_ACCEPTED && $player) {
                return [
                    'created' => false,
                    'join' => $this->serializeJoin($session, $invite, $player),
                ];
            }

            if ((string) $session->status !== LiveGameSession::STATUS_LOBBY) {
                throw new RuntimeException('Session is not in lobby.', 409);
            }

            if ((string) $invite->status === LiveGameSessionInvite::STATUS_ACCEPTED && ! $player) {
                $createdPlayer = $this->createPlayer((int) $session->id, $studentId);

                return [
                    'created' => $createdPlayer['created'],
                    'join' => $this->serializeJoin($session, $invite, $createdPlayer['player']),
                ];
            }

            if ((string) $invite->status !== LiveGameSessionInvite::STATUS_PENDING) {
                throw new RuntimeException('Invitation is not pending.', 422);
            }

            if ($invite->expires_at !== null && $invite->expires_at->lte(now())) {
                throw new RuntimeException('Invitation has expired.', 422);
            }

            $active = Student::query()
                ->activeInClasses([(int) $session->class_id])
                ->where('id', $studentId)
                ->exists();
            if (! $active) {
                throw new RuntimeException('You are not an active member of this class.', 422);
            }

            $createdPlayer = $this->createPlayer((int) $session->id, $studentId);
            $invite->status = LiveGameSessionInvite::STATUS_ACCEPTED;
            $invite->accepted_at = now();
            $invite->save();

            return [
                'created' => $createdPlayer['created'],
                'join' => $this->serializeJoin($session->fresh(), $invite->fresh(), $createdPlayer['player']),
            ];
        });
    }

    /**
     * Read-only invite-scoped preview for the authenticated student.
     * Does not create/update invite, player, or session. No row locks.
     *
     * @return array<string,mixed>
     */
    public function getInvitePreview(int $studentId, int $sessionId): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Invitation not found.', 404);
        }

        $invite = LiveGameSessionInvite::query()
            ->where('live_game_session_id', $sessionId)
            ->where('student_id', $studentId)
            ->first();
        // Opaque 404: do not reveal whether the session exists.
        if (! $invite) {
            throw new RuntimeException('Invitation not found.', 404);
        }

        $session = LiveGameSession::query()->find($sessionId);
        if (! $session) {
            throw new RuntimeException('Invitation not found.', 404);
        }

        $player = $this->findPlayer((int) $session->id, $studentId);
        $joinability = $this->resolveInviteJoinability(
            $session,
            $invite,
            $studentId,
            $player,
            true
        );

        return $this->serializeInvitePreview(
            $session,
            $invite,
            $joinability['joined'],
            $joinability['can_join'],
            $joinability['block_reason']
        );
    }

    /**
     * Student invitation inbox. Sorted with joinable/active first, then by invited_at desc.
     * Optional page/per_page slices the sorted list (no schema change).
     * Lazy-finalizes playing sessions whose ends_at has passed (same path as teacher End).
     *
     * @return array{items: array<int,array<string,mixed>>, pagination: array{page:int,per_page:int,total:int,has_more:bool}}
     */
    public function listStudentInvitations(int $studentId, int $page = 1, int $perPage = 8): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }

        $page = max(1, $page);
        $perPage = max(1, min(50, $perPage));

        $invites = LiveGameSessionInvite::query()
            ->where('student_id', $studentId)
            ->with(['session' => function ($query) {
                $query->with('game')->withCount('questions');
            }])
            ->orderByDesc('invited_at')
            ->orderByDesc('id')
            ->get();

        $sessionIds = $invites
            ->pluck('live_game_session_id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->filter(function ($id) {
                return $id > 0;
            })
            ->unique()
            ->values()
            ->all();

        $playersBySession = [];
        if ($sessionIds !== []) {
            $playersBySession = LiveGameSessionPlayer::query()
                ->where('student_id', $studentId)
                ->whereIn('live_game_session_id', $sessionIds)
                ->get()
                ->keyBy(function ($player) {
                    return (int) $player->live_game_session_id;
                })
                ->all();
        }

        $student = Student::query()->find($studentId);
        $studentActive = $student && (string) $student->status === '1';
        $studentClassId = $student ? (int) $student->class_id : 0;

        $items = [];
        foreach ($invites as $invite) {
            /** @var LiveGameSession|null $session */
            $session = $invite->session;
            if (! $session) {
                continue;
            }
            $session = $this->autoEndIfExpired($session);
            $invite->setRelation('session', $session);

            $player = $playersBySession[(int) $session->id] ?? null;
            $activeInClass = $studentActive && $studentClassId === (int) $session->class_id;
            $joinability = $this->resolveInviteJoinability(
                $session,
                $invite,
                $studentId,
                $player,
                false,
                $activeInClass
            );

            $items[] = $this->serializeInvitePreview(
                $session,
                $invite,
                $joinability['joined'],
                $joinability['can_join'],
                $joinability['block_reason']
            );
        }

        usort($items, function (array $a, array $b) {
            $rankA = $this->invitationListSortRank($a);
            $rankB = $this->invitationListSortRank($b);
            if ($rankA !== $rankB) {
                return $rankA <=> $rankB;
            }
            $invitedA = (string) ($a['invite']['invited_at'] ?? '');
            $invitedB = (string) ($b['invite']['invited_at'] ?? '');

            return $invitedB <=> $invitedA;
        });

        $sorted = array_values($items);
        $total = count($sorted);
        $offset = ($page - 1) * $perPage;
        $slice = array_slice($sorted, $offset, $perPage);

        return [
            'items' => $slice,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'has_more' => ($offset + count($slice)) < $total,
            ],
        ];
    }

    /**
     * Teacher Begin: lock the session first, then apply standalone start() onto live_*.
     *
     * @return array<string,mixed>
     */
    /**
     * Teacher begin: owning teacher (host_user_id) + current class access.
     * Same authorization policy as Host and End.
     *
     * @return array<string,mixed>
     */
    public function beginLobbySession(int $teacherId, int $sessionId): array
    {
        if ($teacherId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        return DB::transaction(function () use ($teacherId, $sessionId) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }

            $this->assertOwningTeacher($teacherId, $session);

            if ((string) $session->status !== LiveGameSession::STATUS_LOBBY) {
                throw new RuntimeException('Session is not in lobby.', 409);
            }

            $session->load('game');
            $this->engine->startSession($session);

            return $this->serializeBegunSession($session->fresh());
        });
    }

    /**
     * Teacher end: owning teacher + class access. Idempotent when already ended.
     *
     * @return array<string,mixed>
     */
    public function endSession(int $teacherId, int $sessionId): array
    {
        if ($teacherId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        return DB::transaction(function () use ($teacherId, $sessionId) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }

            $this->assertOwningTeacher($teacherId, $session);

            if ((string) $session->status === LiveGameSession::STATUS_ENDED) {
                return $this->engine->payload($session->fresh());
            }
            if ((string) $session->status === LiveGameSession::STATUS_LOBBY) {
                throw new RuntimeException('Session is not in play.', 409);
            }
            if ((string) $session->status !== LiveGameSession::STATUS_PLAYING) {
                throw new RuntimeException('Session is not in play.', 409);
            }

            $session->load('game');
            $this->engine->finalize($session);

            return $this->engine->payload($session->fresh());
        });
    }

    /**
     * Cancel a lobby before Begin. Owning teacher only.
     * Marks the session ended (started_at stays null), revokes pending invites.
     * Does not run playing finalize. Idempotent when already cancelled/ended.
     *
     * @return array<string,mixed>
     */
    public function cancelLobbySession(int $teacherId, int $sessionId): array
    {
        if ($teacherId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        return DB::transaction(function () use ($teacherId, $sessionId) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }

            $this->assertOwningTeacher($teacherId, $session);

            if ((string) $session->status === LiveGameSession::STATUS_ENDED) {
                return $this->engine->payload($session->fresh());
            }
            if ((string) $session->status === LiveGameSession::STATUS_PLAYING) {
                throw new RuntimeException('Session is already in play.', 409);
            }
            if ((string) $session->status !== LiveGameSession::STATUS_LOBBY) {
                throw new RuntimeException('Session is not in lobby.', 409);
            }

            $now = now();
            LiveGameSessionInvite::query()
                ->where('live_game_session_id', (int) $session->id)
                ->where('status', LiveGameSessionInvite::STATUS_PENDING)
                ->update([
                    'status' => LiveGameSessionInvite::STATUS_REVOKED,
                    'revoked_at' => $now,
                ]);

            $session->update([
                'status' => LiveGameSession::STATUS_ENDED,
                'ends_at' => $now,
            ]);
            $session->increment('live_version');

            return $this->engine->payload($session->fresh());
        });
    }

    /**
     * Teacher host board. Supports lobby, playing, and ended.
     * Owning teacher + current class access.
     * Lazy-finalizes when playing and ends_at has passed (same path as teacher End).
     *
     * @return array<string,mixed>
     */
    public function getHostPayload(int $teacherId, int $sessionId): array
    {
        if ($teacherId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        $session = LiveGameSession::query()->find($sessionId);
        if (! $session) {
            throw new RuntimeException('Session not found.', 404);
        }

        $this->assertOwningTeacher($teacherId, $session);
        $session = $this->autoEndIfExpired($session);

        return $this->engine->payload($session);
    }

    /**
     * Teacher read-only review of one player's attempts against session snapshots.
     * Owning teacher + class access. Does not mutate host payload or session state.
     *
     * @return array<string,mixed>
     */
    public function getPlayerAnswersReview(int $teacherId, int $sessionId, int $studentId): array
    {
        if ($teacherId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }
        if ($studentId <= 0) {
            throw new RuntimeException('Player not found.', 404);
        }

        $session = LiveGameSession::query()->find($sessionId);
        if (! $session) {
            throw new RuntimeException('Session not found.', 404);
        }

        $this->assertOwningTeacher($teacherId, $session);

        $player = LiveGameSessionPlayer::query()
            ->where('live_game_session_id', $session->id)
            ->where('student_id', $studentId)
            ->first();
        if (! $player) {
            throw new RuntimeException('Player not found.', 404);
        }

        $player->load('student');
        $questions = $session->questions()->orderBy('sort_order')->orderBy('id')->get();
        $answers = LiveGameSessionAnswer::query()
            ->where('live_game_session_id', $session->id)
            ->where('student_id', $studentId)
            ->orderBy('id')
            ->get()
            ->groupBy('live_game_session_question_id');

        $ranked = $session->players()
            ->orderByDesc('score')
            ->orderByDesc('coins')
            ->orderBy('id')
            ->get();
        $rankIndex = $ranked->search(function ($row) use ($player) {
            return (int) $row->id === (int) $player->id;
        });

        $student = $player->student;

        return [
            'session' => [
                'id' => (int) $session->id,
                'code' => (string) $session->code,
                'status' => (string) $session->status,
                'live_game_id' => (int) $session->live_game_id,
                'class_id' => (int) $session->class_id,
            ],
            'student' => [
                'id' => (int) $studentId,
                'name' => $student ? (string) ($student->name ?: $student->name_ar ?: '') : null,
                'name_ar' => $student ? ($student->name_ar ? (string) $student->name_ar : null) : null,
                'photo' => $student ? ($student->photo ? (string) $student->photo : null) : null,
            ],
            'player' => [
                'player_id' => (int) $player->id,
                'score' => (int) $player->score,
                'coins' => (int) $player->coins,
                'streak' => (int) $player->streak,
                'rank' => $rankIndex === false ? null : $rankIndex + 1,
            ],
            'questions' => $questions->map(function (LiveGameSessionQuestion $snapshot) use ($answers) {
                $attempts = ($answers->get($snapshot->id) ?: collect())->values()->map(function (
                    LiveGameSessionAnswer $row
                ) {
                    return [
                        'id' => (int) $row->id,
                        'answer' => (string) $row->answer,
                        'correct' => (bool) $row->correct,
                        'timed_out' => (bool) $row->timed_out,
                        'is_retry' => (bool) $row->is_retry,
                        'is_reinforce' => (bool) $row->is_reinforce,
                        'attempt' => (int) $row->attempt,
                        'elapsed_ms' => $row->elapsed_ms !== null ? (int) $row->elapsed_ms : null,
                        'coins_delta' => (int) $row->coins_delta,
                        'created_at' => optional($row->created_at)->toDateTimeString(),
                    ];
                })->all();

                $everCorrect = collect($attempts)->contains(function (array $attempt) {
                    return ! empty($attempt['correct']) && empty($attempt['is_reinforce']);
                });

                return [
                    'id' => (int) $snapshot->id,
                    'sort_order' => (int) $snapshot->sort_order,
                    'question' => $snapshot->question,
                    'image' => $snapshot->image,
                    'voice_url' => $snapshot->voice_url,
                    'answer_type' => $snapshot->answer_type,
                    'choices' => $snapshot->choiceValues(),
                    'correct_answer' => (string) $snapshot->correct_answer,
                    'explanation' => $snapshot->explanation,
                    'answered' => count($attempts) > 0,
                    'ever_correct' => $everCorrect,
                    'attempts' => $attempts,
                ];
            })->values()->all(),
        ];
    }

    /**
     * Student answer: lock session first, then the player, then ported recordPlay.
     *
     * @return array<string,mixed>
     */
    public function answerSessionQuestion(
        int $studentId,
        int $sessionId,
        int $snapshotId,
        string $answer
    ): array {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }
        if ($snapshotId <= 0) {
            throw new RuntimeException('Question not found.', 404);
        }

        // Commit auto-end outside the play transaction so a 409 cannot roll it back.
        $this->autoEndExpiredSessionById($sessionId);

        return DB::transaction(function () use ($studentId, $sessionId, $snapshotId, $answer) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }
            if ((string) $session->status !== LiveGameSession::STATUS_PLAYING) {
                throw new RuntimeException('Competition is not active.', 409);
            }

            $player = LiveGameSessionPlayer::query()
                ->where('live_game_session_id', (int) $session->id)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();
            if (! $player) {
                throw new RuntimeException('You are not a player in this session.', 403);
            }

            $snapshot = LiveGameSessionQuestion::query()
                ->where('id', $snapshotId)
                ->where('live_game_session_id', (int) $session->id)
                ->first();
            if (! $snapshot) {
                throw new RuntimeException('Question not found.', 404);
            }

            // Client race: answer can arrive before start-question-clock commits.
            // Starting here keeps scoring fair (elapsed ≈ 0) and avoids a dead-end 409.
            if (! $player->question_started_at) {
                $player->question_started_at = now();
                $player->answered_current = false;
                $player->save();
            }

            $this->assertPlayableCurrentQuestion($session, $player, $snapshot);

            if ($player->isFrozen()) {
                throw new RuntimeException('Frozen! Wait a moment.', 409);
            }

            $isRetry = $player->isQueuedRetry((int) $snapshot->id);
            $already = $session->answers()
                ->where('student_id', $studentId)
                ->where('live_game_session_question_id', $snapshot->id)
                ->where('is_retry', $isRetry)
                ->where('is_reinforce', false)
                ->exists();
            if ($already || $player->reward_pending || $player->pending_reinforce) {
                throw new RuntimeException('Answer is not accepted.', 409);
            }

            $choices = $snapshot->choiceValues();
            if (! in_array($answer, $choices, true)) {
                throw new InvalidArgumentException('Invalid choice.');
            }

            $session->load('game');
            $elapsed = $this->engine->elapsedMs($player);
            $limitMs = $session->questionSeconds() * 1000;
            $timedOut = $elapsed >= $limitMs;
            $correct = ! $timedOut && $snapshot->isCorrectChoice($answer);

            $this->engine->recordPlay(
                $session,
                $player,
                $snapshot,
                $answer,
                $correct,
                $elapsed,
                $timedOut,
                $isRetry
            );
            $session->increment('live_version');

            return $this->serializeAnswer(
                $session->fresh(),
                $player->fresh(),
                $snapshot->fresh(),
                $answer,
                $correct,
                $timedOut
            );
        });
    }

    /**
     * Student timeout: session-first lock, standalone 750ms grace, forced miss via recordPlay.
     * Does not trust client elapsed time. Does not start the question clock.
     *
     * @return array<string,mixed>
     */
    public function timeoutSessionQuestion(int $studentId, int $sessionId, int $snapshotId): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }
        if ($snapshotId <= 0) {
            throw new RuntimeException('Question not found.', 404);
        }

        $this->autoEndExpiredSessionById($sessionId);

        return DB::transaction(function () use ($studentId, $sessionId, $snapshotId) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }
            if ((string) $session->status !== LiveGameSession::STATUS_PLAYING) {
                throw new RuntimeException('Competition is not active.', 409);
            }

            $player = LiveGameSessionPlayer::query()
                ->where('live_game_session_id', (int) $session->id)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();
            if (! $player) {
                throw new RuntimeException('You are not a player in this session.', 403);
            }

            $snapshot = LiveGameSessionQuestion::query()
                ->where('id', $snapshotId)
                ->where('live_game_session_id', (int) $session->id)
                ->first();
            if (! $snapshot) {
                throw new RuntimeException('Question not found.', 404);
            }

            $this->assertPlayableCurrentQuestion($session, $player, $snapshot);

            if ($player->isFrozen()) {
                throw new RuntimeException('Frozen! Wait a moment.', 409);
            }

            $isRetry = $player->isQueuedRetry((int) $snapshot->id);
            $already = $session->answers()
                ->where('student_id', $studentId)
                ->where('live_game_session_question_id', $snapshot->id)
                ->where('is_retry', $isRetry)
                ->where('is_reinforce', false)
                ->exists();
            if ($already || $player->reward_pending || $player->pending_reinforce) {
                throw new RuntimeException('Answer is not accepted.', 409);
            }

            $session->load('game');
            $elapsed = $this->engine->elapsedMs($player);
            $limitMs = $session->questionSeconds() * 1000;
            if ($elapsed + 750 < $limitMs) {
                throw new RuntimeException('Question timer has not expired.', 409);
            }

            $choices = $snapshot->choiceValues();
            $answer = $choices[0] ?? '';
            if ($answer === '' || ! in_array($answer, $choices, true)) {
                throw new InvalidArgumentException('Invalid choice.');
            }

            // Grace accepted: force timeout miss even if dummy first choice is correct.
            $timedOut = true;
            $correct = false;

            $this->engine->recordPlay(
                $session,
                $player,
                $snapshot,
                $answer,
                $correct,
                $elapsed,
                $timedOut,
                $isRetry
            );
            $session->increment('live_version');

            return $this->serializeAnswer(
                $session->fresh(),
                $player->fresh(),
                $snapshot->fresh(),
                $answer,
                $correct,
                $timedOut
            );
        });
    }

    /**
     * Student reinforce: lock session first, then the player, then ported reinforce.
     * Question comes from player.reinforce_question_id (snapshot PK).
     *
     * @return array<string,mixed>
     */
    public function reinforceSessionQuestion(int $studentId, int $sessionId, string $answer): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        $this->autoEndExpiredSessionById($sessionId);

        return DB::transaction(function () use ($studentId, $sessionId, $answer) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }
            if ((string) $session->status !== LiveGameSession::STATUS_PLAYING) {
                throw new RuntimeException('Competition is not active.', 409);
            }

            $player = LiveGameSessionPlayer::query()
                ->where('live_game_session_id', (int) $session->id)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();
            if (! $player) {
                throw new RuntimeException('You are not a player in this session.', 403);
            }
            if (! $player->pending_reinforce || ! $player->reinforce_question_id) {
                throw new RuntimeException('Answer is not accepted.', 409);
            }

            $snapshot = LiveGameSessionQuestion::query()
                ->where('id', (int) $player->reinforce_question_id)
                ->where('live_game_session_id', (int) $session->id)
                ->first();
            if (! $snapshot) {
                throw new RuntimeException('Question not found.', 404);
            }

            $result = $this->engine->reinforce($session, $player, $snapshot, $answer);
            $session->increment('live_version');
            $player = $player->fresh();

            return [
                'live_game_session_question_id' => (int) $snapshot->id,
                'answer' => $answer,
                'correct' => $result['correct'],
                'coins_awarded' => $result['coins'],
                'coins' => (int) $player->coins,
                'pending_reinforce' => (bool) $player->pending_reinforce,
            ];
        });
    }

    /**
     * Student claim-reward: lock session first, require playing, then the player, then claimReward.
     * Identity is the JWT student.
     *
     * @param  array<string,mixed>  $input
     * @return array<string,mixed>
     */
    public function claimSessionReward(int $studentId, int $sessionId, array $input): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        $this->autoEndExpiredSessionById($sessionId);

        return DB::transaction(function () use ($studentId, $sessionId, $input) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }
            if ((string) $session->status !== LiveGameSession::STATUS_PLAYING) {
                throw new RuntimeException('Competition is not active.', 409);
            }

            $player = LiveGameSessionPlayer::query()
                ->where('live_game_session_id', (int) $session->id)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();
            if (! $player) {
                throw new RuntimeException('You are not a player in this session.', 403);
            }
            if (! $player->reward_pending) {
                throw new RuntimeException('Reward is not pending.', 409);
            }

            $claimedType = $player->reward_type;
            $result = $this->engine->claimReward($session, $player, $input);
            $session->increment('live_version');
            $player = $player->fresh();

            return [
                'type' => $claimedType,
                'message' => $result['message'],
                'coins_awarded' => $result['delta'],
                'coins' => (int) $player->coins,
                'reward_pending' => (bool) $player->reward_pending,
                'shield' => (bool) $player->shield,
                'progress_penalty' => (int) $player->progress_penalty,
                'last_protocol' => $player->last_protocol,
            ];
        });
    }

    /**
     * Student use-power: lock session first, then the player, then ported usePower.
     * Requires status=playing. Identity is the JWT student.
     *
     * @return array<string,mixed>
     */
    public function useSessionPower(int $studentId, int $sessionId): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        $this->autoEndExpiredSessionById($sessionId);

        return DB::transaction(function () use ($studentId, $sessionId) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }
            if ((string) $session->status !== LiveGameSession::STATUS_PLAYING) {
                throw new RuntimeException('The round has not started.', 409);
            }

            $player = LiveGameSessionPlayer::query()
                ->where('live_game_session_id', (int) $session->id)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();
            if (! $player) {
                throw new RuntimeException('You are not a player in this session.', 403);
            }

            $result = $this->engine->usePower($session, $player);
            $session->increment('live_version');
            $player = $player->fresh();

            return [
                'power' => $player->power,
                'power_label' => $player->powerLabel(),
                'power_used' => (bool) $player->power_used,
                'shield' => (bool) $player->shield,
                'message' => $result['message'],
            ];
        });
    }

    /**
     * Student pick-password: lock session first, require playing, then theme/player checks.
     * Standalone requires hacking theme only (404 otherwise).
     * Validation errors are raised after the transaction so initialized options persist
     * while the session is still playing.
     *
     * @return array<string,mixed>
     */
    public function pickSessionPassword(int $studentId, int $sessionId, string $password): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        $this->autoEndExpiredSessionById($sessionId);

        $result = DB::transaction(function () use ($studentId, $sessionId, $password) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }
            if ((string) $session->status !== LiveGameSession::STATUS_PLAYING) {
                throw new RuntimeException('Competition is not active.', 409);
            }

            $player = LiveGameSessionPlayer::query()
                ->where('live_game_session_id', (int) $session->id)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();
            if (! $player) {
                throw new RuntimeException('You are not a player in this session.', 403);
            }

            $session->load('game');
            if ($session->themeType() !== 'hacking') {
                throw new RuntimeException('Not found.', 404);
            }

            $picked = $this->engine->pickPassword($player, $password);
            if ($picked['changed']) {
                $session->increment('live_version');
            }

            return $picked;
        });

        if (! empty($result['error'])) {
            throw new InvalidArgumentException($result['error']);
        }

        return [
            'has_password' => $result['has_password'],
            'password_options' => $result['password_options'],
            'already_selected' => ! $result['changed'] && $result['has_password'],
        ];
    }

    /**
     * Current student view. Does not write question_started_at.
     * May seed hacking password_options when empty so the pick UI has choices.
     * Lazy-finalizes when playing and ends_at has passed (same path as teacher End).
     *
     * @return array<string,mixed>
     */
    public function getCurrentQuestion(int $studentId, int $sessionId): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        $session = LiveGameSession::query()->where('id', $sessionId)->first();
        if (! $session) {
            throw new RuntimeException('Session not found.', 404);
        }

        $player = LiveGameSessionPlayer::query()
            ->where('live_game_session_id', (int) $session->id)
            ->where('student_id', $studentId)
            ->first();
        if (! $player) {
            throw new RuntimeException('You are not a player in this session.', 403);
        }

        $session = $this->autoEndIfExpired($session);
        $session->load('game');

        return $this->serializeCurrentView($session, $player);
    }

    /**
     * Start the question clock once for the authenticated player's current question.
     * Session-first lock. Idempotent when question_started_at is already set.
     *
     * @return array<string,mixed>
     */
    public function startQuestionClock(int $studentId, int $sessionId): array
    {
        if ($studentId <= 0) {
            throw new RuntimeException('Unauthenticated.', 401);
        }
        if ($sessionId <= 0) {
            throw new RuntimeException('Session not found.', 404);
        }

        $this->autoEndExpiredSessionById($sessionId);

        return DB::transaction(function () use ($studentId, $sessionId) {
            $session = LiveGameSession::query()
                ->where('id', $sessionId)
                ->lockForUpdate()
                ->first();
            if (! $session) {
                throw new RuntimeException('Session not found.', 404);
            }
            if ((string) $session->status !== LiveGameSession::STATUS_PLAYING) {
                throw new RuntimeException('Competition is not active.', 409);
            }

            $player = LiveGameSessionPlayer::query()
                ->where('live_game_session_id', (int) $session->id)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();
            if (! $player) {
                throw new RuntimeException('You are not a player in this session.', 403);
            }
            if ($player->reward_pending || $player->pending_reinforce) {
                throw new RuntimeException('Answer is not accepted.', 409);
            }

            $session->load('game');
            $question = $session->nextQuestionFor($player);
            if (! $question) {
                return $this->serializeCurrentView($session->fresh(), $player->fresh());
            }

            $limitMs = $session->questionSeconds() * 1000;
            $clockRunning = $player->question_started_at
                && $this->engine->elapsedMs($player) < $limitMs;

            if (! $clockRunning) {
                // Start/restart for this attempt only. Retries keep a first-attempt row,
                // so we must key off is_retry — otherwise retry clocks never start.
                $isRetry = $player->isQueuedRetry((int) $question->id);
                $attemptAnswered = $session->answers()
                    ->where('student_id', $studentId)
                    ->where('live_game_session_question_id', (int) $question->id)
                    ->where('is_reinforce', false)
                    ->where('is_retry', $isRetry)
                    ->exists();
                if (! $attemptAnswered) {
                    $player->question_started_at = now();
                    $player->answered_current = false;
                    $player->save();
                    $session->increment('live_version');
                }
            }

            return $this->serializeCurrentView($session->fresh(), $player->fresh());
        });
    }

    /**
     * Hosted active sessions the teacher may recover (lobby + playing).
     * Ownership (host_user_id) + current class assignment required.
     * Read-only — does not mutate session/player state or call Begin.
     *
     * @return list<array<string,mixed>>
     */
    public function listLobbySessions(int $teacherId): array
    {
        $classIds = $this->assignedClassIds($teacherId);
        if ($classIds === []) {
            return [];
        }

        return LiveGameSession::query()
            ->where('host_user_id', $teacherId)
            ->whereIn('status', LiveGameSession::ACTIVE_STATUSES)
            ->whereIn('class_id', $classIds)
            ->with(['game', 'class.grade'])
            ->withCount(['questions', 'players', 'invites'])
            ->latest()
            ->get()
            ->map(function (LiveGameSession $session) {
                $base = $this->serializeCreatedSession($session);
                $class = $session->class;
                $grade = $class ? $class->grade : null;

                return array_merge($base, [
                    'game_name' => $session->game ? (string) $session->game->name : null,
                    'game_type' => $session->game ? (string) $session->game->type : null,
                    'class_name' => $class ? (string) $class->name : null,
                    'grade_name' => $grade
                        ? (string) ($grade->name ?? $grade->name_en ?? $grade->name_ar ?? '')
                        : null,
                    'joined_player_count' => (int) ($session->players_count ?? 0),
                    'invited_total' => (int) ($session->invites_count ?? 0),
                ]);
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string,mixed>
     */
    public function getLobby(int $teacherId, int $sessionId): array
    {
        $session = $this->requireTeacherLobbySession($teacherId, $sessionId);
        $session->loadCount('questions');

        $eligibleStudents = $this->eligibleStudentsPayload($session);
        $totals = $this->sessionParticipationTotals((int) $session->id);

        return [
            'session' => $this->serializeCreatedSession($session),
            'eligible_students' => $eligibleStudents,
            'invited_total' => $totals['invited_total'],
            'joined_total' => $totals['joined_total'],
            'pending_total' => $totals['pending_total'],
        ];
    }

    /**
     * Active students in the session class, enriched with this session's
     * invite status and player-row join flag (additive fields only).
     *
     * Students who leave eligibility (inactive / wrong class) are omitted here
     * even if an invite row still exists; session totals on getLobby may still
     * count those invite/player rows.
     *
     * @return list<array<string,mixed>>
     */
    public function listEligibleStudents(int $teacherId, int $sessionId): array
    {
        $session = $this->requireTeacherLobbySession($teacherId, $sessionId);

        return $this->eligibleStudentsPayload($session);
    }

    private function requireTeacherLobbySession(int $teacherId, int $sessionId): LiveGameSession
    {
        $session = LiveGameSession::query()->find($sessionId);
        if (! $session) {
            throw new RuntimeException('Session not found.', 404);
        }
        if (! $this->classAccess->hasClassAccess($teacherId, (int) $session->class_id)) {
            throw new RuntimeException('You are not authorized for this session.', 403);
        }
        if (! $session->isLobby()) {
            throw new RuntimeException('Session is not in lobby.', 409);
        }

        return $session;
    }

    /**
     * @return int[]
     */
    private function assignedClassIds(int $teacherId): array
    {
        return TeachersGrades::query()
            ->assignedToTeacher($teacherId)
            ->pluck('class_id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->filter(function ($id) {
                return $id > 0;
            })
            ->unique()
            ->values()
            ->all();
    }

    /**
     * SSOT eligibility: students.class_id + status=1 (Student::activeInClasses).
     * Participation fields come only from this session's invites + players.
     *
     * @return list<array<string,mixed>>
     */
    private function eligibleStudentsPayload(LiveGameSession $session): array
    {
        $students = Student::query()
            ->activeInClasses([(int) $session->class_id])
            ->orderBy('id')
            ->get(['id', 'name', 'name_ar', 'photo', 'class_id', 'school_id']);

        $studentIds = $students->pluck('id')->map(function ($id) {
            return (int) $id;
        })->all();
        $sessionId = (int) $session->id;

        $invitesByStudentId = [];
        $joinedStudentIds = [];
        if ($studentIds !== []) {
            foreach (
                LiveGameSessionInvite::query()
                    ->where('live_game_session_id', $sessionId)
                    ->whereIn('student_id', $studentIds)
                    ->get(['student_id', 'status', 'accepted_at']) as $invite
            ) {
                $invitesByStudentId[(int) $invite->student_id] = $invite;
            }

            $joinedStudentIds = LiveGameSessionPlayer::query()
                ->where('live_game_session_id', $sessionId)
                ->whereIn('student_id', $studentIds)
                ->pluck('student_id')
                ->map(function ($id) {
                    return (int) $id;
                })
                ->flip()
                ->all();
        }

        return $students->map(function (Student $student) use ($invitesByStudentId, $joinedStudentIds) {
            $studentId = (int) $student->id;
            /** @var LiveGameSessionInvite|null $invite */
            $invite = $invitesByStudentId[$studentId] ?? null;

            return [
                'id' => $studentId,
                'name' => $student->name,
                'name_ar' => $student->name_ar,
                'photo' => $student->getRawOriginal('photo') ?? $student->photo,
                'class_id' => (int) $student->class_id,
                'school_id' => $student->school_id ? (int) $student->school_id : null,
                'invite_status' => $invite ? (string) $invite->status : null,
                'joined' => array_key_exists($studentId, $joinedStudentIds),
                'accepted_at' => ($invite && $invite->accepted_at)
                    ? $invite->accepted_at->toIso8601String()
                    : null,
            ];
        })->values()->all();
    }

    /**
     * Session-scoped participation totals (all invite/player rows for this session).
     * May include students no longer in eligible_students (e.g. became inactive).
     *
     * @return array{invited_total:int,joined_total:int,pending_total:int}
     */
    private function sessionParticipationTotals(int $sessionId): array
    {
        return [
            'invited_total' => (int) LiveGameSessionInvite::query()
                ->where('live_game_session_id', $sessionId)
                ->count(),
            'joined_total' => (int) LiveGameSessionPlayer::query()
                ->where('live_game_session_id', $sessionId)
                ->count(),
            'pending_total' => (int) LiveGameSessionInvite::query()
                ->where('live_game_session_id', $sessionId)
                ->where('status', LiveGameSessionInvite::STATUS_PENDING)
                ->count(),
        ];
    }

    /**
     * One pending invite per active class student. Recipients are never client-supplied.
     */
    private function insertInvites(LiveGameSession $session, int $classId): void
    {
        $studentIds = Student::query()
            ->activeInClasses([$classId])
            ->orderBy('id')
            ->pluck('id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->unique()
            ->filter(function ($id) {
                return $id > 0;
            })
            ->values()
            ->all();

        if ($studentIds === []) {
            return;
        }

        $now = now();
        $sessionId = (int) $session->id;
        $hostId = (int) $session->host_user_id;

        foreach (array_chunk($studentIds, self::INVITE_CHUNK) as $chunk) {
            foreach ($chunk as $studentId) {
                LiveGameSessionInvite::create([
                    'live_game_session_id' => $sessionId,
                    'student_id' => $studentId,
                    'invited_by' => $hostId,
                    'status' => LiveGameSessionInvite::STATUS_PENDING,
                    'invited_at' => $now,
                    'accepted_at' => null,
                    'revoked_at' => null,
                    'expires_at' => null,
                ]);
            }
        }
    }

    /**
     * Inbox rows after the session transaction commits. Failures must not
     * undo invitations. Idempotent via createIfMissing(type, type_id, recipient).
     * Durable queued retry is deferred — no new job/scheduler in this slice.
     */
    public function deliverSessionInviteNotifications(int $sessionId, ?string $gameName = null): void
    {
        if ($sessionId <= 0) {
            return;
        }

        $session = LiveGameSession::query()->find($sessionId);
        if (! $session) {
            return;
        }

        $title = trim((string) $gameName);
        if ($title === '') {
            $title = (string) (LiveGame::query()->where('id', $session->live_game_id)->value('name') ?: 'Live game');
        }

        $url = '/live-games/sessions/'.$sessionId;
        $hostId = (int) $session->host_user_id;

        LiveGameSessionInvite::query()
            ->where('live_game_session_id', $sessionId)
            ->where('status', LiveGameSessionInvite::STATUS_PENDING)
            ->orderBy('id')
            ->chunkById(self::INVITE_CHUNK, function ($invites) use ($title, $url, $hostId) {
                foreach ($invites as $invite) {
                    try {
                        $this->inbox->createIfMissing([
                            'title' => $title,
                            'description' => 'You are invited to join a live game.',
                            'from_user_type' => NotificationInboxService::TYPE_TEACHER,
                            'from_user_id' => $hostId,
                            'to_user_type' => NotificationInboxService::TYPE_STUDENT,
                            'to_user_id' => (int) $invite->student_id,
                            'url' => $url,
                            'type' => LiveGameSessionInvite::NOTIFICATION_TYPE,
                            'type_id' => (int) $invite->id,
                            'is_read' => 0,
                        ]);
                    } catch (Throwable $e) {
                        Log::warning('live_competition_invite notification failed', [
                            'invite_id' => (int) $invite->id,
                            'session_id' => (int) $invite->live_game_session_id,
                            'student_id' => (int) $invite->student_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });
    }

    /**
     * Shared answer/timeout lifecycle guard (C4 H2/H3).
     * Does not start the clock. Does not trust client elapsed time.
     * Answer path auto-starts the clock before calling this; timeout still requires it.
     */
    private function assertPlayableCurrentQuestion(
        LiveGameSession $session,
        LiveGameSessionPlayer $player,
        LiveGameSessionQuestion $snapshot
    ): void {
        $expected = $session->nextQuestionFor($player);
        if (! $expected || (int) $expected->id !== (int) $snapshot->id) {
            throw new RuntimeException('Answer is not accepted.', 409);
        }
        if (! $player->question_started_at) {
            throw new RuntimeException('Answer is not accepted.', 409);
        }
    }

    /**
     * @return LiveGameSessionPlayer|null
     */
    private function findPlayer(int $sessionId, int $studentId)
    {
        return LiveGameSessionPlayer::query()
            ->where('live_game_session_id', $sessionId)
            ->where('student_id', $studentId)
            ->first();
    }

    /**
     * Insert one player for this session/student. Unique collision is idempotent
     * only after verifying the existing row belongs to the same pair.
     *
     * @return array{created: bool, player: LiveGameSessionPlayer}
     */
    private function createPlayer(int $sessionId, int $studentId): array
    {
        try {
            $player = LiveGameSessionPlayer::create([
                'live_game_session_id' => $sessionId,
                'student_id' => $studentId,
            ]);

            return ['created' => true, 'player' => $player];
        } catch (QueryException $e) {
            if (! $this->isPlayerUniqueCollision($e)) {
                throw $e;
            }
            $player = $this->findPlayer($sessionId, $studentId);
            if (! $player) {
                throw $e;
            }

            return ['created' => false, 'player' => $player];
        }
    }

    private function isPlayerUniqueCollision(QueryException $e): bool
    {
        $sqlState = (string) ($e->errorInfo[0] ?? '');
        $driverCode = (int) ($e->errorInfo[1] ?? 0);
        $message = $e->getMessage();
        $isIntegrity = $sqlState === '23000' || $driverCode === 1062 || $driverCode === 19;
        if (! $isIntegrity) {
            return false;
        }

        return str_contains($message, 'lgsp_session_student_unique')
            || str_contains($message, 'live_game_session_players');
    }

    /**
     * @return array<string,mixed>
     */
    private function serializeJoin(
        LiveGameSession $session,
        LiveGameSessionInvite $invite,
        LiveGameSessionPlayer $player
    ): array {
        return [
            'session' => [
                'id' => (int) $session->id,
                'status' => $session->status,
                'live_game_id' => (int) $session->live_game_id,
                'class_id' => (int) $session->class_id,
                'school_id' => $session->school_id ? (int) $session->school_id : null,
            ],
            'invite' => [
                'id' => (int) $invite->id,
                'status' => $invite->status,
                'accepted_at' => $invite->accepted_at,
            ],
            'player' => [
                'id' => (int) $player->id,
                'student_id' => (int) $player->student_id,
            ],
        ];
    }

    /**
     * Joinability aligned with joinLobbySession / preview.
     * Strict mode (preview) throws for revoked/expired/inactive/pending-past-expires.
     * Soft mode (list) returns non-joinable rows without writing status.
     *
     * @param  LiveGameSessionPlayer|null  $player
     * @return array{joined: bool, can_join: bool, block_reason: string|null}
     */
    private function resolveInviteJoinability(
        LiveGameSession $session,
        LiveGameSessionInvite $invite,
        int $studentId,
        $player,
        bool $strict,
        ?bool $studentActiveInClass = null
    ): array {
        $inviteStatus = (string) $invite->status;
        $joined = $player !== null;
        $isLobby = (string) $session->status === LiveGameSession::STATUS_LOBBY;

        if ($inviteStatus === LiveGameSessionInvite::STATUS_REVOKED) {
            if ($strict) {
                throw new RuntimeException('Invitation is not pending.', 422);
            }

            return [
                'joined' => $joined,
                'can_join' => false,
                'block_reason' => 'invitation_revoked',
            ];
        }

        if ($inviteStatus === LiveGameSessionInvite::STATUS_EXPIRED) {
            if ($strict) {
                throw new RuntimeException('Invitation is not pending.', 422);
            }

            return [
                'joined' => $joined,
                'can_join' => false,
                'block_reason' => 'invitation_expired',
            ];
        }

        if ($inviteStatus !== LiveGameSessionInvite::STATUS_PENDING
            && $inviteStatus !== LiveGameSessionInvite::STATUS_ACCEPTED) {
            if ($strict) {
                throw new RuntimeException('Invitation is not pending.', 422);
            }

            return [
                'joined' => $joined,
                'can_join' => false,
                'block_reason' => 'invitation_not_joinable',
            ];
        }

        // Align can_join with joinLobbySession success paths (read-only; no mutations).
        // Accepted + player → idempotent Join (any status), but Preview/list must not show Join CTA.
        // Accepted + no player → Join repairs only while lobby (no class/expiry re-check on that path).
        if ($inviteStatus === LiveGameSessionInvite::STATUS_ACCEPTED) {
            if ($joined) {
                return [
                    'joined' => true,
                    'can_join' => false,
                    'block_reason' => 'invitation_already_accepted',
                ];
            }

            $canJoin = $isLobby;

            return [
                'joined' => false,
                'can_join' => $canJoin,
                'block_reason' => $canJoin ? null : 'session_not_joinable',
            ];
        }

        // Pending only below — mirrors Join pending gates (expiry + active class + lobby).
        if ($invite->expires_at !== null && $invite->expires_at->lte(now())) {
            if ($strict) {
                throw new RuntimeException('Invitation has expired.', 422);
            }

            return [
                'joined' => $joined,
                'can_join' => false,
                'block_reason' => 'invitation_expired',
            ];
        }

        $active = $studentActiveInClass;
        if ($active === null) {
            $active = Student::query()
                ->activeInClasses([(int) $session->class_id])
                ->where('id', $studentId)
                ->exists();
        }
        if (! $active) {
            if ($strict) {
                throw new RuntimeException('You are not an active member of this class.', 422);
            }

            return [
                'joined' => $joined,
                'can_join' => false,
                'block_reason' => 'not_active_in_class',
            ];
        }

        $canJoin = ! $joined && $isLobby;
        $blockReason = null;
        if (! $canJoin) {
            $blockReason = $joined ? 'invitation_already_accepted' : 'session_not_joinable';
        }

        return [
            'joined' => $joined,
            'can_join' => $canJoin,
            'block_reason' => $blockReason,
        ];
    }

    /**
     * Lower rank sorts first: actionable/active, then ended, then terminal invite states.
     *
     * @param  array<string,mixed>  $item
     */
    private function invitationListSortRank(array $item): int
    {
        $inviteStatus = (string) ($item['invite']['status'] ?? '');
        $sessionStatus = (string) ($item['session']['status'] ?? '');

        if ($inviteStatus === LiveGameSessionInvite::STATUS_REVOKED
            || $inviteStatus === LiveGameSessionInvite::STATUS_EXPIRED) {
            return 3;
        }
        if ($sessionStatus === LiveGameSession::STATUS_ENDED) {
            return 2;
        }
        if ($sessionStatus === LiveGameSession::STATUS_LOBBY
            || $sessionStatus === LiveGameSession::STATUS_PLAYING) {
            return 0;
        }

        return 1;
    }

    /**
     * Safe invite-screen / list payload. No code, questions, passwords, or internal ids.
     *
     * @return array<string,mixed>
     */
    private function serializeInvitePreview(
        LiveGameSession $session,
        LiveGameSessionInvite $invite,
        bool $joined,
        bool $canJoin,
        ?string $blockReason
    ): array {
        $session->loadMissing('game');
        $gameName = optional($session->game)->name;
        if (isset($session->questions_count)) {
            $questionTotal = (int) $session->questions_count;
        } elseif ($session->relationLoaded('questions')) {
            $questionTotal = $session->questions->count();
        } else {
            $questionTotal = $session->questionCount();
        }
        $sessionPayload = [
            'id' => (int) $session->id,
            'status' => (string) $session->status,
            'theme' => $session->themeType(),
            'game_name' => $gameName !== null && $gameName !== '' ? (string) $gameName : null,
            'question_total' => $questionTotal,
        ];
        if ($session->goal !== null && $session->goal !== '') {
            $sessionPayload['goal_label'] = $session->goalLabel();
        }

        return [
            'session' => $sessionPayload,
            'invite' => [
                'status' => (string) $invite->status,
                'invited_at' => $invite->invited_at,
                'accepted_at' => $invite->accepted_at,
                'expires_at' => $invite->expires_at,
            ],
            'joined' => $joined,
            'can_join' => $canJoin,
            'block_reason' => $canJoin ? null : $blockReason,
        ];
    }

    /**
     * @param  iterable<int,LiveGameQuestion>  $questions
     */
    protected function insertSnapshots(LiveGameSession $session, $questions): void
    {
        foreach ($questions as $question) {
            LiveGameSessionQuestion::create(array_merge(
                LiveGameSessionQuestion::snapshotFromCatalog($question),
                ['live_game_session_id' => $session->id]
            ));
        }
    }

    private function assertNoActiveSession(int $classId): void
    {
        $exists = LiveGameSession::query()
            ->active()
            ->where('class_id', $classId)
            ->exists();

        if ($exists) {
            throw new RuntimeException('An active session already exists for this class.', 409);
        }
    }

    /**
     * Owning teacher (host_user_id) must still have class access.
     */
    /**
     * Playing + ends_at in the past → due for auto-end.
     */
    private function sessionDurationExpired(LiveGameSession $session): bool
    {
        return (string) $session->status === LiveGameSession::STATUS_PLAYING
            && $session->ends_at !== null
            && $session->ends_at->lte(now());
    }

    /**
     * Play mutations: finalize expired sessions in their own transaction before the
     * play lock, so a subsequent 409 cannot roll back the End.
     */
    private function autoEndExpiredSessionById(int $sessionId): void
    {
        if ($sessionId <= 0) {
            return;
        }

        $session = LiveGameSession::query()->find($sessionId);
        if ($session) {
            $this->autoEndIfExpired($session);
        }
    }

    /**
     * Lazy auto-end for read paths (invitations / current / host) and play pre-flight.
     * Uses the same engine finalize path as teacher End. Idempotent under concurrent access.
     */
    private function autoEndIfExpired(LiveGameSession $session): LiveGameSession
    {
        if (! $this->sessionDurationExpired($session)) {
            return $session;
        }

        return DB::transaction(function () use ($session) {
            $locked = LiveGameSession::query()
                ->where('id', (int) $session->id)
                ->lockForUpdate()
                ->first();
            if (! $locked) {
                return $session;
            }
            if (! $this->sessionDurationExpired($locked)) {
                return $locked;
            }

            $locked->load('game');
            $this->engine->finalize($locked);

            return $locked->fresh() ?: $locked;
        });
    }

    private function assertOwningTeacher(int $teacherId, LiveGameSession $session): void
    {
        if ((int) $session->host_user_id !== $teacherId) {
            throw new RuntimeException('You are not authorized for this session.', 403);
        }
        if (! $this->classAccess->hasClassAccess($teacherId, (int) $session->class_id)) {
            throw new RuntimeException('You are not authorized for this session.', 403);
        }
    }

    /**
     * @param  int[]  $schoolIds
     * @return int[]
     */
    private function normalizeSchoolIds(array $schoolIds): array
    {
        $normalized = [];
        foreach ($schoolIds as $id) {
            $schoolId = (int) $id;
            if ($schoolId > 0) {
                $normalized[$schoolId] = $schoolId;
            }
        }

        return array_values($normalized);
    }

    private function allocateCode(): string
    {
        $max = strlen(self::CODE_ALPHABET) - 1;
        for ($attempt = 0; $attempt < self::CODE_ATTEMPTS; $attempt++) {
            $code = '';
            for ($i = 0; $i < self::CODE_LENGTH; $i++) {
                $code .= self::CODE_ALPHABET[random_int(0, $max)];
            }
            if (! LiveGameSession::query()->where('code', $code)->exists()) {
                return $code;
            }
        }

        throw new RuntimeException('Unable to allocate a session code.');
    }

    /**
     * Standalone arena gate order as a safe API payload. Read-only serialization.
     *
     * @return array<string,mixed>
     */
    private function serializeCurrentView(LiveGameSession $session, LiveGameSessionPlayer $player): array
    {
        $base = [
            'session_id' => (int) $session->id,
            'status' => (string) $session->status,
            'theme' => $session->themeType(),
            'live_version' => (int) $session->live_version,
            'score' => (int) $player->score,
            'coins' => (int) $player->coins,
            'streak' => (int) $player->streak,
            'power' => $player->power,
            'power_used' => (bool) $player->power_used,
            'power_label' => $player->power ? $player->powerLabel() : null,
            'frozen' => $player->isFrozen(),
            'frozen_seconds' => $player->frozenSecondsLeft(),
            'has_password' => (bool) $player->hack_password,
            'reward_pending' => (bool) $player->reward_pending,
            'pending_reinforce' => (bool) $player->pending_reinforce,
        ];

        if ((string) $session->status === LiveGameSession::STATUS_LOBBY) {
            return array_merge($base, ['mode' => 'lobby']);
        }

        if ((string) $session->status === LiveGameSession::STATUS_ENDED) {
            return array_merge($base, $this->serializeEndedPersonalResults($session, $player));
        }

        if ($session->themeType() === 'hacking' && ! $player->hack_password) {
            return array_merge($base, [
                'mode' => 'need_password',
                // Seed choices here — otherwise the student sees Confirm with an empty list.
                'password_options' => $this->engine->ensurePasswordOptions($player),
            ]);
        }

        if ($player->pending_reinforce && $player->reinforce_question_id) {
            return array_merge($base, $this->serializeReinforceMode($session, $player));
        }

        if ($player->reward_pending) {
            return array_merge($base, $this->serializeRewardMode($player));
        }

        if ((string) $session->status === LiveGameSession::STATUS_PLAYING) {
            $question = $session->nextQuestionFor($player);
            if ($question) {
                return array_merge($base, $this->serializeQuestionMode($session, $player, $question));
            }

            return array_merge($base, [
                'mode' => 'done',
                'done' => true,
            ]);
        }

        return array_merge($base, ['mode' => 'waiting']);
    }

    /**
     * Personal ended results for the authenticated student only.
     *
     * @return array<string,mixed>
     */
    private function serializeEndedPersonalResults(
        LiveGameSession $session,
        LiveGameSessionPlayer $player
    ): array {
        $max = $session->maxScore();
        $ranked = $session->players()->orderByDesc('score')->orderByDesc('coins')->orderBy('id')->get();
        $rankIndex = $ranked->search(function ($row) use ($player) {
            return (int) $row->id === (int) $player->id;
        });
        $rank = $rankIndex === false ? null : $rankIndex + 1;
        $visual = max(0, min(100, $player->progressPercent($max) - (int) $player->progress_penalty));
        $questionTotal = $session->questionCount();
        $accuracy = $questionTotal
            ? (int) round(((int) $player->score / $questionTotal) * 100)
            : 0;

        return [
            'mode' => 'done',
            'done' => true,
            'cancelled' => $session->started_at === null,
            'rank' => $rank,
            'score' => (int) $player->score,
            'coins' => (int) $player->coins,
            'best_streak' => (int) $player->best_streak,
            'streak' => (int) $player->streak,
            'progress' => round($visual, 1),
            'accuracy' => $accuracy,
            'question_total' => $questionTotal,
            'class_accuracy' => $session->class_accuracy !== null
                ? (float) $session->class_accuracy
                : null,
            'fire_lit' => (bool) $session->fire_lit,
            'fastest_ms' => $player->fastest_ms ? (int) $player->fastest_ms : null,
            'goal' => $session->goalKey(),
            'goal_label' => $session->goalLabel(),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function serializeQuestionMode(
        LiveGameSession $session,
        LiveGameSessionPlayer $player,
        LiveGameSessionQuestion $question
    ): array {
        $choices = $question->choiceValues();
        if ($player->power === 'fifty_fifty' && $player->power_used) {
            $choices = $this->engine->fiftyFiftyChoices($question, $choices);
        }

        $clockStarted = (bool) $player->question_started_at;
        $questionSeconds = $session->questionSeconds();
        $secondsLeft = $questionSeconds;
        if ($clockStarted) {
            $limitMs = $questionSeconds * 1000;
            $secondsLeft = max(0, ($limitMs - $this->engine->elapsedMs($player)) / 1000);
        }

        return [
            'mode' => 'question',
            'live_game_session_question_id' => (int) $question->id,
            'question' => $question->question,
            'image' => $question->image,
            'voice_url' => $question->voice_url,
            'answer_type' => $question->answer_type,
            'choices' => array_values($choices),
            'is_retry' => $player->isQueuedRetry((int) $question->id),
            'question_seconds' => $questionSeconds,
            'clock_started' => $clockStarted,
            'seconds_left' => $secondsLeft,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function serializeReinforceMode(LiveGameSession $session, LiveGameSessionPlayer $player): array
    {
        $snapshot = LiveGameSessionQuestion::query()
            ->where('id', (int) $player->reinforce_question_id)
            ->where('live_game_session_id', (int) $session->id)
            ->first();
        if (! $snapshot) {
            return [
                'mode' => 'waiting',
            ];
        }

        $lockIn = $player->lockInState();
        $choices = $lockIn['choices'] ?? [];
        if (count($choices) < 2) {
            $choices = $this->engine->fiftyFiftyChoices($snapshot, $snapshot->choiceValues());
        }

        return [
            'mode' => 'reinforce',
            'live_game_session_question_id' => (int) $snapshot->id,
            'question' => $snapshot->question,
            'image' => $snapshot->image,
            'voice_url' => $snapshot->voice_url,
            'answer_type' => $snapshot->answer_type,
            'choices' => array_values($choices),
            'explanation' => $snapshot->explanation,
            'wrong_answer' => $lockIn['wrong_answer'] ?? null,
            'timed_out' => (bool) ($lockIn['timed_out'] ?? false),
        ];
    }

    /**
     * Own reward UI only. Steal lists passwords/hints; never owner_id/real/raw reward_data.
     *
     * @return array<string,mixed>
     */
    private function serializeRewardMode(LiveGameSessionPlayer $player): array
    {
        $type = (string) $player->reward_type;
        $raw = $player->reward_data['options'] ?? [];
        $options = [];
        foreach (array_values($raw) as $index => $opt) {
            if (! is_array($opt)) {
                continue;
            }
            if ($type === 'steal') {
                $options[] = [
                    'password' => $opt['password'] ?? null,
                    'hint' => $opt['hint'] ?? null,
                ];
            } elseif ($type === 'gift') {
                $options[] = ['index' => $index];
            } elseif ($type === 'chest' && (($player->reward_data['scheme'] ?? '') === 'fixed_trio')) {
                // Amounts stay server-side until claim; FE only gets visual distinction.
                $options[] = [
                    'index' => $index,
                    'image' => $opt['image'] ?? null,
                ];
            } else {
                $row = [];
                foreach (['protocol', 'risk', 'image', 'label', 'hint'] as $key) {
                    if (array_key_exists($key, $opt) && $opt[$key] !== null) {
                        $row[$key] = $opt[$key];
                    }
                }
                $options[] = $row;
            }
        }

        return [
            'mode' => 'reward',
            'reward_type' => $type !== '' ? $type : null,
            'reward_options' => $options,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function serializeAnswer(
        LiveGameSession $session,
        LiveGameSessionPlayer $player,
        LiveGameSessionQuestion $snapshot,
        string $answer,
        bool $correct,
        bool $timedOut
    ): array {
        $last = $session->answers()
            ->where('student_id', (int) $player->student_id)
            ->where('live_game_session_question_id', (int) $snapshot->id)
            ->latest('id')
            ->first();

        return [
            'session_id' => (int) $session->id,
            'live_game_session_question_id' => (int) $snapshot->id,
            'answer' => $answer,
            'correct' => $correct,
            'timed_out' => $timedOut,
            'explanation' => $snapshot->explanation,
            'correct_answer' => $snapshot->correct_answer,
            'answer_type' => $snapshot->answer_type,
            'question' => $snapshot->question,
            'score' => (int) $player->score,
            'coins' => (int) $player->coins,
            'coins_awarded' => $last ? (int) $last->coins_delta : 0,
            'streak' => (int) $player->streak,
            'pending_reinforce' => (bool) $player->pending_reinforce,
            'reward_pending' => (bool) $player->reward_pending,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function serializeBegunSession(LiveGameSession $session): array
    {
        return [
            'id' => (int) $session->id,
            'status' => $session->status,
            'started_at' => $session->started_at,
            'ends_at' => $session->ends_at,
            'duration_minutes' => $session->duration_minutes !== null
                ? (int) $session->duration_minutes
                : null,
            'live_game_id' => (int) $session->live_game_id,
            'class_id' => (int) $session->class_id,
            'school_id' => $session->school_id ? (int) $session->school_id : null,
            'joined_player_count' => (int) $session->players()->count(),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function serializeCreatedSession(LiveGameSession $session): array
    {
        return [
            'id' => $session->id,
            'code' => $session->code,
            'status' => $session->status,
            'live_game_id' => (int) $session->live_game_id,
            'class_id' => (int) $session->class_id,
            'school_id' => (int) $session->school_id,
            'host_user_id' => (int) $session->host_user_id,
            'questions_count' => (int) ($session->questions_count ?? $session->questions()->count()),
            'duration_minutes' => $session->duration_minutes !== null
                ? (int) $session->duration_minutes
                : null,
            'started_at' => $session->started_at,
            'created_at' => $session->created_at,
        ];
    }
}
