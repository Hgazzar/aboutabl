<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;
use Validator;

class LiveCompetitionsStudentController extends Controller
{
    use GeneralTrait;

    /** @var LiveCompetitionSessionService */
    protected $sessions;

    public function __construct(LiveCompetitionSessionService $sessions)
    {
        auth()->setDefaultDriver('user-api');
        $this->sessions = $sessions;
    }

    /**
     * Accept the authenticated student's invitation and create a player row.
     * Identity is auth('user-api') only. Request body is ignored.
     */
    public function join($id)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        try {
            $result = $this->sessions->joinLobbySession((int) $student->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        $code = ! empty($result['created']) ? 201 : 200;

        return $this->returnData('join', $result['join'], '', $code);
    }

    /**
     * Read-only invite preview for the invitation screen (pre-Join).
     * Identity is auth('user-api') only. Does not mutate invite/player/session.
     */
    public function preview($id)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        try {
            $result = $this->sessions->getInvitePreview((int) $student->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        return $this->returnData('preview', $result, '', 200);
    }

    /**
     * Invitation list for the authenticated student.
     * Identity is auth('user-api') only. Does not mutate invite/player rows.
     * May lazy-finalize playing sessions whose ends_at has passed.
     * Query: page (default 1), per_page (default 8, max 50).
     */
    public function invitations()
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        $page = max(1, (int) request()->query('page', 1));
        $perPage = max(1, min(50, (int) request()->query('per_page', 8)));

        try {
            $result = $this->sessions->listStudentInvitations((int) $student->id, $page, $perPage);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        $response = $this->returnData('invitations', $result['items'], '', 200);
        $payload = $response->getData(true);
        $payload['pagination'] = $result['pagination'];

        return response()->json($payload, 200);
    }

    /**
     * Submit one answer against a session question snapshot.
     * Identity is auth('user-api') only. Client elapsed/student_id are ignored.
     */
    public function answer($id, Request $request)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        $validator = Validator::make($request->all(), [
            'live_game_session_question_id' => 'required|integer|min:1',
            'answer' => 'required|string',
        ]);
        if ($validator->fails()) {
            return $this->returnValidationError($this->returnCodeAccordingToInput($validator), $validator);
        }

        try {
            $result = $this->sessions->answerSessionQuestion(
                (int) $student->id,
                (int) $id,
                (int) $request->input('live_game_session_question_id'),
                (string) $request->input('answer')
            );
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        return $this->returnData('answer', $result, '', 200);
    }

    /**
     * Record a question timeout miss. Identity is auth('user-api') only.
     * Client elapsed/student_id are ignored; server clock + 750ms grace apply.
     */
    public function timeout($id, Request $request)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        $validator = Validator::make($request->all(), [
            'live_game_session_question_id' => 'required|integer|min:1',
        ]);
        if ($validator->fails()) {
            return $this->returnValidationError($this->returnCodeAccordingToInput($validator), $validator);
        }

        try {
            $result = $this->sessions->timeoutSessionQuestion(
                (int) $student->id,
                (int) $id,
                (int) $request->input('live_game_session_question_id')
            );
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        return $this->returnData('answer', $result, '', 200);
    }

    /**
     * Lock-in reinforce after a wrong answer. Question is player.reinforce_question_id.
     */
    public function reinforce($id, Request $request)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        $validator = Validator::make($request->all(), [
            'answer' => 'required|string',
        ]);
        if ($validator->fails()) {
            return $this->returnValidationError($this->returnCodeAccordingToInput($validator), $validator);
        }

        try {
            $result = $this->sessions->reinforceSessionQuestion(
                (int) $student->id,
                (int) $id,
                (string) $request->input('answer')
            );
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        return $this->returnData('reinforce', $result, '', 200);
    }

    /**
     * Claim a pending chest/protocol/steal/gift reward. Identity is auth('user-api') only.
     */
    public function claimReward($id, Request $request)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        try {
            $result = $this->sessions->claimSessionReward(
                (int) $student->id,
                (int) $id,
                $request->only(['choice', 'password'])
            );
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        return $this->returnData('claim', $result, '', 200);
    }

    /**
     * Activate the student's one-use power for this round. Identity is auth('user-api') only.
     */
    public function usePower($id)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        try {
            $result = $this->sessions->useSessionPower((int) $student->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        return $this->returnData('power', $result, '', 200);
    }

    /**
     * Pick a hacking-theme password from the player's options. Identity is auth('user-api') only.
     */
    public function pickPassword($id, Request $request)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        try {
            $result = $this->sessions->pickSessionPassword(
                (int) $student->id,
                (int) $id,
                (string) $request->input('password', '')
            );
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        return $this->returnData('password', $result, '', 200);
    }

    /**
     * Read-only current student view (mode + safe question/reward/password payload).
     */
    public function current($id)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        try {
            $result = $this->sessions->getCurrentQuestion((int) $student->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        return $this->returnData('current', $result, '', 200);
    }

    /**
     * Start the question clock once for the current playable question.
     */
    public function startQuestionClock($id)
    {
        $student = auth('user-api')->user();
        if (! $student) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        try {
            $result = $this->sessions->startQuestionClock((int) $student->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            $status = (int) $ex->getCode();
            if ($status < 400 || $status > 599) {
                $status = 400;
            }

            return $this->returnError((string) $status, $ex->getMessage(), $status);
        }

        return $this->returnData('current', $result, '', 200);
    }
}
