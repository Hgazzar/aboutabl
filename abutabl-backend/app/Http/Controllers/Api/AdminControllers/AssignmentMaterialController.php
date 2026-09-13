<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assignment\StoreAssignmentMaterialRequest;
use App\Models\Assigns;
use App\Services\Assignment\AssignmentMaterialService;
use App\Traits\GeneralTrait;
use Illuminate\Auth\Access\AuthorizationException;
use InvalidArgumentException;

/**
 * Teacher/Admin Assignment Materials CRUD (optional file/voice/link on assign_id).
 */
class AssignmentMaterialController extends Controller
{
    use GeneralTrait;

    /** @var AssignmentMaterialService */
    private $materials;

    public function __construct(AssignmentMaterialService $materials)
    {
        auth()->setDefaultDriver('admin-api');
        $this->materials = $materials;
    }

    public function index(int $assignId)
    {
        try {
            $assign = Assigns::query()->find($assignId);
            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('view', $assign);
            $this->assertTeacherSchoolAccess($assign);

            return $this->returnData('data', [
                'assign_id' => (int) $assign->id,
                'materials' => $this->materials->listForAssign((int) $assign->id),
                'materials_locked' => $this->materials->isFrozen((int) $assign->id),
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

    public function store(StoreAssignmentMaterialRequest $request, int $assignId)
    {
        try {
            $assign = Assigns::query()->find($assignId);
            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('update', $assign);
            $this->assertTeacherSchoolAccess($assign);

            $user = auth()->user();
            $createdBy = (int) ($user->id ?? 0);
            $kind = (string) $request->input('kind');
            $label = $request->input('label');

            if ($kind === 'link') {
                $url = (string) ($request->input('url') ?? $request->input('external_url') ?? '');
                $item = $this->materials->createLink($assign, $url, is_string($label) ? $label : null, $createdBy);
            } elseif ($kind === 'voice') {
                $item = $this->materials->createVoice(
                    $assign,
                    $request->file('file'),
                    is_string($label) ? $label : null,
                    $createdBy,
                    $request->filled('duration_ms') ? (int) $request->input('duration_ms') : null
                );
            } else {
                $item = $this->materials->createFile(
                    $assign,
                    $request->file('file'),
                    is_string($label) ? $label : null,
                    $createdBy
                );
            }

            return $this->returnData('data', $item, __('api.success'), 200);
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (InvalidArgumentException $ex) {
            if ($ex->getMessage() === 'forbidden_school') {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }
            if ($ex->getMessage() === 'materials_locked') {
                return $this->returnError('E409', __('Materials are locked for this assignment.'), 409);
            }

            return $this->returnError('E001', $ex->getMessage());
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function destroy(int $assignId, int $materialId)
    {
        try {
            $assign = Assigns::query()->find($assignId);
            if (! $assign) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

            $this->authorize('update', $assign);
            $this->assertTeacherSchoolAccess($assign);

            $this->materials->delete($assign, $materialId);

            return $this->returnSuccessMessage(__('api.success'));
        } catch (AuthorizationException $ex) {
            return $this->returnError('E403', __('Forbidden.'), 403);
        } catch (InvalidArgumentException $ex) {
            if ($ex->getMessage() === 'forbidden_school') {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }
            if ($ex->getMessage() === 'materials_locked') {
                return $this->returnError('E409', __('Materials are locked for this assignment.'), 409);
            }
            if ($ex->getMessage() === 'not_found') {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'));
            }

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
