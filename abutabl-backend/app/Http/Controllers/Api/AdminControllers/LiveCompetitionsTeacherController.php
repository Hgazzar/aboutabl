<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Support\LiveCompetitions\LiveCompetitionCatalogService;
use App\Support\LiveCompetitions\LiveCompetitionSessionService;
use App\Support\Ownership\OwnershipGate;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;
use Validator;

class LiveCompetitionsTeacherController extends Controller
{
    use GeneralTrait;

    /** @var LiveCompetitionCatalogService */
    protected $catalog;

    /** @var LiveCompetitionSessionService */
    protected $sessions;

    public function __construct(
        LiveCompetitionCatalogService $catalog,
        LiveCompetitionSessionService $sessions
    ) {
        auth()->setDefaultDriver('admin-api');
        $this->catalog = $catalog;
        $this->sessions = $sessions;
    }

    /**
     * Published live games entitled to the authenticated teacher's schools.
     * School scope uses GeneralTrait::SchoolsIDs() (schools_roles + teachers_grades).
     */
    public function available(Request $request)
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $schoolIds = $this->SchoolsIDs();
        $games = $this->catalog->availableForSchools($schoolIds);

        return $this->returnData('games', $games, '', 200);
    }

    /**
     * Create a lobby session for one authorized class.
     * Client may send live_game_id and class_id only. school_id is ignored.
     */
    public function storeSession(Request $request)
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $validator = Validator::make($request->all(), [
            'live_game_id' => 'required|integer|min:1',
            'class_id' => 'required|integer|min:1',
            'duration_minutes' => 'nullable|integer|min:1|max:60',
        ]);
        if ($validator->fails()) {
            return $this->returnValidationError($this->returnCodeAccordingToInput($validator), $validator);
        }

        try {
            $durationInput = $request->input('duration_minutes');
            $durationMinutes = $durationInput === null || $durationInput === ''
                ? null
                : (int) $durationInput;

            $session = $this->sessions->createLobbySession(
                (int) $user->id,
                (int) $request->input('live_game_id'),
                (int) $request->input('class_id'),
                $this->SchoolsIDs(),
                $durationMinutes
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

        return $this->returnData('session', $session, '', 201);
    }

    /**
     * List hosted lobby + playing sessions for recovery.
     * Ownership + current class access enforced in the service.
     */
    public function indexSessions()
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        return $this->returnData('sessions', $this->sessions->listLobbySessions((int) $user->id), '', 200);
    }

    public function showSession($id)
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        try {
            $lobby = $this->sessions->getLobby((int) $user->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            return $this->sessionError($ex);
        }

        return $this->returnData('lobby', $lobby, '', 200);
    }

    public function sessionStudents($id)
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        try {
            $students = $this->sessions->listEligibleStudents((int) $user->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            return $this->sessionError($ex);
        }

        return $this->returnData('students', $students, '', 200);
    }

    /**
     * Start a lobby session. Adapts standalone CompetitionController::start.
     */
    public function beginSession($id)
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        try {
            $session = $this->sessions->beginLobbySession((int) $user->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            return $this->sessionError($ex);
        }

        return $this->returnData('session', $session, '', 200);
    }

    /**
     * End a playing session. Owning teacher only. Idempotent when already ended.
     */
    public function endSession($id)
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        try {
            $host = $this->sessions->endSession((int) $user->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            return $this->sessionError($ex);
        }

        return $this->returnData('host', $host, '', 200);
    }

    /**
     * Cancel a lobby before Begin. Owning teacher only. Idempotent when already ended.
     */
    public function cancelLobbySession($id)
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        try {
            $host = $this->sessions->cancelLobbySession((int) $user->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            return $this->sessionError($ex);
        }

        return $this->returnData('host', $host, '', 200);
    }

    /**
     * Read-only teacher host board for lobby, playing, or ended sessions.
     */
    public function hostSession($id)
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        try {
            $host = $this->sessions->getHostPayload((int) $user->id, (int) $id);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            return $this->sessionError($ex);
        }

        return $this->returnData('host', $host, '', 200);
    }

    /**
     * Read-only per-student answer review for the owning teacher.
     * Additive — does not change host payload shape.
     */
    public function playerAnswers($id, $studentId)
    {
        $user = $this->requireTeacher();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        try {
            $review = $this->sessions->getPlayerAnswersReview(
                (int) $user->id,
                (int) $id,
                (int) $studentId
            );
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        } catch (RuntimeException $ex) {
            return $this->sessionError($ex);
        }

        return $this->returnData('review', $review, '', 200);
    }

    /**
     * @return \Illuminate\Contracts\Auth\Authenticatable|\Illuminate\Http\JsonResponse
     */
    private function requireTeacher()
    {
        $user = auth()->user();
        if (! $user || OwnershipGate::isAdminUser($user)) {
            return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
        }

        return $user;
    }

    private function sessionError(RuntimeException $ex)
    {
        $status = (int) $ex->getCode();
        if ($status < 400 || $status > 599) {
            $status = 400;
        }

        return $this->returnError((string) $status, $ex->getMessage(), $status);
    }
}
