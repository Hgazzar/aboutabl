<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Services\Student\StudentMyProgressService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;

class StudentMyProgressController extends Controller
{
    use GeneralTrait;

    /** @var StudentMyProgressService */
    private $myProgress;

    public function __construct(StudentMyProgressService $myProgress)
    {
        $this->myProgress = $myProgress;
        auth()->setDefaultDriver('user-api');
    }

    /**
     * GET /api/student/my-progress
     */
    public function index(Request $request)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $payload = $this->myProgress->build($studentId);

            return $this->returnData('my_progress', $payload, __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E001', $ex->getMessage());
        }
    }
}
