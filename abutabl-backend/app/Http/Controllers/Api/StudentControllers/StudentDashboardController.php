<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Services\Student\StudentDashboardService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    use GeneralTrait;

    /** @var StudentDashboardService */
    private $dashboardService;

    public function __construct(StudentDashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
        auth()->setDefaultDriver('user-api');
    }

    public function index(Request $request)
    {
        try {
            $range = (string) $request->query('range', 'week');
            $payload = $this->dashboardService->build((int) auth()->user()->id, $range);

            return $this->returnData('dashboard', $payload, __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E001', $ex->getMessage());
        }
    }
}
