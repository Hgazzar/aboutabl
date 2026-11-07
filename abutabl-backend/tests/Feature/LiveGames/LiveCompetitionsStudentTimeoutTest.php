<?php

namespace Tests\Feature\LiveGames;

use App\Http\Controllers\Api\StudentControllers\LiveCompetitionsStudentController;
use App\Models\Classes;
use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\LiveGameSession;
use App\Models\LiveGameSessionAnswer;
use App\Models\LiveGameSessionPlayer;
use App\Models\LiveGameSessionQuestion;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\Student;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Slice C.8B — student timeout. sqlite :memory: only; no migrate, no onesave.
 *
 * SQLite does not honor MySQL FOR UPDATE row locks, so these tests cannot
 * prove real concurrent timeout/answer safety. Lock ordering is asserted by
 * inspecting timeoutSessionQuestion source.
 */
class LiveCompetitionsStudentTimeoutTest extends TestCase
{
    /** @var string */
    private $previousDefault;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousDefault = config('database.default');
        config([
            'database.connections.live_competitions_test' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                'foreign_key_constraints' => true,
            ],
            'database.default' => 'live_competitions_test',
        ]);
        DB::purge('live_competitions_test');
        DB::reconnect('live_competitions_test');
        $this->createSchema();
        Schools::create(['id' => 5, 'name' => 'School Five']);
        Schools::create(['id' => 99, 'name' => 'School Other']);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        config(['database.default' => $this->previousDefault]);
        DB::purge('live_competitions_test');
        parent::tearDown();
    }

    public function test_timeout_after_expiry_records_forced_miss(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
            'streak' => 3,
            'score' => 2,
            'coins' => 40,
        ]);
        $versionBefore = (int) LiveGameSession::first()->live_version;
        $this->actingStudent(21);

        $response = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
            'student_id' => 99,
            'elapsed_ms' => 1,
        ]);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['status']);
        $this->assertTrue($payload['answer']['timed_out']);
        $this->assertFalse($payload['answer']['correct']);
        $this->assertSame(2, $payload['answer']['score']);
        $this->assertSame(0, $payload['answer']['streak']);
        $this->assertTrue($payload['answer']['pending_reinforce']);
        $this->assertSame(1, LiveGameSessionAnswer::count());

        $row = LiveGameSessionAnswer::first();
        $this->assertTrue((bool) $row->timed_out);
        $this->assertFalse((bool) $row->correct);
        $this->assertSame(0, (int) $row->coins_delta);
        $this->assertFalse((bool) $row->is_retry);
        $this->assertFalse((bool) $row->is_reinforce);
        $this->assertSame(1, (int) $row->attempt);
        $this->assertSame((int) $snapshot->id, (int) $row->live_game_session_question_id);
        $this->assertSame(21, (int) $row->student_id);
        $this->assertSame('Sun', $row->answer);

        $player = LiveGameSessionPlayer::first();
        $this->assertSame(2, (int) $player->score);
        $this->assertSame(40, (int) $player->coins);
        $this->assertSame(0, (int) $player->streak);
        $this->assertNull($player->question_started_at);
        $this->assertTrue((bool) $player->pending_reinforce);
        $this->assertSame((int) $snapshot->id, (int) $player->reinforce_question_id);
        $this->assertTrue((bool) ($player->lockInState()['timed_out'] ?? false));
        $this->assertNull($player->lockInState()['wrong_answer'] ?? null);
        $this->assertSame([(int) $snapshot->id], $player->retryQueue());
        $this->assertSame(0, (int) $player->answers_since_retry);
        $this->assertSame($versionBefore + 1, (int) LiveGameSession::first()->live_version);
    }

    public function test_grace_accepts_500ms_early_and_rejects_1000ms_early(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        $this->actingStudent(21);

        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subMilliseconds(19000),
        ]);
        $tooEarly = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ]);
        $this->assertSame(409, $tooEarly->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());
        $this->assertNotNull(LiveGameSessionPlayer::first()->question_started_at);

        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subMilliseconds(19500),
        ]);
        $accepted = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ]);
        $this->assertSame(200, $accepted->getStatusCode());
        $this->assertTrue($accepted->getData(true)['answer']['timed_out']);
        $this->assertFalse($accepted->getData(true)['answer']['correct']);
        $this->assertSame(1, LiveGameSessionAnswer::count());
        $this->assertSame(0, (int) LiveGameSessionPlayer::first()->score);
    }

    public function test_correct_first_choice_never_awards_points_on_timeout(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        $snapshot->answer1 = 'Wood';
        $snapshot->answer2 = 'Sun';
        $snapshot->correct_answer = 'Wood';
        $snapshot->save();
        $this->assertSame('Wood', $snapshot->fresh()->choiceValues()[0]);

        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
            'streak' => 2,
        ]);
        $this->actingStudent(21);

        $response = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ]);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('Wood', $payload['answer']['answer']);
        $this->assertTrue($payload['answer']['timed_out']);
        $this->assertFalse($payload['answer']['correct']);
        $this->assertSame(0, $payload['answer']['score']);
        $this->assertSame(0, $payload['answer']['streak']);
        $this->assertSame(0, (int) LiveGameSessionAnswer::first()->coins_delta);
        $this->assertFalse((bool) LiveGameSessionPlayer::first()->reward_pending);
        $this->assertSame(0, (int) LiveGameSession::first()->firewood);
    }

    public function test_repeated_timeout_is_rejected_with_one_answer_row(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
        ]);
        $this->actingStudent(21);

        $this->assertSame(200, $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ])->getStatusCode());

        $second = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ]);
        $this->assertSame(409, $second->getStatusCode());
        $this->assertSame(1, LiveGameSessionAnswer::count());
    }

    public function test_timeout_then_late_answer_is_rejected(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
        ]);
        $this->actingStudent(21);

        $this->assertSame(200, $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ])->getStatusCode());

        $late = $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
        ]);
        $this->assertSame(409, $late->getStatusCode());
        $this->assertSame(1, LiveGameSessionAnswer::count());
        $this->assertTrue((bool) LiveGameSessionAnswer::first()->timed_out);
    }

    public function test_answer_then_timeout_is_rejected(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(5),
        ]);
        $this->actingStudent(21);

        $this->assertSame(200, $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
        ])->getStatusCode());

        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
            'reward_pending' => false,
            'pending_reinforce' => false,
            'reinforce_question_id' => null,
            'reward_data' => null,
        ]);

        $timeout = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ]);
        $this->assertSame(409, $timeout->getStatusCode());
        $this->assertSame(1, LiveGameSessionAnswer::count());
        $this->assertFalse((bool) LiveGameSessionAnswer::first()->timed_out);
        $this->assertSame(1, (int) LiveGameSessionPlayer::first()->score);
    }

    public function test_retry_timeout_defers_retry_queue(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
        ]);
        $this->actingStudent(21);

        $this->assertSame(200, $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ])->getStatusCode());

        LiveGameSessionPlayer::query()->update([
            'pending_reinforce' => false,
            'reinforce_question_id' => null,
            'reward_data' => null,
            'answers_since_retry' => 2,
            'question_started_at' => $now->copy()->subSeconds(25),
            'streak' => 1,
        ]);

        $retryTimeout = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ]);
        $this->assertSame(200, $retryTimeout->getStatusCode());
        $this->assertSame(2, LiveGameSessionAnswer::count());
        $second = LiveGameSessionAnswer::query()->orderBy('id')->get()->last();
        $this->assertTrue((bool) $second->is_retry);
        $this->assertTrue((bool) $second->timed_out);
        $this->assertSame(2, (int) $second->attempt);
        $this->assertSame([(int) $snapshot->id], LiveGameSessionPlayer::first()->retryQueue());
        $this->assertSame(0, (int) LiveGameSessionPlayer::first()->answers_since_retry);
        $this->assertSame(0, (int) LiveGameSessionPlayer::first()->streak);
    }

    public function test_frozen_player_cannot_timeout(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
            'frozen_until' => $now->copy()->addSeconds(8),
        ]);
        $this->actingStudent(21);

        $response = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ]);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());
        $this->assertNotNull(LiveGameSessionPlayer::first()->question_started_at);
    }

    public function test_reward_and_reinforce_pending_reject_timeout(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        $this->actingStudent(21);

        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
            'reward_pending' => true,
            'reward_type' => 'chest',
        ]);
        $this->assertSame(409, $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ])->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());

        LiveGameSessionPlayer::query()->update([
            'reward_pending' => false,
            'reward_type' => null,
            'pending_reinforce' => true,
            'reinforce_question_id' => $snapshot->id,
        ]);
        $this->assertSame(409, $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ])->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());
    }

    public function test_missing_clock_rejects_timeout_without_initializing(): void
    {
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        $this->assertNull(LiveGameSessionPlayer::first()->question_started_at);
        $this->actingStudent(21);

        $response = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
        ]);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());
        $this->assertNull(LiveGameSessionPlayer::first()->question_started_at);
    }

    public function test_timeout_for_non_current_snapshot_returns_409_without_mutation(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $first = LiveGameSessionQuestion::query()->orderBy('sort_order')->orderBy('id')->first();
        $second = LiveGameSessionQuestion::create([
            'live_game_session_id' => $playing['id'],
            'live_game_question_id' => $first->live_game_question_id,
            'question' => 'Later question',
            'correct_answer' => 'Wood',
            'answer_type' => 'text',
            'answer1' => 'Sun',
            'answer2' => 'Wood',
            'answer3' => 'Rocks',
            'answer4' => 'Leaves',
            'explanation' => null,
            'sort_order' => ((int) $first->sort_order) + 10,
        ]);
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
        ]);
        $this->actingStudent(21);

        $response = $this->timeout($playing['id'], [
            'live_game_session_question_id' => $second->id,
        ]);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());
        $this->assertSame(0, (int) LiveGameSessionPlayer::first()->score);
    }

    public function test_foreign_snapshot_returns_404(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $first = $this->openPlaying([21]);
        $second = $this->openPlaying([22], 2);
        $foreign = LiveGameSessionQuestion::query()
            ->where('live_game_session_id', $second['id'])
            ->first();
        LiveGameSessionPlayer::query()
            ->where('live_game_session_id', $first['id'])
            ->update(['question_started_at' => $now->copy()->subSeconds(25)]);
        $this->actingStudent(21);

        $response = $this->timeout($first['id'], [
            'live_game_session_question_id' => $foreign->id,
        ]);
        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(0, LiveGameSessionAnswer::count());
    }

    public function test_late_real_answer_timeout_via_c6a_remains_unchanged(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
        ]);
        $this->actingStudent(21);

        $response = $this->answer($playing['id'], [
            'live_game_session_question_id' => $snapshot->id,
            'answer' => 'Wood',
            'elapsed_ms' => 1,
        ]);
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($payload['answer']['timed_out']);
        $this->assertFalse($payload['answer']['correct']);
        $this->assertSame(0, $payload['answer']['score']);
        $this->assertTrue((bool) LiveGameSessionAnswer::first()->timed_out);
        $this->assertFalse((bool) LiveGameSessionAnswer::first()->correct);
    }

    public function test_timeout_failure_rolls_back_player_and_answer(): void
    {
        $now = Carbon::parse('2026-10-31 12:00:00');
        Carbon::setTestNow($now);
        $playing = $this->openPlaying([21]);
        $snapshot = LiveGameSessionQuestion::query()->first();
        LiveGameSessionPlayer::query()->update([
            'question_started_at' => $now->copy()->subSeconds(25),
            'streak' => 4,
            'score' => 1,
        ]);
        $versionBefore = (int) LiveGameSession::first()->live_version;

        LiveGameSessionAnswer::creating(function () {
            throw new \RuntimeException('forced timeout failure');
        });

        try {
            $this->app->make(LiveCompetitionSessionService::class)
                ->timeoutSessionQuestion(21, (int) $playing['id'], (int) $snapshot->id);
            $this->fail('Expected timeout failure');
        } catch (\RuntimeException $ex) {
            $this->assertSame('forced timeout failure', $ex->getMessage());
        } finally {
            LiveGameSessionAnswer::flushEventListeners();
        }

        $this->assertSame(0, LiveGameSessionAnswer::count());
        $player = LiveGameSessionPlayer::first();
        $this->assertSame(1, (int) $player->score);
        $this->assertSame(4, (int) $player->streak);
        $this->assertNotNull($player->question_started_at);
        $this->assertFalse((bool) $player->pending_reinforce);
        $this->assertSame([], $player->retryQueue());
        $this->assertSame($versionBefore, (int) LiveGameSession::first()->live_version);
    }

    public function test_timeout_locks_session_before_player_rows(): void
    {
        $source = file_get_contents(app_path(
            'Support/LiveCompetitions/LiveCompetitionSessionService.php'
        ));
        $this->assertNotFalse($source);
        $body = $this->methodBody($source, 'timeoutSessionQuestion');

        $sessionQuery = strpos($body, 'LiveGameSession::query()');
        $sessionLock = strpos($body, 'lockForUpdate');
        $playerQuery = strpos($body, 'LiveGameSessionPlayer::query()');
        $this->assertNotFalse($sessionQuery);
        $this->assertNotFalse($sessionLock);
        $this->assertNotFalse($playerQuery);
        $this->assertLessThan($sessionLock, $sessionQuery);
        $this->assertLessThan($playerQuery, $sessionLock);
        $this->assertLessThan(strpos($body, 'recordPlay'), $playerQuery);
        $this->assertTrue(str_contains($body, '750'));
        $this->assertTrue(str_contains($body, '$timedOut = true'));
        $this->assertTrue(str_contains($body, '$correct = false'));
        $this->assertFalse(str_contains($body, 'question_started_at = now()'));
    }

    public function test_timeout_route_is_flagged_student_post(): void
    {
        $route = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/student/live-competitions/sessions/{id}/timeout'
                && in_array('POST', $route->methods(), true);
        });
        $this->assertNotNull($route);
        $middleware = $route->gatherMiddleware();
        $this->assertContains('ensureLiveCompetitionsEnabled', $middleware);
        $this->assertContains('checkStudentToken:user-api', $middleware);
        $this->assertContains('checkSecretApi', $middleware);
        $this->assertNotContains('ensureLiveCompetitionsAdminOnly', $middleware);
        $this->assertNotContains('checkUserToken:admin-api', $middleware);
    }

    public function test_unauthenticated_timeout_is_rejected(): void
    {
        $headers = [
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ];
        $this->withHeaders($headers)
            ->postJson('/api/student/live-competitions/sessions/1/timeout', [
                'live_game_session_question_id' => 1,
            ])
            ->assertStatus(401)
            ->assertJson(['status' => false, 'errNum' => 'E3001']);
    }

    /**
     * @param  int[]  $joinStudentIds
     * @return array<string,mixed>
     */
    private function openPlaying(array $joinStudentIds, int $classId = 1): array
    {
        $lobby = $this->openLobbyWithStudents($joinStudentIds, '10:00', $classId);
        $this->joinStudents($lobby['id'], $joinStudentIds);
        $this->actingTeacher(10);
        $this->app->make(LiveCompetitionSessionService::class)
            ->beginLobbySession(10, (int) $lobby['id']);

        return LiveGameSession::query()->find($lobby['id'])->toArray();
    }

    private function timeout($sessionId, array $body)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/timeout',
            'POST',
            $body
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->timeout($sessionId, $request);
    }

    private function answer($sessionId, array $body)
    {
        $request = Request::create(
            '/api/student/live-competitions/sessions/'.$sessionId.'/answers',
            'POST',
            $body
        );

        return $this->app->make(LiveCompetitionsStudentController::class)->answer($sessionId, $request);
    }

    /**
     * @param  int[]  $studentIds
     * @return array<string,mixed>
     */
    private function openLobbyWithStudents(array $studentIds, string $time = '10:00', int $classId = 1): array
    {
        $teacher = $this->actingTeacher(10);
        $this->assignClass($teacher->id, $classId, 5);
        foreach ($studentIds as $id) {
            $this->insertStudent($id, $classId, 5, '1', 'Student '.$id);
        }
        $game = $this->publishedEntitledGame(5, $time);

        return $this->app->make(LiveCompetitionSessionService::class)
            ->createLobbySession($teacher->id, $game->id, $classId, [5]);
    }

    /**
     * @param  int[]  $studentIds
     */
    private function joinStudents($sessionId, array $studentIds): void
    {
        $service = $this->app->make(LiveCompetitionSessionService::class);
        foreach ($studentIds as $studentId) {
            $service->joinLobbySession((int) $studentId, (int) $sessionId);
        }
    }

    private function actingTeacher(int $id): User
    {
        $existing = User::query()->find($id);
        $teacher = $existing ?: User::create([
            'id' => $id,
            'type' => 'teacher',
            'name' => 'Teacher '.$id,
            'school_id' => 5,
        ]);
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($teacher);

        return $teacher;
    }

    private function actingStudent(int $id): Student
    {
        $student = Student::query()->find($id);
        $this->app['auth']->shouldUse('user-api');
        $this->app['auth']->guard('user-api')->setUser($student);

        return $student;
    }

    private function assignClass(int $teacherId, int $classId, int $schoolId): void
    {
        if (! Classes::query()->where('id', $classId)->exists()) {
            Classes::create(['id' => $classId, 'school_id' => $schoolId, 'name' => 'Class '.$classId]);
        }
        if (! TeachersGrades::query()->where('user_id', $teacherId)->where('class_id', $classId)->exists()) {
            TeachersGrades::create([
                'user_id' => $teacherId,
                'school_id' => $schoolId,
                'class_id' => $classId,
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
            ]);
        }
        if (! SchoolsRoles::query()->where('user_id', $teacherId)->where('school_id', $schoolId)->exists()) {
            SchoolsRoles::create([
                'user_id' => $teacherId,
                'school_id' => $schoolId,
                'role_id' => 1,
                'status' => 1,
            ]);
        }
    }

    private function publishedEntitledGame(int $schoolId, string $time = '10:00'): LiveGame
    {
        $game = LiveGame::create([
            'name' => 'Entitled Classic',
            'time' => $time,
            'type' => 'classic',
            'level' => 1,
            'status' => LiveGame::STATUS_PUBLISHED,
            'created_by' => 1,
        ]);
        LiveGameSchool::create(['live_game_id' => $game->id, 'school_id' => $schoolId]);
        LiveGameQuestion::create([
            'live_game_id' => $game->id,
            'question' => 'What fuel?',
            'correct_answer' => 'Wood',
            'answer_type' => 'text',
            'answer1' => 'Sun',
            'answer2' => 'Wood',
            'answer3' => 'Rocks',
            'answer4' => 'Leaves',
            'explanation' => 'Trees burn.',
            'sort_order' => 1,
        ]);

        return $game->fresh(['questions']);
    }

    private function insertStudent(int $id, int $classId, int $schoolId, string $status, string $name): Student
    {
        if (! Classes::query()->where('id', $classId)->exists()) {
            Classes::create(['id' => $classId, 'school_id' => $schoolId, 'name' => 'Class '.$classId]);
        }
        $existing = Student::query()->find($id);
        if ($existing) {
            return $existing;
        }

        return Student::create([
            'id' => $id,
            'name' => $name,
            'name_ar' => $name,
            'class_id' => $classId,
            'school_id' => $schoolId,
            'status' => $status,
        ]);
    }

    private function methodBody(string $source, string $method): string
    {
        $start = strpos($source, 'function '.$method);
        $this->assertNotFalse($start, $method.' is missing');
        $brace = strpos($source, '{', $start);
        $this->assertNotFalse($brace);
        $depth = 0;
        $end = $brace;
        $length = strlen($source);
        for ($i = $brace; $i < $length; $i++) {
            if ($source[$i] === '{') {
                $depth++;
            } elseif ($source[$i] === '}') {
                $depth--;
                if ($depth === 0) {
                    $end = $i;
                    break;
                }
            }
        }

        return substr($source, $brace, $end - $brace + 1);
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->string('name')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->timestamps();
        });
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('name_ar')->nullable();
            $table->timestamps();
        });
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('name')->nullable();
            $table->timestamps();
        });
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('name_ar')->nullable();
            $table->string('photo')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });
        Schema::create('schools_roles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('role_id')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
        });
        Schema::create('teachers_grades', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('grade_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
        });
        Schema::create('live_games', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('time', 16)->default('05:00');
            $table->string('logo')->nullable();
            $table->string('type', 32)->nullable();
            $table->unsignedTinyInteger('level')->nullable();
            $table->string('background')->nullable();
            $table->unsignedTinyInteger('status')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
        Schema::create('live_game_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_id');
            $table->text('question')->nullable();
            $table->text('image')->nullable();
            $table->text('voice_url')->nullable();
            $table->string('correct_answer')->nullable();
            $table->string('answer_type')->nullable();
            $table->string('answer1')->nullable();
            $table->string('answer2')->nullable();
            $table->string('answer3')->nullable();
            $table->string('answer4')->nullable();
            $table->text('explanation')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
        Schema::create('live_game_schools', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_id');
            $table->unsignedBigInteger('school_id');
            $table->timestamps();
        });
        Schema::create('live_game_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 8)->unique();
            $table->unsignedBigInteger('live_game_id');
            $table->unsignedBigInteger('host_user_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('status')->default('lobby');
            $table->unsignedInteger('current_question_index')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->string('goal')->default('comprehension');
            $table->unsignedTinyInteger('question_seconds')->default(20);
            $table->boolean('team_mode')->default(false);
            $table->unsignedInteger('firewood')->default(0);
            $table->boolean('fire_lit')->default(false);
            $table->string('active_event')->nullable();
            $table->unsignedInteger('live_version')->default(0);
            $table->boolean('firewall_active')->default(false);
            $table->boolean('bridge_broken')->default(false);
            $table->decimal('class_accuracy', 5, 2)->nullable();
            $table->timestamps();
        });
        Schema::create('live_game_session_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('live_game_question_id')->nullable();
            $table->text('question')->nullable();
            $table->text('image')->nullable();
            $table->text('voice_url')->nullable();
            $table->string('correct_answer');
            $table->string('answer_type')->nullable();
            $table->string('answer1');
            $table->string('answer2');
            $table->string('answer3');
            $table->string('answer4');
            $table->text('explanation')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
        Schema::create('live_game_session_invites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('invited_by');
            $table->string('status', 16)->default('pending');
            $table->timestamp('invited_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->unique(['live_game_session_id', 'student_id']);
        });
        Schema::create('live_game_session_teams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->string('name');
            $table->string('color')->default('#f4c430');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('coins')->default(0);
            $table->timestamps();
        });
        Schema::create('live_game_session_players', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('coins')->default(0);
            $table->unsignedTinyInteger('character_slot')->default(0);
            $table->boolean('answered_current')->default(false);
            $table->string('hack_password')->nullable();
            $table->json('password_options')->nullable();
            $table->string('reward_type')->nullable();
            $table->json('reward_data')->nullable();
            $table->boolean('reward_pending')->default(false);
            $table->unsignedInteger('streak')->default(0);
            $table->unsignedInteger('best_streak')->default(0);
            $table->string('power')->nullable();
            $table->boolean('power_used')->default(false);
            $table->timestamp('frozen_until')->nullable();
            $table->boolean('shield')->default(false);
            $table->unsignedBigInteger('team_id')->nullable();
            $table->json('retry_queue')->nullable();
            $table->unsignedInteger('answers_since_retry')->default(0);
            $table->boolean('pending_reinforce')->default(false);
            $table->unsignedBigInteger('reinforce_question_id')->nullable();
            $table->timestamp('question_started_at')->nullable();
            $table->unsignedInteger('fastest_ms')->nullable();
            $table->integer('progress_penalty')->default(0);
            $table->string('last_protocol')->nullable();
            $table->timestamps();
            $table->unique(['live_game_session_id', 'student_id']);
        });
        Schema::create('live_game_session_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('live_game_session_question_id');
            $table->string('answer');
            $table->boolean('correct')->default(false);
            $table->integer('coins_delta')->default(0);
            $table->unsignedInteger('elapsed_ms')->nullable();
            $table->boolean('timed_out')->default(false);
            $table->boolean('is_retry')->default(false);
            $table->boolean('is_reinforce')->default(false);
            $table->unsignedTinyInteger('attempt')->default(1);
            $table->timestamps();
        });
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('from_user_type')->nullable();
            $table->unsignedBigInteger('from_user_id')->nullable();
            $table->unsignedBigInteger('to_user_id');
            $table->string('to_user_type')->nullable();
            $table->string('title')->nullable();
            $table->string('description', 1000)->nullable();
            $table->string('url', 1000)->nullable();
            $table->string('type')->nullable();
            $table->unsignedBigInteger('type_id')->nullable();
            $table->boolean('is_read')->default(0);
            $table->timestamps();
        });
    }
}
