<?php

namespace App\Services\Student;

use App\Models\StudentLessonContentCompletion;
use App\Models\StudentXpBalance;
use App\Models\StudentXpEvent;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Syncs XP ledger from existing student activity records (no mock values).
 */
class StudentXpService
{
    /**
     * @return array{total_xp: int, level: int, xp_in_level: int, xp_to_next_level: int|null, next_level_threshold: int|null}
     */
    public function syncAndGet(int $studentId): array
    {
        try {
            if (! Schema::hasTable('student_xp_events') || ! Schema::hasTable('student_xp_balances')) {
                return $this->emptyPayload();
            }

            DB::transaction(function () use ($studentId) {
                $this->syncLessonEvents($studentId);
                $this->syncQuizEvents($studentId);
                $this->refreshBalance($studentId);
            });

            $balance = StudentXpBalance::query()->where('student_id', $studentId)->first();

            if ($balance === null) {
                return $this->emptyPayload();
            }

            return $this->payloadFromBalance($balance);
        } catch (\Throwable $e) {
            report($e);

            return $this->emptyPayload();
        }
    }

    /**
     * @return array{total_xp: int, level: int, xp_in_level: int, xp_to_next_level: int|null, next_level_threshold: int|null}
     */
    public function get(int $studentId): array
    {
        return $this->syncAndGet($studentId);
    }

    private function syncLessonEvents(int $studentId): void
    {
        if (! Schema::hasTable('student_lesson_content_completions')) {
            return;
        }

        $points = (int) config('student_xp.event_points.lesson_content', 30);

        StudentLessonContentCompletion::query()
            ->where('student_id', $studentId)
            ->orderBy('id')
            ->chunk(200, function ($rows) use ($studentId, $points) {
                foreach ($rows as $row) {
                    $this->upsertEvent(
                        $studentId,
                        'lesson_content',
                        (int) $row->id,
                        $points,
                        Carbon::parse($row->completed_at ?? $row->created_at ?? now())
                    );
                }
            });
    }

    private function syncQuizEvents(int $studentId): void
    {
        if (! config('student_xp.quiz_xp_from_percent', true)) {
            return;
        }

        if (! Schema::hasTable('quiz_results')) {
            return;
        }

        StudentXpEvent::query()
            ->where('student_id', $studentId)
            ->where('source_type', 'quiz_result')
            ->delete();

        $query = DB::table('quiz_results')
            ->where('student_id', $studentId)
            ->whereNotNull('percent');

        if (Schema::hasColumn('quiz_results', 'is_authoritative')) {
            $query->where('is_authoritative', 1);
        }

        /** @var array<int, object> $bestByQuiz */
        $bestByQuiz = [];

        $query->orderBy('id')->chunk(200, function ($rows) use (&$bestByQuiz) {
            foreach ($rows as $row) {
                $quizId = (int) $row->quiz_id;
                $percent = (float) ($row->percent ?? 0);

                if (! isset($bestByQuiz[$quizId])) {
                    $bestByQuiz[$quizId] = $row;

                    continue;
                }

                $currentBest = (float) ($bestByQuiz[$quizId]->percent ?? 0);

                if ($percent > $currentBest) {
                    $bestByQuiz[$quizId] = $row;

                    continue;
                }

                if ($percent === $currentBest) {
                    $existingAt = Carbon::parse(
                        $bestByQuiz[$quizId]->finalized_at
                            ?? $bestByQuiz[$quizId]->created_at
                            ?? now()
                    );
                    $candidateAt = Carbon::parse($row->finalized_at ?? $row->created_at ?? now());

                    if ($candidateAt->greaterThan($existingAt)) {
                        $bestByQuiz[$quizId] = $row;
                    }
                }
            }
        });

        $syncedQuizIds = [];

        foreach ($bestByQuiz as $quizId => $row) {
            $syncedQuizIds[] = (int) $quizId;
            $amount = max(1, (int) round((float) ($row->percent ?? 0)));
            $earnedAt = $row->finalized_at ?? $row->created_at ?? now();

            $this->upsertEvent(
                $studentId,
                'quiz',
                (int) $quizId,
                $amount,
                Carbon::parse($earnedAt)
            );
        }

        if ($syncedQuizIds !== []) {
            StudentXpEvent::query()
                ->where('student_id', $studentId)
                ->where('source_type', 'quiz')
                ->whereNotIn('source_id', $syncedQuizIds)
                ->delete();
        } else {
            StudentXpEvent::query()
                ->where('student_id', $studentId)
                ->where('source_type', 'quiz')
                ->delete();
        }
    }

    private function upsertEvent(
        int $studentId,
        string $sourceType,
        int $sourceId,
        int $amount,
        Carbon $earnedAt
    ): void {
        StudentXpEvent::query()->updateOrCreate(
            [
                'student_id'  => $studentId,
                'source_type' => $sourceType,
                'source_id'   => $sourceId,
            ],
            [
                'amount'    => max(0, $amount),
                'earned_at' => $earnedAt,
            ]
        );
    }

    private function refreshBalance(int $studentId): void
    {
        $total = (int) StudentXpEvent::query()
            ->where('student_id', $studentId)
            ->sum('amount');

        $level = $this->resolveLevel($total);

        StudentXpBalance::query()->updateOrCreate(
            ['student_id' => $studentId],
            [
                'total_xp' => $total,
                'level'    => $level,
            ]
        );
    }

    public function resolveLevel(int $totalXp): int
    {
        $step = max(1, (int) config('student_xp.xp_per_level', 300));
        $max = max(1, (int) config('student_xp.max_level', 12));

        if ($totalXp <= 0) {
            return 1;
        }

        $level = (int) floor($totalXp / $step) + 2;

        return min($max, max(1, $level));
    }

    public function levelFloorXp(int $level): int
    {
        $step = max(1, (int) config('student_xp.xp_per_level', 300));

        if ($level <= 1) {
            return 0;
        }

        return ($level - 2) * $step;
    }

    /**
     * Single SSOT for all level-derived progress fields.
     *
     * @return array{
     *     total_xp: int,
     *     level: int,
     *     xp_in_level: int,
     *     xp_to_next_level: int|null,
     *     next_level_threshold: int|null
     * }
     */
    public function progressFromTotalXp(int $totalXp): array
    {
        $step = max(1, (int) config('student_xp.xp_per_level', 300));
        $max = max(1, (int) config('student_xp.max_level', 12));
        $total = max(0, $totalXp);
        $level = $this->resolveLevel($total);
        $floorXp = $this->levelFloorXp($level);
        $nextThreshold = $level >= $max ? null : $level * $step;
        $xpInLevel = max(0, $total - $floorXp);
        $xpToNext = $nextThreshold === null ? null : max(0, $nextThreshold - $total);

        return [
            'total_xp'             => $total,
            'level'                => $level,
            'xp_in_level'          => $xpInLevel,
            'xp_to_next_level'     => $xpToNext,
            'next_level_threshold' => $nextThreshold,
        ];
    }

    public function pointsForEventType(string $eventType): ?int
    {
        $points = config('student_xp.event_points.'.$eventType);

        return is_numeric($points) ? (int) $points : null;
    }

    public function earnedXpForSource(int $studentId, string $sourceType, int $sourceId): ?int
    {
        if (! Schema::hasTable('student_xp_events')) {
            return null;
        }

        $amount = StudentXpEvent::query()
            ->where('student_id', $studentId)
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->value('amount');

        return $amount !== null ? (int) $amount : null;
    }

    public function weeklyXpEarned(int $studentId): int
    {
        if (! Schema::hasTable('student_xp_events')) {
            return 0;
        }

        $weekStart = Carbon::now()->startOfWeek();

        return (int) StudentXpEvent::query()
            ->where('student_id', $studentId)
            ->where('earned_at', '>=', $weekStart)
            ->sum('amount');
    }

    /**
     * Dashboard My Progress widget — real XP gamification payload.
     *
     * @return array<string, mixed>
     */
    public function buildDashboardPayload(int $studentId): array
    {
        try {
            $core = $this->syncAndGet($studentId);
            $step = max(1, (int) config('student_xp.xp_per_level', 300));
            $achieverLevel = max(1, (int) config('student_xp.achiever_level', 12));
            $trackStartLevel = max(1, (int) config('student_xp.progress_track_start_level', 9));

            $level = (int) $core['level'];
            $total = (int) $core['total_xp'];
            $trackStartXp = $this->levelFloorXp($trackStartLevel);
            $trackEndXp = $achieverLevel * $step;
            $trackSpan = max(1, $trackEndXp - $trackStartXp);
            $fillPercent = min(100, max(0, (($total - $trackStartXp) / $trackSpan) * 100));

            return array_merge($core, [
                'weekly_xp'                  => $this->weeklyXpEarned($studentId),
                'level_badge_label'          => $this->resolveLevelBadgeLabel($level),
                'levels_away_from_achiever'  => max(0, $achieverLevel - $level),
                'achiever_level'             => $achieverLevel,
                'xp_per_level'               => $step,
                'max_level'                  => max(1, (int) config('student_xp.max_level', 12)),
                'track'                      => [
                    'start_level'   => $trackStartLevel,
                    'end_level'     => $achieverLevel,
                    'start_xp'      => $trackStartXp,
                    'end_xp'        => $trackEndXp,
                    'fill_percent'  => round($fillPercent, 2),
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->emptyDashboardPayload();
        }
    }

    /**
     * Safe fallback when dashboard XP payload cannot be built.
     *
     * @return array<string, mixed>
     */
    public function emptyDashboardPayload(): array
    {
        $step = max(1, (int) config('student_xp.xp_per_level', 300));
        $achieverLevel = max(1, (int) config('student_xp.achiever_level', 12));
        $trackStartLevel = max(1, (int) config('student_xp.progress_track_start_level', 9));

        return array_merge($this->emptyPayload(), [
            'weekly_xp'                 => 0,
            'level_badge_label'         => 'explorer',
            'levels_away_from_achiever' => max(0, $achieverLevel - 1),
            'achiever_level'            => $achieverLevel,
            'xp_per_level'              => $step,
            'max_level'                 => max(1, (int) config('student_xp.max_level', 12)),
            'track'                     => [
                'start_level'  => $trackStartLevel,
                'end_level'    => $achieverLevel,
                'start_xp'     => $this->levelFloorXp($trackStartLevel),
                'end_xp'       => $achieverLevel * $step,
                'fill_percent' => 0.0,
            ],
        ]);
    }

    public function resolveLevelBadgeLabel(int $level): string
    {
        $labels = config('student_xp.level_badge_labels', []);
        if (is_array($labels) && isset($labels[$level])) {
            return (string) $labels[$level];
        }

        if ($level >= (int) config('student_xp.achiever_level', 12)) {
            return 'Achiever';
        }

        if ($level >= (int) config('student_xp.progress_track_start_level', 9)) {
            return 'builder';
        }

        return 'explorer';
    }

    /**
     * @return array{total_xp: int, level: int, xp_in_level: int, xp_to_next_level: int|null, next_level_threshold: int|null}
     */
    private function payloadFromBalance(StudentXpBalance $balance): array
    {
        return $this->progressFromTotalXp((int) $balance->total_xp);
    }

    /**
     * @return array{total_xp: int, level: int, xp_in_level: int, xp_to_next_level: int|null, next_level_threshold: int|null}
     */
    private function emptyPayload(): array
    {
        return $this->progressFromTotalXp(0);
    }
}
