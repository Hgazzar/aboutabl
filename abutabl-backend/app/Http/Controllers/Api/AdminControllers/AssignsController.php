<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Models\Assigns;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use App\Http\Requests\Assignment\DeleteAssignRequest;
use App\Http\Requests\Assignment\ListAssignsRequest;
use App\Http\Requests\Assignment\ModuleDataAssignRequest;
use App\Http\Requests\Assignment\StoreAssignRequest;
use App\Http\Requests\Assignment\UpdateAssignPossibleXpRequest;
use App\Http\Requests\Assignment\UpsertAssignmentRubricRequest;
use App\Services\Assignment\AssignmentRubricService;
use App\Services\Assignment\AssignmentService;
use App\Traits\GeneralTrait;
use InvalidArgumentException;

/**
 * F-041D — Thin HTTP adapter. All assignment writes go through AssignmentService.
 */
class AssignsController extends Controller
{
    use GeneralTrait;

    /** @var AssignmentService */
    private $assignments;

    /** @var AssignmentRubricService */
    private $rubrics;

    public function __construct(AssignmentService $assignments, AssignmentRubricService $rubrics)
    {
        auth()->setDefaultDriver('admin-api');
        $this->assignments = $assignments;
        $this->rubrics = $rubrics;
    }

    public function index(ListAssignsRequest $request)
    {
        try {
            $this->authorize('viewAny', Assigns::class);

            $schoolIds = $request->filled('school_id')
                ? [(int) $request->input('school_id')]
                : $this->SchoolsIDs();

            $user = auth()->user();
            $createdBy = ($user && $user->type !== 'admin') ? (int) $user->id : null;

            $assigns = $this->assignments->listForSchools($schoolIds, $createdBy);

            return response()->json([
                'status' => true,
                'assigns' => $assigns,
            ], 200);
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function get_module_data(ModuleDataAssignRequest $request)
    {
        try {
            $subjectIds = $this->subjects((int) $request->input('school_id'));
            $data = $this->assignments->moduleOptions(
                (int) $request->input('school_id'),
                (string) $request->input('type'),
                $subjectIds
            );

            return $this->returnData('data', $data);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Learning Activities picker — Book (Subject) list.
     */
    public function learningActivityBooks()
    {
        try {
            $schoolId = (int) request('school_id');
            if ($schoolId <= 0) {
                return $this->returnValidationError(
                    'E001',
                    validator([], ['school_id' => 'required'])->errors()
                );
            }

            $subjectIds = $this->subjects($schoolId);
            $data = $this->assignments->learningActivityBooks($subjectIds);

            return $this->returnData('data', $data);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Learning Activities picker — sections under a book.
     */
    public function learningActivitySections()
    {
        try {
            $schoolId = (int) request('school_id');
            $subjectId = (int) request('subject_id');
            if ($schoolId <= 0 || $subjectId <= 0) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $subjectIds = $this->subjects($schoolId);
            $data = $this->assignments->learningActivitySections($subjectId, $subjectIds);

            return $this->returnData('data', $data);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Learning Activities picker — activities in a section.
     */
    public function learningActivityItems()
    {
        try {
            $schoolId = (int) request('school_id');
            $subjectId = (int) request('subject_id');
            $section = (string) request('section', '');
            if ($schoolId <= 0 || $subjectId <= 0 || $section === '') {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $subjectIds = $this->subjects($schoolId);
            $data = $this->assignments->learningActivityItems($subjectId, $section, $subjectIds);

            return $this->returnData('data', $data);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store(StoreAssignRequest $request)
    {
        try {
            $this->authorize('create', Assigns::class);

            $result = $this->assignments->create(
                $request->all(),
                (int) auth()->id(),
                auth()->user()
            );

            return $this->returnData('data', [
                'assign_id' => (int) $result['assign']->id,
                'type' => (string) $result['assign']->type,
                'activities_count' => $result['assign']->relationLoaded('activities')
                    ? $result['assign']->activities->count()
                    : $result['assign']->activities()->count(),
            ], __('Successfully'));
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (InvalidArgumentException $ex) {
            if ($ex->getMessage() === 'forbidden') {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }

            if ($ex->getMessage() === 'due_at_required') {
                return $this->returnValidationError(
                    'E001',
                    validator([], ['due_at' => 'required'])->errors()
                );
            }

            if ($ex->getMessage() === 'module_not_found') {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function destroy(DeleteAssignRequest $request, $id)
    {
        try {
            $assign = Assigns::find((int) $id);
            if ($assign === null) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'), 400);
            }

            $this->authorize('delete', $assign);

            $this->assignments->delete((int) $id, auth()->user());

            return $this->returnSuccessMessage(__('Assign Deleted Successfully'), '200', 200);
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (InvalidArgumentException $ex) {
            if ($ex->getMessage() === 'forbidden') {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }

            return $this->returnError('E001', __('api.not_exists_item_for_this_data'), 400);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * Phase 3A — GET /api/assigns/{assignId}/rubric
     */
    public function showRubric(int $assignId)
    {
        try {
            $assign = Assigns::find($assignId);
            if ($assign === null) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('view', $assign);
            $this->assertTeacherSchoolAccess($assign);

            return $this->returnData('data', $this->rubrics->showForAssign($assignId));
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
     * Phase 3A — PUT /api/assigns/{assignId}/rubric
     */
    public function upsertRubric(UpsertAssignmentRubricRequest $request, int $assignId)
    {
        try {
            $assign = Assigns::find($assignId);
            if ($assign === null) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('update', $assign);
            $this->assertTeacherSchoolAccess($assign);

            $payload = $this->rubrics->upsertRubric($assignId, $request->validated());

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
     * Phase 3A — DELETE /api/assigns/{assignId}/rubric
     */
    public function destroyRubric(int $assignId)
    {
        try {
            $assign = Assigns::find($assignId);
            if ($assign === null) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('update', $assign);
            $this->assertTeacherSchoolAccess($assign);

            $this->rubrics->deleteRubric($assignId);

            return $this->returnSuccessMessage(__('Successfully'), '200', 200);
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
     * Phase 3A — PUT /api/assigns/{assignId}/possible_xp
     */
    public function updatePossibleXp(UpdateAssignPossibleXpRequest $request, int $assignId)
    {
        try {
            $assign = Assigns::find($assignId);
            if ($assign === null) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('update', $assign);
            $this->assertTeacherSchoolAccess($assign);

            $payload = $this->rubrics->updatePossibleXp(
                $assignId,
                $request->input('possible_xp')
            );

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
     * Tenant isolation: non-admin teachers may only touch assigns in SchoolsIDs().
     */
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
