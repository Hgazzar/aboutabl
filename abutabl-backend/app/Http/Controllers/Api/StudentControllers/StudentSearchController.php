<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\Student\StudentSearchService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;

class StudentSearchController extends Controller
{
    use GeneralTrait;

    /** @var StudentSearchService */
    private $searchService;

    public function __construct(StudentSearchService $searchService)
    {
        $this->searchService = $searchService;
        auth()->setDefaultDriver('user-api');
    }

    public function index(Request $request)
    {
        try {
            $query = (string) $request->query('q', '');
            $limit = min(50, max(1, (int) $request->query('limit', 20)));

            $student = Student::query()->find((int) auth()->user()->id);
            if (! $student) {
                return $this->returnError('E001', __('api.not_exists_user_for_this_data'));
            }

            $results = $this->searchService->search($student, $query, $limit);

            return $this->returnData('results', $results, __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode() ?: 'E001', $ex->getMessage());
        }
    }
}
