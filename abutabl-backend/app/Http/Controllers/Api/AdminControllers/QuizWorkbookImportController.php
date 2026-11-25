<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Imports\QuizWorkbookImport;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Validator;

class QuizWorkbookImportController extends Controller
{
    use GeneralTrait;

    public function __construct()
    {
        auth()->setDefaultDriver('admin-api');
        $this->middleware('quizLibraryAdminOnly')->only(['preview', 'commit']);
        $this->middleware('can:add-questions')->only(['preview', 'commit']);
    }

    public function preview(Request $request)
    {
        $file = $this->validatedFile($request);
        if ($file instanceof \Illuminate\Http\JsonResponse) {
            return $file;
        }

        $preview = (new QuizWorkbookImport())->preview($file);

        return response()->json([
            'status' => true,
            'errNum' => '200',
            'msg' => 'Preview ready.',
            'preview' => $preview,
        ], 200);
    }

    public function commit(Request $request)
    {
        $file = $this->validatedFile($request);
        if ($file instanceof \Illuminate\Http\JsonResponse) {
            return $file;
        }

        $decisions = $this->decisions($request);
        if ($decisions instanceof \Illuminate\Http\JsonResponse) {
            return $decisions;
        }

        $lesson = $this->activityLessonId($request);
        if ($lesson instanceof \Illuminate\Http\JsonResponse) {
            return $lesson;
        }

        try {
            $result = (new QuizWorkbookImport())->commit(
                $file,
                $decisions,
                auth()->id() ? (int) auth()->id() : null,
                $lesson
            );
        } catch (\Throwable $exception) {
            Log::error('Quiz workbook import rolled back.', [
                'exception' => $exception,
            ]);

            return response()->json([
                'status' => false,
                'errNum' => 'E001',
                'msg' => 'Import failed and was rolled back. Nothing was saved.',
                'import_result' => [
                    'written' => false,
                    'created' => [],
                    'skipped' => [],
                    'rows' => [],
                    'file_errors' => [],
                    'quiz_id' => null,
                ],
            ], 422);
        }

        $written = (bool) ($result['written'] ?? false);

        return response()->json([
            'status' => $written,
            'errNum' => $written ? '200' : 'E001',
            'msg' => $written
                ? 'Import saved.'
                : (string) ($result['message'] ?? 'Nothing was saved.'),
            'import_result' => [
                'written' => $written,
                'created' => $result['created'],
                'skipped' => $result['skipped'],
                'rows' => $result['rows'],
                'file_errors' => $result['file_errors'],
                'quiz_id' => $result['quiz_id'] ?? null,
            ],
        ], $written ? 200 : 422);
    }

    /**
     * @return string|\Illuminate\Http\JsonResponse
     */
    private function validatedFile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|mimes:xlsx,csv,xls',
        ]);
        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);

            return $this->returnValidationError($code, $validator);
        }

        return $request->file('file')->getRealPath();
    }

    /**
     * @return array<int, string>|\Illuminate\Http\JsonResponse
     */
    private function decisions(Request $request)
    {
        $raw = $request->input('decisions', []);
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (! is_array($decoded)) {
                return $this->returnError('E001', 'decisions must be a JSON list of row and decision.');
            }
            $raw = $decoded;
        }
        if (! is_array($raw)) {
            return $this->returnError('E001', 'decisions must be a list.');
        }

        $mapped = [];
        foreach ($raw as $item) {
            if (! is_array($item) || ! isset($item['row'], $item['decision'])) {
                return $this->returnError('E001', 'Each decision needs a row and a decision.');
            }
            $mapped[(int) $item['row']] = (string) $item['decision'];
        }

        return $mapped;
    }

    /**
     * @return int|null|\Illuminate\Http\JsonResponse
     */
    private function activityLessonId(Request $request)
    {
        if (! $request->filled('activity_lesson_id')) {
            return null;
        }

        $validator = Validator::make($request->all(), [
            'activity_lesson_id' => 'required|integer|exists:activity_lessons,id',
        ]);
        if ($validator->fails()) {
            $code = $this->returnCodeAccordingToInput($validator);

            return $this->returnValidationError($code, $validator);
        }

        return (int) $request->input('activity_lesson_id');
    }
}
