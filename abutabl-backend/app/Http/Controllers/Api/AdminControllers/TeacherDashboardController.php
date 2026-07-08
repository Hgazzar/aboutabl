<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Services\TeacherDashboardService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;

class TeacherDashboardController extends Controller
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
     * Alerts section — students needing attention (overdue or low performance).
     */
    public function alerts(Request $request)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $schoolIds = $this->SchoolsIDs();
            $payload = $this->dashboardService->buildTeacherAlerts((int) $user->id, $schoolIds);

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Analytics section — classes comparison + completion status charts.
     */
    public function stats(Request $request)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $schoolIds = $this->SchoolsIDs();
            $payload = $this->dashboardService->buildTeacherAnalytics((int) $user->id, $schoolIds);

            return response()->json(array_merge(['status' => true], $payload), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }

    /**
     * Phase 1 teacher overview dashboard (Images 1 & 2 — grid/list share this payload).
     */
    public function overview(Request $request)
    {
        try {
            $user = auth()->user();

            if ($user->type === 'admin') {
                return $this->returnError('E403', __('This endpoint is for teachers only.'), 403);
            }

            $schoolIds = $this->SchoolsIDs();
            $payload = $this->dashboardService->buildOverview((int) $user->id, $schoolIds);

            $displayName = app()->getLocale() === 'ar' && ! empty($user->name_ar)
                ? $user->name_ar
                : ($user->name ?? '');

            return response()->json([
                'status'  => true,
                'teacher' => [
                    'id'   => (int) $user->id,
                    'name' => $displayName,
                ],
                'stats'   => $payload['stats'],
                'summary' => $payload['summary'],
                'classes' => $payload['classes'],
                'charts'  => $payload['charts'],
                'alerts'  => $payload['alerts'],
            ], 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E000', $ex->getMessage());
        }
    }
}
