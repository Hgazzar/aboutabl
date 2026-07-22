<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Models\Assigns;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use App\Http\Requests\Assignment\DeleteAssignRequest;
use App\Http\Requests\Assignment\ListAssignsRequest;
use App\Http\Requests\Assignment\ModuleDataAssignRequest;
use App\Http\Requests\Assignment\StoreAssignRequest;
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

    public function __construct(AssignmentService $assignments)
    {
        auth()->setDefaultDriver('admin-api');
        $this->assignments = $assignments;
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

    public function store(StoreAssignRequest $request)
    {
        try {
            $this->authorize('create', Assigns::class);

            $this->assignments->create(
                $request->all(),
                (int) auth()->id(),
                auth()->user()
            );

            return $this->returnSuccessMessage(__('Successfully'), '200', 200);
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
}
