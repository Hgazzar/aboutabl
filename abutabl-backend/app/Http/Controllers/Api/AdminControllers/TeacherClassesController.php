<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentProfileResource;
use App\Http\Resources\TeacherClassOverviewResource;
use App\Services\ClassActivitiesTasksService;
use App\Services\ClassAlertsService;
use App\Services\ClassStandardsService;
use App\Services\ClassStudentsOverviewService;
use App\Services\StudentProfileService;
use App\Services\TeacherDashboardService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use Validator;

class TeacherClassesController extends Controller
{
    use GeneralTrait;

    /** @var TeacherDashboardService */
    private $dashboardService;

    /** @var ClassStandardsService */
    private $standardsService;

    /** @var ClassActivitiesTasksService */
    private $activitiesTasksService;

    /** @var ClassStudentsOverviewService */
    private $studentsOverviewService;

    /** @var ClassAlertsService */
    private $classAlertsService;

    /** @var StudentProfileService */
    private $studentProfileService;

    public function __construct(
        TeacherDashboardService $dashboardService,
        ClassStandardsService $standardsService,
        ClassActivitiesTasksService $activitiesTasksService,
        ClassStudentsOverviewService $studentsOverviewService,
        ClassAlertsService $classAlertsService,
        StudentProfileService $studentProfileService
    ) {
        auth()->setDefaultDriver('admin-api');
        $this->dashboardService = $dashboardService;
        $this->standardsService = $standardsService;
        $this->activitiesTasksService = $activitiesTasksService;
        $this->studentsOverviewService = $studentsOverviewService;
        $this->classAlertsService = $classAlertsService;
        $this->studentProfileService = $studentProfileService;
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

    /**
     * Class Details — Standards bar chart (CCSS performance by subject tab).
     */
    public function standards(Request $request, int $classId)
    {
        try {
            $user = auth()->user();

            $validator = Validator::make($request->all(), [
                'subject' => 'nullable|in:letters-explorer,math-explorer',
                'range'   => 'nullable|in:week,month,term',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            if ($user->type !== 'admin') {
                $schoolIds = $this->SchoolsIDs();
                $scope = $this->dashboardService->resolveClassAccess(
                    (int) $user->id,
                    $schoolIds,
                    $classId
                );

                if ($scope === null) {
                    throw new \InvalidArgumentException('The selected class is not assigned to this teacher.');
                }
            }

            $subjectSlug = (string) $request->input('subject', 'letters-explorer');
            $range = (string) $request->input('range', 'week');

            $payload = $this->standardsService->buildReport($classId, $subjectSlug, $range);

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Class Details — Activities & Tasks list (row per student submission).
     */
    public function activitiesTasks(Request $request, int $classId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $validator = Validator::make($request->all(), [
                'filter' => 'nullable|in:all,pending,late,completed',
                'range'  => 'nullable|in:week,month,term',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            $filter = (string) $request->input('filter', 'all');
            $range = (string) $request->input('range', 'week');
            $schoolIds = $this->SchoolsIDs();

            $payload = $this->activitiesTasksService->buildList(
                (int) $user->id,
                $schoolIds,
                $classId,
                $filter,
                $range
            );

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Class Details — full student overview table (performance, score, status, rank).
     */
    public function studentsOverview(Request $request, int $classId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $validator = Validator::make($request->all(), [
                'range' => 'nullable|in:week,month,term',
                'sort'  => 'nullable|in:performance,score,status,rank,name',
                'order' => 'nullable|in:asc,desc',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            $range = (string) $request->input('range', 'week');
            $sort = (string) $request->input('sort', 'rank');
            $order = (string) $request->input('order', 'asc');
            $schoolIds = $this->SchoolsIDs();

            $payload = $this->studentsOverviewService->buildOverview(
                (int) $user->id,
                $schoolIds,
                $classId,
                $range,
                $sort,
                $order
            );

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Class Details — single student profile (summary, analytics, activities, standards).
     */
    public function studentProfile(Request $request, int $classId, int $studentId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $validator = Validator::make($request->all(), [
                'range'             => 'nullable|in:week,month,term',
                'subject'           => 'nullable|string|max:100',
                'assignments_page'  => 'nullable|integer|min:1',
                'quizzes_page'      => 'nullable|integer|min:1',
                'scope'             => 'nullable|in:class,all_classes',
                'search'            => 'nullable|string|max:100',
                'limit'             => 'nullable|integer|min:1|max:100',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            $schoolIds = $this->SchoolsIDs();

            $payload = $this->studentProfileService->buildProfile(
                (int) $user->id,
                $schoolIds,
                $classId,
                $studentId,
                (string) $request->input('range', 'week'),
                (string) $request->input('subject', 'letters-explorer'),
                (int) $request->input('assignments_page', 1),
                (int) $request->input('quizzes_page', 1),
                (string) $request->input('scope', 'class'),
                $request->filled('search') ? (string) $request->input('search') : null,
                $request->filled('limit') ? (int) $request->input('limit') : null
            );

            return response()->json(array_merge(
                ['status' => true],
                (new StudentProfileResource($payload))->resolve()
            ), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Class Details — dynamic Class Alerts (performance drop + deadline reminders).
     */
    public function classAlerts(Request $request, int $classId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $schoolIds = $this->SchoolsIDs();
            $payload = $this->classAlertsService->buildAlerts(
                (int) $user->id,
                $schoolIds,
                $classId
            );

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Dismiss a single class alert for the authenticated teacher.
     */
    public function dismissClassAlert(Request $request, int $classId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $validator = Validator::make($request->all(), [
                'alert_key' => 'required|string|max:191',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            $schoolIds = $this->SchoolsIDs();
            $payload = $this->classAlertsService->dismissAlert(
                (int) $user->id,
                $schoolIds,
                $classId,
                (string) $request->input('alert_key')
            );

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Undo dismiss for a single class alert.
     */
    public function undoClassAlertDismiss(Request $request, int $classId, string $alertKey)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $schoolIds = $this->SchoolsIDs();
            $payload = $this->classAlertsService->undoDismiss(
                (int) $user->id,
                $schoolIds,
                $classId,
                urldecode($alertKey)
            );

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Reset all dismissed class alerts for this teacher + class.
     */
    public function resetClassAlertDismissals(Request $request, int $classId)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $schoolIds = $this->SchoolsIDs();
            $payload = $this->classAlertsService->resetDismissals(
                (int) $user->id,
                $schoolIds,
                $classId
            );

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\InvalidArgumentException $ex) {
            return $this->returnError('E403', $ex->getMessage(), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }
}
