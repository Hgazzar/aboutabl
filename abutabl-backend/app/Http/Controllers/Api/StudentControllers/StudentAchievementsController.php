<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Services\Student\StudentAchievementService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;

class StudentAchievementsController extends Controller
{
    use GeneralTrait;

    /** @var StudentAchievementService */
    private $achievementService;

    public function __construct(StudentAchievementService $achievementService)
    {
        $this->achievementService = $achievementService;
        auth()->setDefaultDriver('user-api');
    }

    public function index(Request $request)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $achievements = $this->achievementService->buildForStudent($studentId);

            return $this->returnData('achievements', $achievements, __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E001', $ex->getMessage());
        }
    }
}
