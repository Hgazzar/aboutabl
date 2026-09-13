<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assignment\StoreAssignmentStudentWorkRequest;
use App\Models\Assigns;
use App\Services\Assignment\AssignmentStudentWorkService;
use App\Traits\GeneralTrait;
use InvalidArgumentException;

/**
 * Student My Work CRUD (optional image/document/voice on assign_student_id).
 */
class AssignmentStudentWorkController extends Controller
{
    use GeneralTrait;

    /** @var AssignmentStudentWorkService */
    private $works;

    public function __construct(AssignmentStudentWorkService $works)
    {
        auth()->setDefaultDriver('user-api');
        $this->works = $works;
    }

    public function index(int $assignId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $assign = $this->requireAssignedAssign($assignId, $studentId);
            $membership = $this->works->requireMembership($assignId, $studentId);

            return $this->returnData('data', [
                'assign_id' => (int) $assign->id,
                'assign_student_id' => (int) $membership->id,
                'my_work' => $this->works->listForStudent($assignId, $studentId),
                'my_work_locked' => $this->works->isLocked($membership),
            ]);
        } catch (InvalidArgumentException $ex) {
            return $this->mapException($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store(StoreAssignmentStudentWorkRequest $request, int $assignId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $assign = $this->requireAssignedAssign($assignId, $studentId);
            $membership = $this->works->requireMembership($assignId, $studentId);

            $item = $this->works->create(
                $assign,
                $membership,
                (string) $request->input('kind'),
                $request->file('file'),
                $request->filled('duration_ms') ? (int) $request->input('duration_ms') : null
            );

            return $this->returnData('data', $item, __('api.success'), 200);
        } catch (InvalidArgumentException $ex) {
            return $this->mapException($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function destroy(int $assignId, int $workId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $assign = $this->requireAssignedAssign($assignId, $studentId);
            $membership = $this->works->requireMembership($assignId, $studentId);

            $this->works->delete($assign, $membership, $workId);

            return $this->returnSuccessMessage(__('api.success'));
        } catch (InvalidArgumentException $ex) {
            return $this->mapException($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Authenticated file stream — only the owning student for this assign.
     */
    public function download(int $assignId, int $workId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $assign = $this->requireAssignedAssign($assignId, $studentId);
            $membership = $this->works->requireMembership($assignId, $studentId);

            return $this->works->downloadForStudent($assign, $membership, $workId);
        } catch (InvalidArgumentException $ex) {
            return $this->mapException($ex);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    private function requireAssignedAssign(int $assignId, int $studentId): Assigns
    {
        $assign = Assigns::query()
            ->where('id', $assignId)
            ->whereHas('Students', function ($q) use ($studentId) {
                $q->where('student_id', $studentId);
            })
            ->first();

        if (! $assign) {
            throw new InvalidArgumentException('forbidden');
        }

        return $assign;
    }

    private function mapException(InvalidArgumentException $ex)
    {
        $msg = $ex->getMessage();
        if ($msg === 'forbidden') {
            return $this->returnError('E403', __('Forbidden.'), 403);
        }
        if ($msg === 'my_work_locked') {
            return $this->returnError('E409', __('My Work is locked for this assignment.'), 409);
        }
        if ($msg === 'not_found') {
            return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
        }

        return $this->returnError('E001', $msg);
    }
}
