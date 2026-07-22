<?php

namespace App\Http\Controllers\Api\Student\QuizRuntime;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuizRuntime\ResumeAttemptRequest;
use App\Http\Requests\QuizRuntime\ReviewAttemptRequest;
use App\Http\Requests\QuizRuntime\SaveProgressRequest;
use App\Http\Requests\QuizRuntime\StartAttemptRequest;
use App\Http\Requests\QuizRuntime\StudentAttemptLookupRequest;
use App\Http\Requests\QuizRuntime\SubmitAttemptRequest;
use App\Http\Resources\QuizRuntime\AttemptPlayResource;
use App\Http\Resources\QuizRuntime\AttemptResource;
use App\Http\Resources\QuizRuntime\AttemptReviewResource;
use App\Http\Resources\QuizRuntime\AttemptSummaryResource;
use App\Http\Resources\QuizRuntime\ResultResource;
use App\Services\QuizRuntime\QuizAttemptStartService;
use App\Services\QuizRuntime\QuizProgressService;
use App\Services\QuizRuntime\QuizReviewService;
use App\Services\QuizRuntime\QuizStudentAttemptReadService;
use App\Services\QuizRuntime\QuizSubmitService;
use App\Traits\GeneralTrait;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

/**
 * Student Quiz Runtime HTTP (F-009D Sprint 1).
 * No business logic / no Eloquent access.
 * Finalize is internal — not exposed over HTTP.
 */
class StudentQuizRuntimeController extends Controller
{
    use GeneralTrait;

    /** @var QuizAttemptStartService */
    private $startService;

    /** @var QuizProgressService */
    private $progressService;

    /** @var QuizSubmitService */
    private $submitService;

    /** @var QuizReviewService */
    private $reviewService;

    /** @var QuizStudentAttemptReadService */
    private $attemptReadService;

    public function __construct(
        QuizAttemptStartService $startService,
        QuizProgressService $progressService,
        QuizSubmitService $submitService,
        QuizReviewService $reviewService,
        QuizStudentAttemptReadService $attemptReadService
    ) {
        auth()->setDefaultDriver('user-api');
        $this->startService = $startService;
        $this->progressService = $progressService;
        $this->submitService = $submitService;
        $this->reviewService = $reviewService;
        $this->attemptReadService = $attemptReadService;
    }

    /**
     * POST /api/student/quiz-runtime/attempts — Start or resume active attempt.
     */
    public function start(StartAttemptRequest $request)
    {
        try {
            $student = Auth::guard('user-api')->user();

            $attempt = $this->startService->start([
                'quiz_id' => (int) $request->input('quiz_id'),
                'student_id' => (int) $student->id,
                'school_id' => $student->school_id !== null ? (int) $student->school_id : null,
                'assign_student_id' => $request->input('assign_student_id'),
                'client_instance_id' => $request->input('client_instance_id'),
                'start_idempotency_key' => $request->header('Idempotency-Key')
                    ?: $request->header('idempotency-key'),
            ]);

            $payload = (new AttemptPlayResource($attempt))->resolve();
            $code = $attempt->wasRecentlyCreated ? 201 : 200;

            return $this->playResponse($payload, $code);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    /**
     * GET /api/student/quiz-runtime/attempts/active — Resume active attempt.
     */
    public function resume(ResumeAttemptRequest $request)
    {
        try {
            $student = Auth::guard('user-api')->user();

            $attempt = $this->startService->resume([
                'student_id' => (int) $student->id,
                'quiz_id' => (int) $request->input('quiz_id'),
                'assign_student_id' => $request->input('assign_student_id'),
            ]);

            $payload = (new AttemptPlayResource($attempt))->resolve();

            return $this->playResponse($payload, 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function playResponse(array $payload, int $code)
    {
        return response()->json([
            'status' => true,
            'errNum' => (string) $code,
            'msg' => '',
            'attempt' => $payload['attempt'],
            'play' => $payload['play'],
            'draft_answers' => $payload['draft_answers'] ?? [],
        ], $code);
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
                || stripos($message, 'not writable') !== false
                || stripos($message, 'not submittable') !== false
                || stripos($message, 'already submitted') !== false
            ) {
                $code = 409;
            } elseif (stripos($message, 'forbidden') !== false) {
                $code = 403;
            }
        }

        return $this->returnError((string) $code, $message, $code);
    }

    /**
     * PUT/PATCH /api/student/quiz-runtime/attempts/{attemptId}/answers — Save progress.
     */
    public function save(SaveProgressRequest $request, $attemptId)
    {
        try {
            $student = Auth::guard('user-api')->user();

            $answers = [];
            foreach ($request->input('answers', []) as $answer) {
                if (! is_array($answer)) {
                    continue;
                }

                $answers[] = [
                    'snapshot_question_key' => $answer['snapshot_question_key'] ?? '',
                    'question_id' => $answer['question_id'] ?? null,
                    'response_payload' => array_key_exists('response_payload', $answer)
                        ? $answer['response_payload']
                        : ($answer['response'] ?? null),
                ];
            }

            $student = Auth::guard('user-api')->user();

            $attempt = $this->progressService->save([
                'attempt_id' => (int) $attemptId,
                'student_id' => (int) $student->id,
                'row_version' => (int) $request->input('row_version'),
                'answers' => $answers,
            ]);

            $payload = (new AttemptResource($attempt))->resolve();

            return response()->json([
                'status' => true,
                'errNum' => '200',
                'msg' => '',
                'attempt_id' => $payload['attempt_id'],
                'last_saved_at' => $payload['last_saved_at'],
                'row_version' => $payload['row_version'],
                'server_now' => $payload['server_now'],
                'ends_at' => $payload['ends_at'],
            ], 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    /**
     * POST /api/student/quiz-runtime/attempts/{attemptId}/submit — Submit attempt.
     * Internally: Auto Grade → Finalize when pending_manual is false.
     */
    public function submit(SubmitAttemptRequest $request, $attemptId)
    {
        try {
            $student = Auth::guard('user-api')->user();

            $answers = [];
            foreach ($request->input('answers', []) ?: [] as $answer) {
                if (! is_array($answer)) {
                    continue;
                }

                $answers[] = [
                    'snapshot_question_key' => $answer['snapshot_question_key'] ?? '',
                    'question_id' => $answer['question_id'] ?? null,
                    'response_payload' => array_key_exists('response_payload', $answer)
                        ? $answer['response_payload']
                        : ($answer['response'] ?? null),
                ];
            }

            $outcome = $this->submitService->submit([
                'attempt_id' => (int) $attemptId,
                'student_id' => (int) $student->id,
                'row_version' => (int) $request->input('row_version'),
                'answers' => $answers,
                'client_submitted_at' => $request->input('client_submitted_at'),
                'submit_idempotency_key' => $request->header('Idempotency-Key')
                    ?: $request->header('idempotency-key'),
            ]);

            $payload = (new ResultResource($outcome))->resolve();

            return response()->json([
                'status' => true,
                'errNum' => '200',
                'msg' => '',
                'attempt_id' => $payload['attempt_id'],
                'score' => $payload['score'],
                'max_score' => $payload['max_score'],
                'percentage' => $payload['percentage'],
                'pending_manual' => $payload['pending_manual'],
                'attempt_status' => $payload['status'],
                'finalized_at' => $payload['finalized_at'],
                'pass' => $payload['pass'],
            ], 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    /**
     * GET /api/student/quiz-runtime/attempts/{attemptId}/review — Post-submission review.
     * Reads frozen Version settings + Snapshot + attempt answers only.
     */
    public function review(ReviewAttemptRequest $request, $attemptId)
    {
        try {
            $student = Auth::guard('user-api')->user();

            $outcome = $this->reviewService->review([
                'attempt_id' => (int) $attemptId,
                'student_id' => (int) $student->id,
            ]);

            $payload = (new AttemptReviewResource($outcome))->resolve();

            return response()->json([
                'status' => true,
                'errNum' => '200',
                'msg' => '',
                'attempt_id' => $payload['attempt_id'],
                'quiz_id' => $payload['quiz_id'],
                'attempt_status' => $payload['status'],
                'questions' => $payload['questions'],
            ], 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    /**
     * GET /api/student/quiz-runtime/attempts/latest — Latest attempt summary for a quiz.
     */
    public function latest(StudentAttemptLookupRequest $request)
    {
        try {
            $student = Auth::guard('user-api')->user();

            $outcome = $this->attemptReadService->latest([
                'quiz_id' => (int) $request->input('quiz_id'),
                'student_id' => (int) $student->id,
            ]);

            $payload = (new AttemptSummaryResource($outcome))->resolve();

            return response()->json([
                'status' => true,
                'errNum' => '200',
                'msg' => '',
                'attempt' => $payload,
            ], 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }

    /**
     * GET /api/student/quiz-runtime/attempts/history — Attempt history for a quiz.
     */
    public function history(StudentAttemptLookupRequest $request)
    {
        try {
            $student = Auth::guard('user-api')->user();

            $rows = $this->attemptReadService->history([
                'quiz_id' => (int) $request->input('quiz_id'),
                'student_id' => (int) $student->id,
            ]);

            $attempts = [];
            foreach ($rows as $row) {
                $attempts[] = (new AttemptSummaryResource($row))->resolve();
            }

            return response()->json([
                'status' => true,
                'errNum' => '200',
                'msg' => '',
                'attempts' => $attempts,
            ], 200);
        } catch (RuntimeException $ex) {
            return $this->runtimeExceptionResponse($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: '400', $ex->getMessage(), 400);
        }
    }
}
