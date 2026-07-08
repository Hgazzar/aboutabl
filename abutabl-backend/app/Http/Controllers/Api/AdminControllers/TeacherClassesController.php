<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherClassOverviewResource;
use App\Services\TeacherDashboardService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use Validator;

class TeacherClassesController extends Controller
{
    use GeneralTrait;

    /** @var TeacherDashboardService */
    private $dashboardService;

    public function __construct(TeacherDashboardService $dashboardService)
    {
        auth()->setDefaultDriver('admin-api');
        $this->dashboardService = $dashboardService;
    }

    /**
     * Classes Overview screen — grid/list cards for the authenticated teacher.
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $validator = Validator::make($request->all(), [
                'class_id' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            $classIdFilter = $request->filled('class_id') ? (int) $request->class_id : null;
            $schoolIds = $this->SchoolsIDs();

            $payload = $this->dashboardService->buildClassesOverview(
                (int) $user->id,
                $schoolIds,
                $classIdFilter
            );

            if ($payload === null) {
                return response()->json([
                    'status'  => true,
                    'meta'    => [
                        'total'    => 0,
                        'filter'   => $classIdFilter ? 'single' : 'all',
                        'class_id' => $classIdFilter,
                    ],
                    'classes' => [],
                ], 200);
            }

            return response()->json([
                'status'  => true,
                'meta'    => $payload['meta'],
                'classes' => TeacherClassOverviewResource::collection($payload['classes'])->resolve(),
            ], 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Class Details — Overview tab payload for a single class.
     */
    public function overview(Request $request, int $classId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $validator = Validator::make($request->all(), [
                'range' => 'nullable|in:week,month,term',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            $range = $request->input('range', 'week');
            $schoolIds = $this->SchoolsIDs();

            $payload = $this->dashboardService->buildClassDetailsOverview(
                (int) $user->id,
                $schoolIds,
                $classId,
                (string) $range
            );

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }
}
