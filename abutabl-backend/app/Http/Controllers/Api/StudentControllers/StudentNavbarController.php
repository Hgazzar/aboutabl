<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Services\Student\StudentNavbarService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;

class StudentNavbarController extends Controller
{
    use GeneralTrait;

    /** @var StudentNavbarService */
    private $navbarService;

    public function __construct(StudentNavbarService $navbarService)
    {
        $this->navbarService = $navbarService;
        auth()->setDefaultDriver('user-api');
    }

    public function index(Request $request)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $payload = $this->navbarService->build($studentId);

            return $this->returnData('navbar', $payload, __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E001', $ex->getMessage());
        }
    }
}
