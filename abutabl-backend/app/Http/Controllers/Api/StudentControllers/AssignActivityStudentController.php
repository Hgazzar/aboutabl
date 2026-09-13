<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Models\AssignActivity;
use App\Models\Assigns;
use App\Services\Assignment\AssignActivitySubmissionService;
use App\Services\Assignment\AssignmentParentSubmissionService;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AssignActivityStudentController extends Controller
{
    use GeneralTrait;

    /** @var AssignActivitySubmissionService */
    private $submissions;

    /** @var AssignmentParentSubmissionService */
    private $parentSubmissions;

    public function __construct(
        AssignActivitySubmissionService $submissions,
        AssignmentParentSubmissionService $parentSubmissions
    ) {
        auth()->setDefaultDriver('user-api');
        $this->submissions = $submissions;
        $this->parentSubmissions = $parentSubmissions;
    }

    /**
     * Assignment detail for one learning-activities assignment (student scope).
     */
    public function show(int $assignId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $assign = Assigns::with('activities')
                ->where('id', $assignId)
                ->whereHas('Students', function ($q) use ($studentId) {
                    $q->where('student_id', $studentId);
                })
                ->first();

            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            return $this->returnData(
                'data',
                $this->submissions->studentDetailPayload($assign, $studentId)
            );
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Parent Assignment SUBMIT (final).
     */
    public function submitAssignment(int $assignId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $this->parentSubmissions->submitForStudent($assignId, $studentId);

            $assign = Assigns::with('activities')->find($assignId);
            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            return $this->returnData(
                'data',
                $this->submissions->studentDetailPayload($assign, $studentId),
                __('Successfully')
            );
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Assignment-level REDO: submitted → active (before deadline).
     */
    public function redoAssignment(int $assignId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $this->parentSubmissions->redoForStudent($assignId, $studentId);

            $assign = Assigns::with('activities')->find($assignId);
            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            return $this->returnData(
                'data',
                $this->submissions->studentDetailPayload($assign, $studentId),
                __('Successfully')
            );
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Submit / complete one activity.
     */
    public function submit(Request $request, int $assignActivityId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $payload = $request->only(['score', 'max_score', 'percent', 'file_path', 'notes', 'answers']);

            $submission = $this->submissions->submit($assignActivityId, $studentId, $payload);

            return $this->returnData('data', $submission, __('Successfully'));
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Activity-level REDO — reset one completed activity while parent stays active.
     */
    public function redoActivity(int $assignActivityId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $this->submissions->redoActivity($assignActivityId, $studentId);

            $activity = AssignActivity::with('assign')->find($assignActivityId);
            if (! $activity || ! $activity->assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            return $this->returnData(
                'data',
                $this->submissions->studentDetailPayload($activity->assign->load('activities'), $studentId),
                __('Successfully')
            );
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Activity detail + submission state.
     */
    public function activityShow(int $assignActivityId)
    {
        try {
            $studentId = (int) auth()->user()->id;
            $activity = AssignActivity::with('assign')->find($assignActivityId);
            if (! $activity || ! $activity->assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $owns = $activity->assign->Students()
                ->where('student_id', $studentId)
                ->exists();

            if (! $owns) {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }

            $payload = $this->submissions->activitiesPayloadForAssign($activity->assign, $studentId);
            $row = collect($payload)->firstWhere('assign_activity_id', $assignActivityId);

            return $this->returnData('data', $row);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}
