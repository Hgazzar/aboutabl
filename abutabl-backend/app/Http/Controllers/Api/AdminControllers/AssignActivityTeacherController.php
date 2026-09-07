<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assignment\UpsertAssignmentGradeDraftRequest;
use App\Models\AssignActivity;
use App\Models\Assigns;
use App\Services\Assignment\AssignActivitySubmissionService;
use App\Services\Assignment\AssignmentGradeService;
use App\Services\Assignment\AssignmentParentSubmissionService;
use App\Traits\GeneralTrait;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AssignActivityTeacherController extends Controller
{
    use GeneralTrait;

    /** @var AssignActivitySubmissionService */
    private $submissions;

    /** @var AssignmentParentSubmissionService */
    private $parentSubmissions;

    /** @var AssignmentGradeService */
    private $grades;

    public function __construct(
        AssignActivitySubmissionService $submissions,
        AssignmentParentSubmissionService $parentSubmissions,
        AssignmentGradeService $grades
    ) {
        auth()->setDefaultDriver('admin-api');
        $this->submissions = $submissions;
        $this->parentSubmissions = $parentSubmissions;
        $this->grades = $grades;
    }

    /**
     * Teacher review payload: activities + per-student submissions + parent lifecycle + grade draft.
     */
    public function review(int $assignId)
    {
        try {
            $assign = Assigns::with(['activities', 'Students'])->find($assignId);
            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('view', $assign);
            $this->assertTeacherSchoolAccess($assign);

            $activities = $this->submissions->activitiesPayloadForAssign($assign, null);
            $students = [];

            foreach ($assign->Students as $row) {
                $studentId = (int) $row->student_id;
                $parentStatus = $this->parentSubmissions->resolveParentStatus($row);

                $gradePayload = null;
                try {
                    $gradePayload = $this->grades->showForStudent($assignId, $studentId);
                } catch (InvalidArgumentException $ex) {
                    $gradePayload = null;
                }

                $students[] = [
                    'assign_student_id' => (int) $row->id,
                    'student_id' => $studentId,
                    'opened_at' => $row->opened_at
                        ? \Carbon\Carbon::parse($row->opened_at)->toIso8601String()
                        : null,
                    'submission_status' => $parentStatus,
                    'submitted_at' => $row->submitted_at
                        ? \Carbon\Carbon::parse($row->submitted_at)->toIso8601String()
                        : null,
                    'graded_at' => $row->graded_at
                        ? \Carbon\Carbon::parse($row->graded_at)->toIso8601String()
                        : null,
                    'grade' => $gradePayload,
                    'activities' => $this->submissions->activitiesPayloadForAssign($assign, $studentId),
                ];
            }

            return $this->returnData('data', [
                'assign_id' => (int) $assign->id,
                'title' => (string) $assign->assigned_name,
                'type' => (string) $assign->type,
                'due_at' => $assign->due_at ? $assign->due_at->toIso8601String() : null,
                'activities' => $activities,
                'students' => $students,
            ]);
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (InvalidArgumentException $ex) {
            if ($ex->getMessage() === 'forbidden_school') {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }

            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Phase 3B — Save Assignment Grade Draft (does not finalize parent).
     */
    public function upsertGrade(UpsertAssignmentGradeDraftRequest $request, int $assignId, int $studentId)
    {
        try {
            $assign = Assigns::query()->find($assignId);
            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('update', $assign);
            $this->assertTeacherSchoolAccess($assign);

            if ($studentId <= 0) {
                return $this->returnError('E001', 'student_id_required');
            }

            $payload = $this->grades->upsertDraft($assignId, $studentId, $request->validated());

            return $this->returnData('data', $payload, __('Successfully'));
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (InvalidArgumentException $ex) {
            if ($ex->getMessage() === 'forbidden_school') {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }

            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Phase 3B — Read Assignment Grade Draft for one student.
     */
    public function showGrade(int $assignId, int $studentId)
    {
        try {
            $assign = Assigns::query()->find($assignId);
            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('view', $assign);
            $this->assertTeacherSchoolAccess($assign);

            if ($studentId <= 0) {
                return $this->returnError('E001', 'student_id_required');
            }

            $payload = $this->grades->showForStudent($assignId, $studentId);

            return $this->returnData('data', [
                'assign_id' => $assignId,
                'student_id' => $studentId,
                'grade' => $payload,
            ]);
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (InvalidArgumentException $ex) {
            if ($ex->getMessage() === 'forbidden_school') {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }

            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Explicit parent Assignment finalize/return: submitted → graded + finalized grade.
     */
    public function finalizeParent(Request $request, int $assignId, int $studentId)
    {
        try {
            $assign = Assigns::query()->find($assignId);
            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('update', $assign);
            $this->assertTeacherSchoolAccess($assign);

            if ($studentId <= 0) {
                return $this->returnError('E001', 'student_id_required');
            }

            $feedback = $request->input('teacher_feedback');
            $feedback = is_string($feedback) ? $feedback : null;

            $result = $this->parentSubmissions->finalizeParentAssignment(
                $assignId,
                $studentId,
                (int) auth()->id(),
                $feedback
            );

            $row = $result['assign_student'];
            $lifecycle = $this->parentSubmissions->lifecycleFromAssignStudent($row);

            return $this->returnData('data', [
                'assign_id' => $assignId,
                'assign_student_id' => (int) $row->id,
                'student_id' => (int) $row->student_id,
                'submission_status' => $this->parentSubmissions->resolveParentStatus($row),
                'submitted_at' => $row->submitted_at
                    ? \Carbon\Carbon::parse($row->submitted_at)->toIso8601String()
                    : null,
                'graded_at' => $row->graded_at
                    ? \Carbon\Carbon::parse($row->graded_at)->toIso8601String()
                    : null,
                'lifecycle' => $lifecycle,
                'grade' => $result['grade'],
            ], __('Successfully'));
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (InvalidArgumentException $ex) {
            if ($ex->getMessage() === 'forbidden_school') {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }

            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Manual grade for worksheet (or other manual) activities.
     */
    public function manualGrade(Request $request, int $assignActivityId)
    {
        try {
            $activity = AssignActivity::with('assign')->find($assignActivityId);
            if (! $activity || ! $activity->assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('update', $activity->assign);

            $studentId = (int) $request->input('student_id');
            if ($studentId <= 0) {
                return $this->returnValidationError(
                    'E001',
                    validator([], ['student_id' => 'required'])->errors()
                );
            }

            $submission = $this->submissions->manualGrade(
                $assignActivityId,
                $studentId,
                (int) auth()->id(),
                $request->only(['score', 'max_score', 'percent', 'feedback'])
            );

            return $this->returnData('data', $submission, __('Successfully'));
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    private function assertTeacherSchoolAccess(Assigns $assign): void
    {
        $user = auth()->user();
        if ($user === null) {
            throw new InvalidArgumentException('forbidden_school');
        }

        if ((string) ($user->type ?? '') === 'admin') {
            return;
        }

        $schoolIds = array_map('intval', $this->SchoolsIDs() ?? []);
        if ($schoolIds === [] || ! in_array((int) $assign->school_id, $schoolIds, true)) {
            throw new InvalidArgumentException('forbidden_school');
        }
    }
}
