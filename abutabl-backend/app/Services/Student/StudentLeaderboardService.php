<?php

namespace App\Services\Student;

use App\Models\Student;
use App\Models\StudentXpBalance;
use App\Models\StudentXpEvent;
use App\Services\SmartInsight\InsightMetricsReader;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Builds School / Class XP-ranked leaderboard for the Student Portal.
 *
 * Ranking is XP-based (unlike teacher ClassStudentsOverviewService which
 * uses assignment-completion + progress metrics). Does NOT reuse teacher scope;
 * operates entirely from the authenticated student's school_id / class_id.
 */
class StudentLeaderboardService
{
    /** Valid scope values */
    public const SCOPE_SCHOOL = 'school';
    public const SCOPE_CLASS  = 'class';

    /** Valid range values */
    public const RANGE_WEEK     = 'week';
    public const RANGE_MONTH    = 'month';
    public const RANGE_ALL_TIME = 'all_time';

    /** @var StudentXpService */
    private $xp;

    /** @var InsightMetricsReader */
    private $insightReader;

    public function __construct(StudentXpService $xp, InsightMetricsReader $insightReader)
    {
        $this->xp          = $xp;
        $this->insightReader = $insightReader;
    }

    /**
     * Build the full leaderboard payload for the authenticated student.
     *
     * @return array<string, mixed>
     */
    public function build(int $studentId, string $scope = self::SCOPE_SCHOOL, string $range = self::RANGE_WEEK): array
    {
        $scope = $this->normalizeScope($scope);
        $range = $this->normalizeRange($range);

        $student = Student::query()
            ->with(['School', 'grade', 'class'])
            ->find($studentId);

        if (! $student) {
            return $this->emptyPayload($scope, $range);
        }

        $schoolId = (int) $student->school_id;
        $classId  = (int) $student->class_id;

        // Resolve the peer student IDs for this scope
        $peerIds = $this->resolvePeerIds($scope, $schoolId, $classId);

        if ($peerIds === []) {
            return $this->emptyPayload($scope, $range, $studentId, $student);
        }

        // Ensure the authenticated student is included (even if edge-case missing)
        if (! in_array($studentId, $peerIds, true)) {
            $peerIds[] = $studentId;
        }

        // Resolve XP for each peer in the requested range
        $rangeXpByStudent   = $this->loadRangeXp($peerIds, $range);
        $totalXpByStudent   = $this->loadTotalXpFromBalances($peerIds);

        // Build ranked list
        $items = $this->buildRankedItems(
            $peerIds,
            $rangeXpByStudent,
            $totalXpByStudent,
            $studentId
        );

        // Current range rank
        $currentRow  = collect($items)->firstWhere('is_current', true);
        $currentRank = $currentRow ? (int) $currentRow['rank'] : null;

        // Rank delta: compare current rank vs previous period rank
        $rankDelta = $this->resolveRankDelta($studentId, $peerIds, $range, $currentRank);

        // Streak for summary
        $streak         = $this->insightReader->streakPayloadForStudent($studentId);
        $currentStreak  = (int) ($streak['current_streak'] ?? 0);

        // Total / range XP for current student
        $totalXp = $totalXpByStudent[$studentId] ?? 0;
        $rangeXp = $rangeXpByStudent[$studentId] ?? 0;
        $level   = $this->xp->resolveLevel($totalXp);

        // Student display name (locale-aware)
        $displayName = app()->getLocale() === 'ar'
            ? ($student->name_ar ?: $student->name)
            : ($student->name ?: $student->name_ar);

        $photoUrl = $student->photo
            ? (str_starts_with((string) $student->photo, 'http')
                ? $student->photo
                : asset('storage/' . $student->photo))
            : null;

        return [
            'current_user_summary' => [
                'student_id'     => $studentId,
                'name'           => (string) ($displayName ?? ''),
                'photo_url'      => $photoUrl,
                'rank'           => $currentRank,
                'rank_delta'     => $rankDelta,
                'total_xp'       => $totalXp,
                'range_xp'       => $rangeXp,
                'level'          => $level,
                'current_streak' => $currentStreak,
            ],
            'tabs' => [
                'active_scope' => $scope,
                'active_range' => $range,
            ],
            'items' => $items,
        ];
    }

    // -------------------------------------------------------------------------
    // Scope resolution
    // -------------------------------------------------------------------------

    /**
     * @return int[]
     */
    private function resolvePeerIds(string $scope, int $schoolId, int $classId): array
    {
        if ($scope === self::SCOPE_CLASS && $classId > 0) {
            return Student::query()
                ->where('class_id', $classId)
                ->where('status', '1')
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        if ($schoolId > 0) {
            return Student::query()
                ->where('school_id', $schoolId)
                ->where('status', '1')
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        return [];
    }

    // -------------------------------------------------------------------------
    // XP aggregation
    // -------------------------------------------------------------------------

    /**
     * XP earned within the requested range, keyed by student_id.
     *
     * @param  int[]  $studentIds
     * @return array<int, int>
     */
    private function loadRangeXp(array $studentIds, string $range): array
    {
        if ($studentIds === [] || ! Schema::hasTable('student_xp_events')) {
            return [];
        }

        $from = $this->rangeStart($range);

        $query = DB::table('student_xp_events')
            ->whereIn('student_id', $studentIds);

        if ($from !== null) {
            $query->where('earned_at', '>=', $from);
        }

        $rows = $query
            ->selectRaw('student_id, SUM(amount) as xp_sum')
            ->groupBy('student_id')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[(int) $row->student_id] = (int) $row->xp_sum;
        }

        return $map;
    }

    /**
     * Total XP from student_xp_balances (fast; avoids full event scan for all-time).
     *
     * @param  int[]  $studentIds
     * @return array<int, int>
     */
    private function loadTotalXpFromBalances(array $studentIds): array
    {
        if ($studentIds === [] || ! Schema::hasTable('student_xp_balances')) {
            return [];
        }

        $rows = StudentXpBalance::query()
            ->whereIn('student_id', $studentIds)
            ->get(['student_id', 'total_xp']);

        $map = [];
        foreach ($rows as $row) {
            $map[(int) $row->student_id] = (int) $row->total_xp;
        }

        return $map;
    }

    // -------------------------------------------------------------------------
    // Ranking
    // -------------------------------------------------------------------------

    /**
     * Build a ranked list sorted by range-XP descending (ties broken alphabetically).
     *
     * @param  int[]            $peerIds
     * @param  array<int, int>  $rangeXpByStudent
     * @param  array<int, int>  $totalXpByStudent
     * @return array<int, array<string, mixed>>
     */
    private function buildRankedItems(
        array $peerIds,
        array $rangeXpByStudent,
        array $totalXpByStudent,
        int $currentStudentId
    ): array {
        // Load display data for all peers in one query
        $students = Student::query()
            ->whereIn('id', $peerIds)
            ->get(['id', 'name', 'name_ar', 'photo']);

        $studentsById = $students->keyBy(fn ($s) => (int) $s->id);

        // Build unsorted rows
        $rows = [];
        foreach ($peerIds as $peerId) {
            $peerId   = (int) $peerId;
            $model    = $studentsById->get($peerId);
            $rangeXp  = $rangeXpByStudent[$peerId] ?? 0;
            $totalXp  = $totalXpByStudent[$peerId]  ?? 0;

            $name = '';
            $photoUrl = null;

            if ($model) {
                $name = app()->getLocale() === 'ar'
                    ? ($model->name_ar ?: $model->name)
                    : ($model->name ?: $model->name_ar);
                $name = (string) ($name ?? '');

                if ($model->photo) {
                    $photoUrl = str_starts_with((string) $model->photo, 'http')
                        ? $model->photo
                        : asset('storage/' . $model->photo);
                }
            }

            $rows[] = [
                'student_id' => $peerId,
                'name'       => $name,
                'photo_url'  => $photoUrl,
                'xp'         => $rangeXp,
                'total_xp'   => $totalXp,
                'is_current' => $peerId === $currentStudentId,
            ];
        }

        // Sort: range XP desc → total XP desc → name asc
        usort($rows, function (array $a, array $b) {
            $xpCmp = $b['xp'] <=> $a['xp'];
            if ($xpCmp !== 0) {
                return $xpCmp;
            }

            $totalCmp = $b['total_xp'] <=> $a['total_xp'];
            if ($totalCmp !== 0) {
                return $totalCmp;
            }

            return strcasecmp($a['name'], $b['name']);
        });

        // Assign dense rank (ties share rank)
        $rank     = 0;
        $prevKey  = null;

        foreach ($rows as $i => $row) {
            $key = $row['xp'] . '|' . $row['total_xp'];
            if ($key !== $prevKey) {
                $rank    = $i + 1;
                $prevKey = $key;
            }
            $rows[$i]['rank'] = $rank;
        }

        // Drop internal total_xp from public items (it was used for tie-breaking only)
        return array_values(array_map(function (array $row) {
            unset($row['total_xp']);
            return $row;
        }, $rows));
    }

    // -------------------------------------------------------------------------
    // Rank delta
    // -------------------------------------------------------------------------

    /**
     * Compare current period rank against previous period rank.
     * Positive delta = risen (was rank N, now lower number), negative = dropped.
     * Returns null when not enough data to determine.
     */
    private function resolveRankDelta(
        int $studentId,
        array $peerIds,
        string $range,
        ?int $currentRank
    ): ?int {
        if ($currentRank === null || ! Schema::hasTable('student_xp_events')) {
            return null;
        }

        [$prevFrom, $prevTo] = $this->previousPeriodBounds($range);

        if ($prevFrom === null) {
            // all_time has no meaningful delta
            return null;
        }

        // Load previous-period XP for all peers
        $rows = DB::table('student_xp_events')
            ->whereIn('student_id', $peerIds)
            ->where('earned_at', '>=', $prevFrom)
            ->where('earned_at', '<', $prevTo)
            ->selectRaw('student_id, SUM(amount) as xp_sum')
            ->groupBy('student_id')
            ->get();

        $prevXpByStudent = [];
        foreach ($rows as $row) {
            $prevXpByStudent[(int) $row->student_id] = (int) $row->xp_sum;
        }

        // Rank students in previous period (same sort logic, no model re-load needed)
        $prevRows = array_map(fn (int $id) => [
            'student_id' => $id,
            'xp'         => $prevXpByStudent[$id] ?? 0,
        ], $peerIds);

        usort($prevRows, fn (array $a, array $b) => $b['xp'] <=> $a['xp']);

        $prevRank = null;
        $prevRankCounter = 0;
        $prevKey = null;

        foreach ($prevRows as $i => $row) {
            $key = (string) $row['xp'];
            if ($key !== $prevKey) {
                $prevRankCounter = $i + 1;
                $prevKey = $key;
            }

            if ($row['student_id'] === $studentId) {
                $prevRank = $prevRankCounter;
                break;
            }
        }

        if ($prevRank === null) {
            return null;
        }

        // Positive = moved up (smaller rank number), negative = dropped
        return $prevRank - $currentRank;
    }

    // -------------------------------------------------------------------------
    // Range helpers
    // -------------------------------------------------------------------------

    private function normalizeScope(string $scope): string
    {
        return in_array($scope, [self::SCOPE_SCHOOL, self::SCOPE_CLASS], true)
            ? $scope
            : self::SCOPE_SCHOOL;
    }

    private function normalizeRange(string $range): string
    {
        return in_array($range, [self::RANGE_WEEK, self::RANGE_MONTH, self::RANGE_ALL_TIME], true)
            ? $range
            : self::RANGE_WEEK;
    }

    private function rangeStart(string $range): ?Carbon
    {
        if ($range === self::RANGE_ALL_TIME) {
            return null;
        }

        if ($range === self::RANGE_MONTH) {
            return Carbon::now()->startOfMonth();
        }

        return Carbon::now()->startOfWeek();
    }

    /**
     * Returns [from, to) for the period immediately before the current range.
     *
     * @return array{Carbon|null, Carbon|null}
     */
    private function previousPeriodBounds(string $range): array
    {
        if ($range === self::RANGE_ALL_TIME) {
            return [null, null];
        }

        if ($range === self::RANGE_MONTH) {
            $currentStart = Carbon::now()->startOfMonth();
            $prevStart    = $currentStart->copy()->subMonth()->startOfMonth();

            return [$prevStart, $currentStart];
        }

        // week
        $currentStart = Carbon::now()->startOfWeek();
        $prevStart    = $currentStart->copy()->subWeek();

        return [$prevStart, $currentStart];
    }

    // -------------------------------------------------------------------------
    // Empty payloads
    // -------------------------------------------------------------------------

    /**
     * @param  Student|null  $student
     * @return array<string, mixed>
     */
    private function emptyPayload(string $scope, string $range, int $studentId = 0, $student = null): array
    {
        $name = '';
        $photoUrl = null;

        if ($student) {
            $name = app()->getLocale() === 'ar'
                ? ($student->name_ar ?: $student->name)
                : ($student->name ?: $student->name_ar);
            $name = (string) ($name ?? '');

            if ($student->photo) {
                $photoUrl = str_starts_with((string) $student->photo, 'http')
                    ? $student->photo
                    : asset('storage/' . $student->photo);
            }
        }

        return [
            'current_user_summary' => [
                'student_id'     => $studentId,
                'name'           => $name,
                'photo_url'      => $photoUrl,
                'rank'           => null,
                'rank_delta'     => null,
                'total_xp'       => 0,
                'range_xp'       => 0,
                'level'          => 1,
                'current_streak' => 0,
            ],
            'tabs' => [
                'active_scope' => $scope,
                'active_range' => $range,
            ],
            'items' => [],
        ];
    }
}
