<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Services\SmartInsight\InsightMetricsReader;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;

class StudentStreakCalendarController extends Controller
{
    use GeneralTrait;

    /** @var InsightMetricsReader */
    private $metricsReader;

    public function __construct(InsightMetricsReader $metricsReader)
    {
        $this->metricsReader = $metricsReader;
        auth()->setDefaultDriver('user-api');
    }

    public function index(Request $request)
    {
        try {
            $year = (int) $request->query('year', now()->year);
            $month = (int) $request->query('month', now()->month);

            if ($year < 1970 || $year > 2100 || $month < 1 || $month > 12) {
                return $this->returnError('E001', __('validation.invalid'));
            }

            $studentId = (int) auth()->user()->id;
            $payload = $this->metricsReader->calendarPayloadForStudent($studentId, $year, $month);

            return $this->returnData('streak_calendar', $payload, __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E001', $ex->getMessage());
        }
    }
}
