<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Models\FileManagement;
use App\Http\Controllers\Controller;
use App\Support\Ownership\OwnershipGate;
use Illuminate\Http\Request;
use App\Traits\GeneralTrait;
use ZipArchive;

class FileManagerController extends Controller
{
    use GeneralTrait;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware('can:view-file_managers')->only('index', 'show', 'download');
        $this->middleware('can:add-file_managers')->only('store', 'create');
        $this->middleware('can:edit-file_managers')->only('update', 'edit');
        $this->middleware('can:activation-file_managers')->only('status');
        $this->middleware('can:delete-file_managers')->only('destroy');
    }

    public function index(Request $request)
    {
        $schoolIds = $this->authorizedSchoolIds();
        if ($schoolIds === []) {
            return response()->json([
                'status' => true,
                'files' => [],
            ], 200);
        }

        $files = FileManagement::query()
            ->whereIn('school_id', $schoolIds);

        // Teachers: school scope + uploader ownership (created_by). Admins: school scope only.
        if (! OwnershipGate::isAdminUser(auth()->user())) {
            $files->where('created_by', (int) auth()->id());
        }

        $files->when($request->search, function ($query) use ($request) {
            $query->where('name', 'like', '%'.$request->search.'%');
        });

        if ($request->filled('school_id')) {
            $requestedSchool = (int) $request->school_id;
            if (! in_array($requestedSchool, $schoolIds, true)) {
                return $this->returnError('E403', __('Forbidden'), 403);
            }
            $files->where('school_id', $requestedSchool);
        }

        $files->orderBy('created_at', $request->order ?? 'desc');

        if ($request->has('paginate') && $request->paginate > 0) {
            $files = $files->paginate($request->paginate);
        } else {
            $files = $files->get();
        }

        return response()->json([
            'status' => true,
            'files' => $files,
        ], 200);
    }

    /**
     * Stream a file through the API so downloads work even when public/storage symlink is missing.
     */
    public function download($id)
    {
        try {
            $file = FileManagement::find($id);
            if (! $file) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'), 400);
            }
            if (! $this->canAccessFile($file)) {
                return $this->returnError('E403', __('Forbidden'), 403);
            }

            $relative = $file->getRawOriginal('path') ?? $file->getAttributes()['path'] ?? null;
            if (! $relative) {
                return $this->returnError('E001', 'File path is missing', 404);
            }

            // Accessor turns path into full URL — strip storage prefix if somehow stored that way
            if (is_string($relative) && preg_match('#/storage/(.+)$#', $relative, $m)) {
                $relative = $m[1];
            }

            $candidates = [];
            if (str_starts_with((string) $relative, 'scrom/')) {
                $candidates[] = public_path($relative);
                $candidates[] = base_path($relative);
            } else {
                $candidates[] = storage_path('app/public/'.$relative);
                $candidates[] = public_path('storage/'.$relative);
                $candidates[] = storage_path('app/'.$relative);
            }

            $absolute = null;
            foreach ($candidates as $candidate) {
                if ($candidate && is_file($candidate)) {
                    $absolute = $candidate;
                    break;
                }
            }

            if (! $absolute) {
                return $this->returnError('E001', 'File not found on disk', 404);
            }

            $downloadName = (string) $file->name;
            $ext = (string) ($file->type ?? '');
            if ($ext !== '' && ! str_ends_with(strtolower($downloadName), '.'.strtolower($ext))) {
                $downloadName .= '.'.$ext;
            }

            return response()->download($absolute, $downloadName);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function store(Request $request)
    {
        try {
            $schoolId = (int) $request->school_id;
            if ($schoolId <= 0 || ! $this->isAuthorizedSchoolId($schoolId)) {
                return $this->returnError('E403', __('Forbidden'), 403);
            }

            $arr = ['html', 'css', 'js', 'json', 'php', 'sql', 'gz', 'exe', 'phar', 'txt', 'c#', 'py', 'c++'];

            if ($request->hasFile('files')) {
                $files = $request->file('files');
                if (! is_array($files)) {
                    $files = [$files];
                }

                foreach ($files as $file) {
                    $f_name = explode('.', $file->getClientOriginalName())[0];
                    $hashName = $file->hashName();
                    $size = $file->getSize();
                    $ext = $file->extension();
                    $check = FileManagement::where('name', $f_name)->where('school_id', $schoolId)->count();
                    if ($size <= 90000000 && ! in_array($ext, $arr)) {
                        $path = 'files_maanger';
                        $file->store('public/'.$path);

                        if ($ext == 'zip') {
                            $zip = new ZipArchive;
                            $res = $zip->open('storage/'.$path.'/'.$hashName);
                            if ($res === true) {
                                $zip->extractTo('scrom/files_maanger/'.explode('.', $hashName)[0]);
                                $zip->close();
                                $path = 'scrom/files_maanger/'.explode('.', $hashName)[0].'/index.html';
                            }
                        } else {
                            $path = $path.'/'.$hashName;
                        }

                        FileManagement::create([
                            'name' => $check == 0 ? $f_name : $f_name.' copy'.$check,
                            'hashName' => $hashName,
                            'type' => $ext,
                            'size' => $size,
                            'path' => $path,
                            'school_id' => $schoolId,
                            // Never trust client-provided owner IDs.
                            'created_by' => (int) auth()->id(),
                        ]);
                    }
                }
            }

            return $this->returnSuccessMessage(__('Successfully'), '200', 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function destroy($id, Request $request)
    {
        try {
            $file = FileManagement::find($id);
            if (! $file) {
                return $this->returnError('E001', __('api.not_exists_item_for_this_data'), 400);
            }
            if (! $this->canAccessFile($file)) {
                return $this->returnError('E403', __('Forbidden'), 403);
            }

            FileManagement::where('id', $file->id)->delete();

            return $this->returnSuccessMessage(__('api.File Deleted Successfully'), '200', 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    /**
     * @return int[]
     */
    private function authorizedSchoolIds(): array
    {
        return array_values(array_unique(array_map('intval', $this->SchoolsIDs() ?? [])));
    }

    private function isAuthorizedSchoolId(int $schoolId): bool
    {
        if ($schoolId <= 0) {
            return false;
        }

        return in_array($schoolId, $this->authorizedSchoolIds(), true);
    }

    private function canAccessFile(FileManagement $file): bool
    {
        $schoolIds = $this->authorizedSchoolIds();
        if ($schoolIds === [] || ! in_array((int) $file->school_id, $schoolIds, true)) {
            return false;
        }

        if (OwnershipGate::isAdminUser(auth()->user())) {
            return true;
        }

        return (int) $file->created_by === (int) auth()->id();
    }
}
