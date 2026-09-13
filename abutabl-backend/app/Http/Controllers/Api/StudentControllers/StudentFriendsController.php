<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\Student\StudentFriendshipService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;

class StudentFriendsController extends Controller
{
    use GeneralTrait;

    /** @var StudentFriendshipService */
    private $friendshipService;

    public function __construct(StudentFriendshipService $friendshipService)
    {
        $this->friendshipService = $friendshipService;
        auth()->setDefaultDriver('user-api');
    }

    public function index(Request $request)
    {
        try {
            $actor = $this->authenticatedStudent();
            $payload = $this->friendshipService->listAcceptedFriends($actor);

            return $this->returnData('friends', $payload, __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->mapException($ex);
        }
    }

    public function invite(Request $request)
    {
        try {
            $actor = $this->authenticatedStudent();
            $targetStudentId = (int) $request->input('target_student_id', 0);

            $friendship = $this->friendshipService->invite($actor, $targetStudentId);

            return $this->returnData('friendship', [
                'id' => (int) $friendship->id,
                'status' => (string) $friendship->status,
                'target_student_id' => (int) $friendship->friend_student_id,
            ], __('api.success'), 201);
        } catch (\Exception $ex) {
            return $this->mapException($ex);
        }
    }

    public function accept(Request $request, $id)
    {
        try {
            $actor = $this->authenticatedStudent();
            $friendship = $this->friendshipService->accept($actor, (int) $id);

            return $this->returnData('friendship', [
                'id' => (int) $friendship->id,
                'status' => (string) $friendship->status,
                'friend_student_id' => (int) $friendship->student_id,
                'accepted_at' => $friendship->accepted_at
                    ? $friendship->accepted_at->toIso8601String()
                    : null,
            ], __('api.success'), 200);
        } catch (\Exception $ex) {
            return $this->mapException($ex);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $actor = $this->authenticatedStudent();
            $this->friendshipService->remove($actor, (int) $id);

            return $this->returnSuccessMessage(__('api.success'), 'S000', 200);
        } catch (\Exception $ex) {
            return $this->mapException($ex);
        }
    }

    private function authenticatedStudent(): Student
    {
        $student = Student::query()->find((int) auth()->user()->id);
        if ($student === null) {
            throw new RuntimeException(__('api.not_exists_user_for_this_data'), 404);
        }

        return $student;
    }

    private function mapException(\Exception $ex)
    {
        $http = 400;
        if ($ex instanceof RuntimeException && is_int($ex->getCode()) && $ex->getCode() >= 400) {
            $http = (int) $ex->getCode();
        }

        $errNum = $http === 404 ? 'E404' : ($http === 403 ? 'E403' : 'E001');

        if ($ex instanceof InvalidArgumentException) {
            $errNum = 'E001';
            $http = 400;
        }

        return $this->returnError($errNum, $ex->getMessage() ?: 'Request failed', $http);
    }
}
