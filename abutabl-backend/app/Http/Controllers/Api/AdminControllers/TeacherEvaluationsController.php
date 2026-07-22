<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Services\TeacherEvaluationService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TeacherEvaluationsController extends Controller
{
    use GeneralTrait;

    /** @var TeacherEvaluationService */
    private $evaluationService;

    public function __construct(TeacherEvaluationService $evaluationService)
    {
        // Same as TeacherClassesController — must run before throttle middleware
        // resolves $request->user() (default "web" guard has a missing provider).
        auth()->setDefaultDriver('admin-api');
        $this->evaluationService = $evaluationService;
    }

    /**
     * Evaluation history for a student in a class (newest first).
     */
    public function index(Request $request, int $classId, int $studentId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $payload = $this->evaluationService->listForStudent(
                (int) $user->id,
                $this->SchoolsIDs(),
                $classId,
                $studentId
            );

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Latest evaluation only.
     */
    public function latest(Request $request, int $classId, int $studentId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $latest = $this->evaluationService->latestForStudent(
                (int) $user->id,
                $this->SchoolsIDs(),
                $classId,
                $studentId
            );

            return response()->json([
                'status'  => true,
                'latest'  => $latest,
                'available' => $latest !== null,
            ], 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    public function store(Request $request, int $classId, int $studentId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $validator = Validator::make($request->all(), [
                'note' => 'required|string|min:1|max:5000',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            $item = $this->evaluationService->create(
                (int) $user->id,
                $this->SchoolsIDs(),
                $classId,
                $studentId,
                trim((string) $request->input('note'))
            );

            return response()->json([
                'status' => true,
                'item'   => $item,
            ], 201);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    public function update(Request $request, int $classId, int $studentId, int $evaluationId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $validator = Validator::make($request->all(), [
                'note' => 'required|string|min:1|max:5000',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            $item = $this->evaluationService->update(
                (int) $user->id,
                $this->SchoolsIDs(),
                $classId,
                $studentId,
                $evaluationId,
                trim((string) $request->input('note'))
            );

            return response()->json([
                'status' => true,
                'item'   => $item,
            ], 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    public function destroy(Request $request, int $classId, int $studentId, int $evaluationId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $this->evaluationService->delete(
                (int) $user->id,
                $this->SchoolsIDs(),
                $classId,
                $studentId,
                $evaluationId
            );

            return response()->json([
                'status'  => true,
                'deleted' => true,
            ], 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }
}
