<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Services\Student\StudentLeaderboardService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use Validator;

class StudentLeaderboardController extends Controller
{
    use GeneralTrait;

    /** @var StudentLeaderboardService */
    private $leaderboard;

    public function __construct(StudentLeaderboardService $leaderboard)
    {
        auth()->setDefaultDriver('user-api');
        $this->leaderboard = $leaderboard;
    }

    /**
     * GET /api/student/leaderboard
     *
     * Query params:
     *   scope  : school | class   (default: school)
     *   range  : week | month | all_time  (default: week)
     */
    public function index(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'scope' => 'nullable|in:school,class',
                'range' => 'nullable|in:week,month,all_time',
            ]);

            if ($validator->fails()) {
                $code = $this->returnCodeAccordingToInput($validator);

                return $this->returnValidationError($code, $validator);
            }

            $studentId = (int) auth()->user()->id;
            $scope     = (string) $request->input('scope', StudentLeaderboardService::SCOPE_SCHOOL);
            $range     = (string) $request->input('range', StudentLeaderboardService::RANGE_WEEK);

            $payload = $this->leaderboard->build($studentId, $scope, $range);

            return $this->returnData('leaderboard', $payload, __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E001', $ex->getMessage());
        }
    }
}
