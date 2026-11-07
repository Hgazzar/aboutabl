<?php

namespace App\Http\Controllers\Api\AdminControllers;

use App\Http\Controllers\Controller;
use App\Models\LiveGame;
use App\Support\LiveCompetitions\LiveCompetitionCatalogService;
use App\Support\LiveCompetitions\LiveCompetitionWorkbookBuilder;
use App\Traits\GeneralTrait;
use Illuminate\Http\Request;
use InvalidArgumentException;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use RuntimeException;
use Validator;

class LiveCompetitionsAdminController extends Controller
{
    use GeneralTrait;

    /** @var LiveCompetitionCatalogService */
    protected $catalog;

    public function __construct(LiveCompetitionCatalogService $catalog)
    {
        auth()->setDefaultDriver('admin-api');
        $this->catalog = $catalog;
    }

    public function index(Request $request)
    {
        try {
            $games = LiveGame::query()
                ->with(['questions', 'schools'])
                ->withCount(['questions', 'schoolLinks as entitled_school_count'])
                ->latest();

            if ($request->has('paginate') && (int) $request->paginate > 0) {
                $games = $games->paginate((int) $request->paginate);
                $payload = $games->toArray();
                $payload['data'] = collect($games->items())->map(function (LiveGame $game) {
                    return $this->serializeGame($game);
                })->values();

                return $this->returnData('games', $payload, '', 200);
            }

            $collection = $games->get()->map(function (LiveGame $game) {
                return $this->serializeGame($game);
            })->values();

            return $this->returnData('games', $collection, '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function show($id)
    {
        try {
            $game = LiveGame::query()->with(['questions', 'schools'])->find($id);
            if (! $game) {
                return $this->returnError('404', __('api.not_found'), 404);
            }

            return $this->returnData('game', $this->serializeGame($game, true), '', 200);
        } catch (\Exception $ex) {
            return $this->returnError((string) $ex->getCode(), $ex->getMessage());
        }
    }

    public function template()
    {
        $writer = new Xlsx(LiveCompetitionWorkbookBuilder::spreadsheet());
        $tmp = tempnam(sys_get_temp_dir(), 'live-comp-');
        $writer->save($tmp);

        return response()->download($tmp, LiveCompetitionWorkbookBuilder::FILENAME, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function preview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls',
        ]);
        if ($validator->fails()) {
            return $this->returnValidationError($this->returnCodeAccordingToInput($validator), $validator);
        }

        $userId = (int) auth()->id();
        if ($userId <= 0) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        $path = $request->file('file')->getRealPath();
        $result = $this->catalog->preview($path, $userId);

        return response()->json([
            'status' => true,
            'errNum' => '200',
            'msg' => $result['valid'] ? 'Workbook is valid.' : 'Workbook failed validation.',
            'valid' => $result['valid'],
            'errors' => $result['errors'],
            'game' => $result['game'],
            'questions' => $result['questions'],
            'preview_token' => $result['preview_token'],
            'preview_expires_at' => $result['preview_expires_at'],
        ], 200);
    }

    public function confirm(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls',
            'preview_token' => 'required|string',
        ]);
        if ($validator->fails()) {
            return $this->returnValidationError($this->returnCodeAccordingToInput($validator), $validator);
        }

        $userId = (int) auth()->id();
        if ($userId <= 0) {
            return $this->returnError('E3001', 'Unauthenticated', 401);
        }

        $path = $request->file('file')->getRealPath();

        try {
            $game = $this->catalog->confirm(
                $path,
                (string) $request->input('preview_token'),
                $userId
            );
        } catch (RuntimeException $ex) {
            return $this->returnError('409', $ex->getMessage(), 409);
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        }

        return $this->returnData('game', $this->serializeGame($game, true), 'Game imported as unpublished.', 201);
    }

    public function publish($id)
    {
        $game = LiveGame::query()->find($id);
        if (! $game) {
            return $this->returnError('404', __('api.not_found'), 404);
        }

        try {
            $game = $this->catalog->publish($game);
        } catch (RuntimeException $ex) {
            return $this->returnError('409', $ex->getMessage(), 409);
        }

        return $this->returnData('game', $this->serializeGame($game, true), 'Game published.', 200);
    }

    public function unpublish($id)
    {
        $game = LiveGame::query()->find($id);
        if (! $game) {
            return $this->returnError('404', __('api.not_found'), 404);
        }

        try {
            $game = $this->catalog->unpublish($game);
        } catch (RuntimeException $ex) {
            return $this->returnError('409', $ex->getMessage(), 409);
        }

        return $this->returnData('game', $this->serializeGame($game, true), 'Game unpublished.', 200);
    }

    public function schools($id)
    {
        $game = LiveGame::query()->with('schools')->find($id);
        if (! $game) {
            return $this->returnError('404', __('api.not_found'), 404);
        }

        return $this->returnData('schools', $this->serializeSchools($game), '', 200);
    }

    public function updateSchools(Request $request, $id)
    {
        $game = LiveGame::query()->find($id);
        if (! $game) {
            return $this->returnError('404', __('api.not_found'), 404);
        }

        $validator = Validator::make($request->all(), [
            'school_ids' => 'present|array',
        ]);
        if ($validator->fails()) {
            return $this->returnValidationError($this->returnCodeAccordingToInput($validator), $validator);
        }

        try {
            $game = $this->catalog->replaceSchoolEntitlements($game, $request->input('school_ids', []));
        } catch (InvalidArgumentException $ex) {
            return $this->returnError('422', $ex->getMessage(), 422);
        }

        return $this->returnData('game', $this->serializeGame($game, true), 'School entitlements updated.', 200);
    }

    /**
     * @return array<string,mixed>
     */
    protected function serializeGame(LiveGame $game, bool $includeQuestions = false): array
    {
        $schoolIds = $game->relationLoaded('schools')
            ? $game->schools->pluck('id')->map(function ($id) {
                return (int) $id;
            })->values()->all()
            : $game->schoolLinks()->pluck('school_id')->map(function ($id) {
                return (int) $id;
            })->values()->all();

        $payload = [
            'id' => $game->id,
            'name' => $game->name,
            'time' => $game->time,
            'logo' => $game->logo,
            'type' => $game->type,
            'level' => $game->level,
            'background' => $game->background,
            'status' => (int) $game->status,
            'is_published' => $game->isPublished(),
            'created_by' => $game->created_by,
            'questions_count' => $game->relationLoaded('questions')
                ? $game->questions->count()
                : $game->questions()->count(),
            'school_ids' => $schoolIds,
            'entitled_school_count' => count($schoolIds),
            'empty_entitlements_authorize_no_schools' => true,
            'selectable_for_new_competition' => $game->isPublished() && count($schoolIds) > 0,
            'created_at' => $game->created_at,
            'updated_at' => $game->updated_at,
        ];

        if ($includeQuestions) {
            $payload['questions'] = $game->questions->map(function ($question) {
                return [
                    'id' => $question->id,
                    'sort_order' => $question->sort_order,
                    'question' => $question->question,
                    'image' => $question->image,
                    'voice_url' => $question->voice_url,
                    'answer_type' => $question->answer_type,
                    'correct_answer' => $question->correct_answer,
                    'answer1' => $question->answer1,
                    'answer2' => $question->answer2,
                    'answer3' => $question->answer3,
                    'answer4' => $question->answer4,
                    'explanation' => $question->explanation,
                ];
            })->values();
            $payload['schools'] = $this->serializeSchools($game);
        }

        return $payload;
    }

    /**
     * @return list<array<string,mixed>>
     */
    protected function serializeSchools(LiveGame $game): array
    {
        if (! $game->relationLoaded('schools')) {
            $game->load('schools');
        }

        return $game->schools->map(function ($school) {
            return [
                'id' => $school->id,
                'name' => $school->name,
                'name_ar' => $school->name_ar ?? null,
            ];
        })->values()->all();
    }
}
