<?php

namespace App\Support\LiveCompetitions;

use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Models\Schools;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class LiveCompetitionCatalogService
{
    /** @var LiveCompetitionWorkbookParser */
    protected $parser;

    /** @var LiveCompetitionPreviewTokenGuard */
    protected $tokens;

    public function __construct(
        ?LiveCompetitionWorkbookParser $parser = null,
        ?LiveCompetitionPreviewTokenGuard $tokens = null
    ) {
        $this->parser = $parser ?: new LiveCompetitionWorkbookParser();
        $this->tokens = $tokens ?: new LiveCompetitionPreviewTokenGuard();
    }

    /**
     * @return array{valid:bool,errors:list<array<string,mixed>>,game:?array,questions:list<array>,preview_token:?string,preview_expires_at:?string}
     */
    public function preview(string $path, int $userId): array
    {
        $parsed = $this->parser->parse($path);
        $token = null;
        $expiresAt = null;
        if ($parsed['valid']) {
            $token = $this->tokens->issue($userId, $parsed['game'], $parsed['questions']);
            $claims = $this->tokens->parse($token);
            $expiresAt = date('c', $claims['exp']);
        }

        return [
            'valid' => $parsed['valid'],
            'errors' => $parsed['errors'],
            'game' => $parsed['game'],
            'questions' => $parsed['questions'],
            'preview_token' => $token,
            'preview_expires_at' => $expiresAt,
        ];
    }

    /**
     * Revalidates the workbook and media, then persists inside a transaction.
     * The preview token is consumed before insert so a concurrent confirm cannot
     * both succeed on this app server.
     *
     * @return LiveGame
     */
    public function confirm(string $path, string $previewToken, int $userId): LiveGame
    {
        $parsed = $this->parser->parse($path);
        if (! $parsed['valid']) {
            throw new InvalidArgumentException('Workbook failed validation.');
        }

        $this->tokens->consume($previewToken, $userId, $parsed['game'], $parsed['questions']);

        return DB::transaction(function () use ($parsed, $userId) {
            $game = LiveGame::create([
                'name' => $parsed['game']['name'],
                'time' => $parsed['game']['time'],
                'logo' => $parsed['game']['logo'],
                'type' => $parsed['game']['type'],
                'level' => $parsed['game']['level'],
                'background' => $parsed['game']['background'],
                'status' => LiveGame::STATUS_UNPUBLISHED,
                'created_by' => $userId,
            ]);

            foreach ($parsed['questions'] as $question) {
                LiveGameQuestion::create(array_merge($question, [
                    'live_game_id' => $game->id,
                ]));
            }

            return $game->fresh(['questions', 'schools']);
        });
    }

    /**
     * Teacher-selectable catalog: published games entitled to at least one of
     * the given school IDs. Empty entitlements authorize no schools.
     *
     * @param  int[]  $schoolIds
     * @return list<array<string,mixed>>
     */
    public function availableForSchools(array $schoolIds): array
    {
        $normalized = [];
        foreach ($schoolIds as $id) {
            $schoolId = (int) $id;
            if ($schoolId > 0) {
                $normalized[$schoolId] = $schoolId;
            }
        }
        $normalized = array_values($normalized);

        if ($normalized === []) {
            return [];
        }

        $games = LiveGame::query()
            ->where('status', LiveGame::STATUS_PUBLISHED)
            ->whereHas('schoolLinks', function ($query) use ($normalized) {
                $query->whereIn('school_id', $normalized);
            })
            ->with(['schoolLinks' => function ($query) use ($normalized) {
                $query->whereIn('school_id', $normalized);
            }])
            ->withCount('questions')
            ->latest()
            ->get();

        return $games->map(function (LiveGame $game) use ($normalized) {
            return $this->serializeTeacherGame($game, $normalized);
        })->values()->all();
    }

    /**
     * @param  int[]  $teacherSchoolIds
     * @return array<string,mixed>
     */
    public function serializeTeacherGame(LiveGame $game, array $teacherSchoolIds): array
    {
        $entitled = $game->schoolLinks
            ->pluck('school_id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->filter(function ($id) use ($teacherSchoolIds) {
                return in_array($id, $teacherSchoolIds, true);
            })
            ->values()
            ->all();

        return [
            'id' => $game->id,
            'name' => $game->name,
            'time' => $game->time,
            'logo' => $game->logo,
            'type' => $game->type,
            'level' => $game->level,
            'background' => $game->background,
            'status' => (int) $game->status,
            'is_published' => $game->isPublished(),
            'questions_count' => (int) ($game->questions_count ?? $game->questions()->count()),
            'entitled_school_ids' => $entitled,
            'selectable_for_new_competition' => $game->isPublished() && $entitled !== [],
        ];
    }

    public function publish(LiveGame $game): LiveGame
    {
        if ($game->isPublished()) {
            throw new RuntimeException('Game is already published.');
        }

        $game->status = LiveGame::STATUS_PUBLISHED;
        $game->save();

        return $game->fresh(['questions', 'schools']);
    }

    public function unpublish(LiveGame $game): LiveGame
    {
        if (! $game->isPublished()) {
            throw new RuntimeException('Game is already unpublished.');
        }

        $game->status = LiveGame::STATUS_UNPUBLISHED;
        $game->save();

        return $game->fresh(['questions', 'schools']);
    }

    /**
     * @param  array<int,mixed>  $schoolIds
     */
    public function replaceSchoolEntitlements(LiveGame $game, array $schoolIds): LiveGame
    {
        $normalized = [];
        foreach ($schoolIds as $id) {
            if ($id === null || $id === '') {
                throw new InvalidArgumentException('School IDs must be integers.');
            }
            if (! preg_match('/^-?\d+$/', (string) $id)) {
                throw new InvalidArgumentException('School IDs must be integers.');
            }
            $normalized[] = (int) $id;
        }

        if (count($normalized) !== count(array_unique($normalized))) {
            throw new InvalidArgumentException('Duplicate school IDs are not allowed.');
        }

        foreach ($normalized as $schoolId) {
            if ($schoolId <= 0 || ! Schools::query()->where('id', $schoolId)->exists()) {
                throw new InvalidArgumentException('School ID '.$schoolId.' is invalid.');
            }
        }

        DB::transaction(function () use ($game, $normalized) {
            LiveGameSchool::query()->where('live_game_id', $game->id)->delete();
            foreach ($normalized as $schoolId) {
                LiveGameSchool::create([
                    'live_game_id' => $game->id,
                    'school_id' => $schoolId,
                ]);
            }
        });

        return $game->fresh(['questions', 'schools']);
    }
}
