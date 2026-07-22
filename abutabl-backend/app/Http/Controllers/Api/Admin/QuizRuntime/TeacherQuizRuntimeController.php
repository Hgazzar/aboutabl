<?php

namespace App\Http\Controllers\Api\Admin\QuizRuntime;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuizRuntime\ManualGradeRequest;
use App\Http\Requests\QuizRuntime\RegradeAttemptRequest;
use App\Http\Requests\QuizRuntime\TeacherGetAttemptRequest;
use App\Http\Requests\QuizRuntime\TeacherListAttemptsRequest;
use App\Http\Resources\QuizRuntime\ResultResource;
use App\Http\Resources\QuizRuntime\TeacherAttemptDetailResource;
use App\Http\Resources\QuizRuntime\TeacherAttemptListResource;
use App\Services\QuizRuntime\QuizManualGradingService;
use App\Services\QuizRuntime\QuizRegradeService;
use App\Services\QuizRuntime\QuizTeacherRuntimeReadService;
use App\Traits\GeneralTrait;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

/**
 * Teacher / Admin Quiz Runtime HTTP (F-009D Sprint 2).
 * Read + Manual Grade + Regrade. No Eloquent / no business logic in controller.
 */
class TeacherQuizRuntimeController extends Controller
{
    use GeneralTrait;

    /** @var QuizTeacherRuntimeReadService */
    private $readService;

    /** @var QuizManualGradingService */
    private $manualGradingService;

    /** @var QuizRegradeService */
    private $regradeService;

    public function __construct(
        QuizTeacherRuntimeReadService $readService,
        QuizManualGradingService $manualGradingService,
        QuizRegradeService $regradeService
    ) {
        auth()->setDefaultDriver('admin-api');
        $this->readService = $readService;
        $this->manualGradingService = $manualGradingService;
        $this->regradeService = $regradeService;
    }

    /**
     * GET /api/quiz-runtime/attempts
     */
    public function attempts(TeacherListAttemptsRequest $request)
    {
        try {
            $paginator = $this->readService->listAttempts([
                'teacher' => Auth::guard('admin-api')->user(),
                'quiz_id' => $request->input('quiz_id'),
                'student_id' => $request->input('student_id'),
                'assign_id' => $request->input('assign_id'),
                'status' => $request->input('status'),
                'per_page' => $request->input('per_page', 20),
            ]);

            $items = TeacherAttemptListResource::collection($paginator->getCollection())->resolve();

            return response()->json([
                'status' => true,
                'errNum' => '200',
                'msg' => '',
                'attempts' => $items,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
            ], 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    /**
     * GET /api/quiz-runtime/attempts/{attemptId}
     */
    public function attempt(TeacherGetAttemptRequest $request, $attemptId)
    {
        try {
            $outcome = $this->readService->getAttempt([
                'teacher' => Auth::guard('admin-api')->user(),
                'attempt_id' => (int) $attemptId,
            ]);

            $payload = (new TeacherAttemptDetailResource($outcome))->resolve();

            return response()->json([
                'status' => true,
                'errNum' => '200',
                'msg' => '',
                'attempt' => $payload['attempt'],
                'snapshot' => $payload['snapshot'],
                'answers' => $payload['answers'],
                'result' => $payload['result'],
            ], 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    /**
     * POST /api/quiz-runtime/attempts/{attemptId}/manual-grade
     */
    public function manualGrade(ManualGradeRequest $request, $attemptId)
    {
        try {
            $outcome = $this->manualGradingService->manualGrade([
                'teacher' => Auth::guard('admin-api')->user(),
                'attempt_id' => (int) $attemptId,
                'row_version' => (int) $request->input('row_version'),
                'grades' => $request->input('grades', []),
            ]);

            $payload = (new ResultResource($outcome))->resolve();

            return response()->json([
                'status' => true,
                'errNum' => '200',
                'msg' => '',
                'attempt_id' => $payload['attempt_id'],
                'attempt_status' => $payload['status'],
                'finalized_at' => $payload['finalized_at'],
                'score' => $payload['score'],
                'max_score' => $payload['max_score'],
                'percentage' => $payload['percentage'],
                'pending_manual' => $payload['pending_manual'],
                'pass' => $payload['pass'],
            ], 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    /**
     * POST /api/quiz-runtime/attempts/{attemptId}/regrade
     */
    public function regrade(RegradeAttemptRequest $request, $attemptId)
    {
        try {
            $outcome = $this->regradeService->regrade([
                'teacher' => Auth::guard('admin-api')->user(),
                'attempt_id' => (int) $attemptId,
                'reason' => $request->input('reason'),
                'mode' => $request->input('mode', 'snapshot_rules'),
            ]);

            $payload = (new ResultResource($outcome))->resolve();

            return response()->json([
                'status' => true,
                'errNum' => '200',
                'msg' => '',
                'attempt_id' => $payload['attempt_id'],
                'attempt_status' => $payload['status'],
                'finalized_at' => $payload['finalized_at'],
                'score' => $payload['score'],
                'max_score' => $payload['max_score'],
                'percentage' => $payload['percentage'],
                'pending_manual' => $payload['pending_manual'],
                'pass' => $payload['pass'],
            ], 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    private function runtimeExceptionResponse(RuntimeException $ex)
    {
        $message = $ex->getMessage();
        $code = (int) $ex->getCode();
        if ($code < 400 || $code > 599) {
            $code = 400;
            if (stripos($message, 'not found') !== false || stripos($message, 'missing') !== false) {
                $code = 404;
            } elseif (
                stripos($message, 'conflict') !== false
                || stripos($message, 'pending manual') !== false
                || stripos($message, 'already finalized') !== false
                || stripos($message, 'does not require') !== false
                || stripos($message, 'not pending') !== false
                || stripos($message, 'only finalized') !== false
                || stripos($message, 'not finalized') !== false
                || stripos($message, 'not authoritative') !== false
            ) {
                $code = 409;
            } elseif (stripos($message, 'forbidden') !== false
                || stripos($message, 'unauthenticated') !== false) {
                $code = 403;
            } elseif (stripos($message, 'required') !== false
                || stripos($message, 'exceeds') !== false
                || stripos($message, 'cannot be') !== false
                || stripos($message, 'not part of') !== false) {
                $code = 422;
            }
        }

        return $this->returnError((string) $code, $message, $code);
    }
}
