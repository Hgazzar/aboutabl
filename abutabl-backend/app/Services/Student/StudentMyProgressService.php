<?php

namespace App\Services\Student;

use App\Models\Student;
use App\Models\StudentLessonContentCompletion;
use App\Models\StudentLessonCompletion;
use App\Models\Subject;
use App\Models\subjectsSchools;
use App\Services\SmartInsight\InsightMetricsReader;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Assembles the My Progress screen payload from existing authoritative services.
 *
 * Does not duplicate XP / streak / achievement / continue-learning business rules.
 * Curriculum books = enrolled subjects (school + grade). No assignment unlock.
 */
class StudentMyProgressService
{
    /** @var StudentXpService */
    private $xp;

    /** @var StudentLeaderboardService */
    private $leaderboard;

    /** @var InsightMetricsReader */
    private $insightReader;

    /** @var StudentAchievementService */
    private $achievements;

    /** @var StudentContinueLearningService */
    private $continueLearning;

    /** @var StudentCurriculumAccessService */
    private $curriculumAccess;

    public function __construct(
        StudentXpService $xp,
        StudentLeaderboardService $leaderboard,
        InsightMetricsReader $insightReader,
        StudentAchievementService $achievements,
        StudentContinueLearningService $continueLearning,
        StudentCurriculumAccessService $curriculumAccess
    ) {
        $this->xp = $xp;
        $this->leaderboard = $leaderboard;
        $this->insightReader = $insightReader;
        $this->achievements = $achievements;
        $this->continueLearning = $continueLearning;
        $this->curriculumAccess = $curriculumAccess;
    }

    /**
     * @return array<string, mixed>
     */
    public function build(int $studentId): array
    {
        $student = Student::query()->find($studentId);
        if ($student === null) {
            return $this->emptyPayload();
        }

        $xpPayload = $this->xp->buildDashboardPayload($studentId);
        $leaderboard = $this->leaderboard->build(
            $studentId,
            StudentLeaderboardService::SCOPE_SCHOOL,
            StudentLeaderboardService::RANGE_ALL_TIME
        );
        $streak = $this->insightReader->streakPayloadForStudent($studentId);
        $achievements = $this->achievements->buildForStudent($studentId);

        $subjects = $this->loadEnrolledSubjects($student);
        $subjectIds = array_map(static fn ($s) => (int) $s->id, $subjects);

        $unitProgress = $this->batchUnitProgress($studentId, $subjectIds);
        $weeklyXpBySubject = $this->batchSubjectWeeklyXp($studentId, $subjectIds);
        $accuracyBySubject = $this->batchSubjectAccuracy($studentId, $subjectIds);
        $demoActivities = (bool) config('student_my_progress.demo_show_activities', false);
        $activitiesBySubject = $demoActivities
            ? $this->batchSubjectSlccCounts($studentId, $subjectIds)
            : [];

        $books = [];
        foreach ($subjects as $subject) {
            $sid = (int) $subject->id;
            $unitsCompleted = $unitProgress[$sid]['completed'] ?? 0;
            $unitsTotal = $unitProgress[$sid]['total'] ?? 0;
            $progressPercent = $unitsTotal > 0
                ? round(($unitsCompleted / $unitsTotal) * 100, 2)
                : ($unitsTotal === 0 ? 0.0 : null);

            $continue = $this->continueLearning->buildForSubject($studentId, $sid);
            $rewardXp = $this->xp->pointsForEventType('lesson_content');

            $accuracy = $accuracyBySubject[$sid] ?? null;

            // Deferred until product defines Completed Activities SSOT (not SLCC).
            // Local-only override: MY_PROGRESS_DEMO_ACTIVITIES=true (APP_ENV=local).
            $activitiesCompleted = null;
            $activitiesAvailable = false;
            if ($demoActivities) {
                $activitiesCompleted = (int) ($activitiesBySubject[$sid] ?? 0);
                $activitiesAvailable = true;
            }

            $books[] = [
                'subject_id' => $sid,
                'title' => (string) ($subject->title ?? ''),
                'description' => $subject->description !== null ? (string) $subject->description : null,
                'photo' => $subject->photo ?? null,
                'stars' => ['decorative' => true],
                'units_completed' => $unitsCompleted,
                'units_total' => $unitsTotal,
                'progress_percent' => $progressPercent,
                'xp_this_week' => (int) ($weeklyXpBySubject[$sid] ?? 0),
                'accuracy_percent' => $accuracy,
                'activities_completed' => $activitiesCompleted,
                'activities_available' => $activitiesAvailable,
                'next_goal' => $this->mapNextGoal($continue, $rewardXp),
            ];
        }

        $rank = $leaderboard['current_user_summary']['rank'] ?? null;

        return [
            'hero' => [
                'name' => (string) ($student->name ?? ''),
                'level' => (int) ($xpPayload['level'] ?? 1),
                'level_badge_label' => (string) ($xpPayload['level_badge_label'] ?? ''),
                'total_xp' => (int) ($xpPayload['total_xp'] ?? 0),
                'next_level_threshold' => $xpPayload['next_level_threshold'] ?? null,
                'xp_to_next' => $xpPayload['xp_to_next_level'] ?? null,
                'track' => [
                    'start_level' => (int) ($xpPayload['track']['start_level'] ?? 9),
                    'current_level' => (int) ($xpPayload['level'] ?? 1),
                    'achiever_level' => (int) ($xpPayload['achiever_level'] ?? ($xpPayload['track']['end_level'] ?? 12)),
                    'fill_percent' => (float) ($xpPayload['track']['fill_percent'] ?? 0),
                ],
                'levels_away_from_achiever' => (int) ($xpPayload['levels_away_from_achiever'] ?? 0),
                'weekly_xp' => (int) ($xpPayload['weekly_xp'] ?? 0),
                'previous_weekly_xp' => (int) ($xpPayload['previous_weekly_xp'] ?? 0),
            ],
            'statistics' => [
                'total_xp' => (int) ($xpPayload['total_xp'] ?? 0),
                'current_rank' => $rank !== null ? (int) $rank : null,
                'rank_scope' => StudentLeaderboardService::SCOPE_SCHOOL,
                'rank_range' => StudentLeaderboardService::RANGE_ALL_TIME,
                'current_streak' => (int) ($streak['current_streak'] ?? 0),
            ],
            'books' => $books,
            'achievements' => $achievements,
            // Right-rail payloads reuse the same InsightMetricsReader / LeaderboardService calls above.
            'streak' => $this->mapStreakRail($streak),
            'xp_ranking' => $this->mapXpRankingRail($leaderboard),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(): array
    {
        return [
            'hero' => [
                'name' => '',
                'level' => 1,
                'level_badge_label' => '',
                'total_xp' => 0,
                'next_level_threshold' => null,
                'xp_to_next' => null,
                'track' => [
                    'start_level' => 9,
                    'current_level' => 1,
                    'achiever_level' => 12,
                    'fill_percent' => 0.0,
                ],
                'levels_away_from_achiever' => 0,
                'weekly_xp' => 0,
                'previous_weekly_xp' => 0,
            ],
            'statistics' => [
                'total_xp' => 0,
                'current_rank' => null,
                'rank_scope' => StudentLeaderboardService::SCOPE_SCHOOL,
                'rank_range' => StudentLeaderboardService::RANGE_ALL_TIME,
                'current_streak' => 0,
            ],
            'books' => [],
            'achievements' => [],
            'streak' => $this->mapStreakRail([]),
            'xp_ranking' => $this->mapXpRankingRail([]),
        ];
    }

    /**
     * @param  array<string, mixed>  $streak
     * @return array<string, mixed>
     */
    private function mapStreakRail(array $streak): array
    {
        $hasData = (bool) ($streak['has_learning_behaviour_data'] ?? false);
        $current = (int) ($streak['current_streak'] ?? 0);

        return [
            'available' => $hasData || $current > 0,
            'current_streak' => $current,
            'longest_streak' => (int) ($streak['longest_streak'] ?? 0),
            'today_completed' => (bool) ($streak['today_completed'] ?? false),
            'weekly_days' => is_array($streak['weekly_days'] ?? null) ? $streak['weekly_days'] : [],
        ];
    }

    /**
     * XP leaderboard preview for My Progress right rail (school / all_time).
     *
     * @param  array<string, mixed>  $leaderboard
     * @return array<string, mixed>
     */
    private function mapXpRankingRail(array $leaderboard): array
    {
        $items = is_array($leaderboard['items'] ?? null) ? $leaderboard['items'] : [];
        $preview = [];
        foreach (array_slice($items, 0, 3) as $row) {
            if (! is_array($row)) {
                continue;
            }
            $preview[] = [
                'rank' => (int) ($row['rank'] ?? 0),
                'student_id' => (int) ($row['student_id'] ?? 0),
                'name' => (string) ($row['name'] ?? ''),
                'photo_url' => $row['photo_url'] ?? null,
                'xp' => (int) ($row['xp'] ?? 0),
                'is_current' => ($row['is_current'] ?? false) === true,
            ];
        }

        return [
            'available' => $preview !== [],
            'scope' => StudentLeaderboardService::SCOPE_SCHOOL,
            'range' => StudentLeaderboardService::RANGE_ALL_TIME,
            'items' => $preview,
        ];
    }

    /**
     * @param  array<string, mixed>  $continue
     * @return array<string, mixed>
     */
    private function mapNextGoal(array $continue, ?int $rewardXp): array
    {
        if (! ($continue['available'] ?? false)) {
            return [
                'available' => false,
                'title' => null,
                'lesson_title' => null,
                'reward_xp' => null,
                'reward_xp_kind' => null,
                'cta_path' => null,
            ];
        }

        $lessonTitle = isset($continue['lesson_title']) && is_string($continue['lesson_title'])
            ? trim($continue['lesson_title'])
            : '';

        return [
            'available' => true,
            'title' => (string) ($continue['title'] ?? ''),
            'lesson_title' => $lessonTitle !== '' ? $lessonTitle : null,
            'reward_xp' => $rewardXp,
            'reward_xp_kind' => $rewardXp !== null ? 'potential' : null,
            'cta_path' => $continue['path'] ?? null,
        ];
    }

    /**
     * @return array<int, object>
     */
    private function loadEnrolledSubjects(Student $student): array
    {
        $subjectSchoolIds = subjectsSchools::query()
            ->where('school_id', $student->school_id)
            ->where('status', '1')
            ->pluck('id')
            ->all();

        if ($subjectSchoolIds === []) {
            return [];
        }

        $subjectIds = DB::table('subjects_grades')
            ->whereIn('subjects_schools_id', $subjectSchoolIds)
            ->where('grade_id', $student->grade_id)
            ->where('status', '1')
            ->pluck('subject_id')
            ->map(static fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        if ($subjectIds === []) {
            return [];
        }

        $locale = app()->getLocale() === 'ar' ? 'ar' : 'en';
        $nameCol = $locale === 'ar' ? 'name_ar' : 'name';
        $desCol = $locale === 'ar' ? 'des_ar' : 'des';

        $rows = Subject::query()
            ->whereIn('id', $subjectIds)
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy($nameCol)
            ->get(['id', 'name', 'name_ar', 'des', 'des_ar', 'photo', 'status']);

        $out = [];
        foreach ($rows as $row) {
            if (! $this->curriculumAccess->studentCanAccessSubject($student, (int) $row->id)) {
                continue;
            }
            $out[] = (object) [
                'id' => (int) $row->id,
                'title' => (string) ($row->{$nameCol} ?: $row->name ?: $row->name_ar ?: ''),
                'description' => $row->{$desCol} ?: $row->des ?: $row->des_ar ?: null,
                'photo' => $row->photo,
            ];
        }

        return $out;
    }

    /**
     * Subject progress % using the same unit-based definition as My Progress books.
     *
     * @param  int[]  $subjectIds
     * @return array<int, float> subject_id => 0–100 (0 when no countable units)
     */
    public function batchSubjectUnitProgressPercents(int $studentId, array $subjectIds): array
    {
        $unitProgress = $this->batchUnitProgress($studentId, $subjectIds);
        $out = [];
        foreach ($subjectIds as $sid) {
            $sid = (int) $sid;
            $completed = (int) ($unitProgress[$sid]['completed'] ?? 0);
            $total = (int) ($unitProgress[$sid]['total'] ?? 0);
            $out[$sid] = $total > 0
                ? (float) round(($completed / $total) * 100, 2)
                : 0.0;
        }

        return $out;
    }

    /**
     * Batch unit progress: completed = every active lesson in unit has a lesson completion.
     *
     * @param  int[]  $subjectIds
     * @return array<int, array{completed:int,total:int}>
     */
    private function batchUnitProgress(int $studentId, array $subjectIds): array
    {
        $result = [];
        foreach ($subjectIds as $sid) {
            $result[$sid] = ['completed' => 0, 'total' => 0];
        }

        if ($subjectIds === [] || ! Schema::hasTable('units') || ! Schema::hasTable('lessons')) {
            return $result;
        }

        $studentSchoolId = (int) (Student::query()->whereKey($studentId)->value('school_id') ?? 0);

        $unitsQuery = DB::table('units')
            ->whereIn('subject_id', $subjectIds)
            ->where(function ($q) {
                $q->where('status', '1')->orWhere('status', 1);
            })
            ->where(function ($q) {
                $q->where('for_teacher', '0')->orWhere('for_teacher', 0)->orWhereNull('for_teacher');
            })
            ->where(function ($q) use ($studentSchoolId) {
                $q->where('type', 'public')
                    ->orWhere(function ($inner) use ($studentSchoolId) {
                        $inner->where('type', 'private')
                            ->where('school_id', $studentSchoolId);
                    });
                if (Schema::hasTable('units_schools') && $studentSchoolId > 0) {
                    $q->orWhereExists(function ($sub) use ($studentSchoolId) {
                        $sub->select(DB::raw(1))
                            ->from('units_schools')
                            ->whereColumn('units_schools.unit_id', 'units.id')
                            ->where('units_schools.school_id', $studentSchoolId);
                    });
                }
            });

        $units = $unitsQuery->get(['id', 'subject_id']);
        if ($units->isEmpty()) {
            return $result;
        }

        $unitSubject = [];
        $visibleUnitIds = [];
        foreach ($units as $unit) {
            $uid = (int) $unit->id;
            $visibleUnitIds[] = $uid;
            $unitSubject[$uid] = (int) $unit->subject_id;
        }

        $lessons = DB::table('lessons')
            ->whereIn('unit_id', $visibleUnitIds)
            ->where(function ($q) {
                $q->where('status', '1')->orWhere('status', 1);
            })
            ->get(['id', 'unit_id']);

        $lessonsByUnit = [];
        foreach ($lessons as $lesson) {
            $lessonsByUnit[(int) $lesson->unit_id][] = (int) $lesson->id;
        }

        $completedLessonIds = [];
        if (Schema::hasTable('student_lesson_completions')) {
            $ids = StudentLessonCompletion::query()
                ->where('student_id', $studentId)
                ->whereIn('subject_id', $subjectIds)
                ->pluck('lesson_id')
                ->map(static fn ($id) => (int) $id)
                ->all();
            $completedLessonIds = array_fill_keys($ids, true);
        }

        foreach ($visibleUnitIds as $uid) {
            $sid = $unitSubject[$uid] ?? 0;
            if (! isset($result[$sid])) {
                continue;
            }
            $lessonIds = $lessonsByUnit[$uid] ?? [];
            if ($lessonIds === []) {
                continue;
            }
            $result[$sid]['total']++;
            $allDone = true;
            foreach ($lessonIds as $lid) {
                if (! isset($completedLessonIds[$lid])) {
                    $allDone = false;
                    break;
                }
            }
            if ($allDone) {
                $result[$sid]['completed']++;
            }
        }

        return $result;
    }

    /**
     * Weekly XP per subject from student_xp_events via lesson_content / quiz sources.
     *
     * @param  int[]  $subjectIds
     * @return array<int, int>
     */
    private function batchSubjectWeeklyXp(int $studentId, array $subjectIds): array
    {
        $out = [];
        foreach ($subjectIds as $sid) {
            $out[$sid] = 0;
        }

        if ($subjectIds === [] || ! Schema::hasTable('student_xp_events')) {
            return $out;
        }

        $weekStart = Carbon::now()->startOfWeek();

        $events = DB::table('student_xp_events')
            ->where('student_id', $studentId)
            ->where('earned_at', '>=', $weekStart)
            ->get(['source_type', 'source_id', 'amount']);

        if ($events->isEmpty()) {
            return $out;
        }

        $contentCompletionIds = [];
        $quizIds = [];
        foreach ($events as $event) {
            if ($event->source_type === 'lesson_content') {
                $contentCompletionIds[] = (int) $event->source_id;
            } elseif ($event->source_type === 'quiz') {
                $quizIds[] = (int) $event->source_id;
            }
        }

        $completionToSubject = [];
        if ($contentCompletionIds !== [] && Schema::hasTable('student_lesson_content_completions')) {
            $rows = StudentLessonContentCompletion::query()
                ->whereIn('id', array_unique($contentCompletionIds))
                ->get(['id', 'lesson_id']);
            $lessonIds = $rows->pluck('lesson_id')->map(static fn ($id) => (int) $id)->unique()->all();
            $lessonSubject = [];
            if ($lessonIds !== []) {
                $lessonSubject = DB::table('lessons')
                    ->whereIn('id', $lessonIds)
                    ->pluck('subject_id', 'id')
                    ->map(static fn ($id) => (int) $id)
                    ->all();
            }
            foreach ($rows as $row) {
                $completionToSubject[(int) $row->id] = (int) ($lessonSubject[(int) $row->lesson_id] ?? 0);
            }
        }

        $quizToSubject = [];
        if ($quizIds !== [] && Schema::hasTable('quizes')) {
            $quizToSubject = DB::table('quizes')
                ->whereIn('id', array_unique($quizIds))
                ->pluck('subject_id', 'id')
                ->map(static fn ($id) => (int) $id)
                ->all();
        }

        foreach ($events as $event) {
            $amount = (int) $event->amount;
            $sid = 0;
            if ($event->source_type === 'lesson_content') {
                $sid = $completionToSubject[(int) $event->source_id] ?? 0;
            } elseif ($event->source_type === 'quiz') {
                $sid = $quizToSubject[(int) $event->source_id] ?? 0;
            }
            if ($sid > 0 && isset($out[$sid])) {
                $out[$sid] += $amount;
            }
        }

        return $out;
    }

    /**
     * Local demo only: SLCC counts per subject (NOT product Activities SSOT).
     *
     * @param  int[]  $subjectIds
     * @return array<int, int>
     */
    private function batchSubjectSlccCounts(int $studentId, array $subjectIds): array
    {
        $out = [];
        foreach ($subjectIds as $sid) {
            $out[(int) $sid] = 0;
        }

        if (
            $subjectIds === []
            || ! Schema::hasTable('student_lesson_content_completions')
            || ! Schema::hasTable('lessons')
        ) {
            return $out;
        }

        $rows = DB::table('student_lesson_content_completions as slcc')
            ->join('lessons', 'lessons.id', '=', 'slcc.lesson_id')
            ->where('slcc.student_id', $studentId)
            ->whereIn('lessons.subject_id', $subjectIds)
            ->select('lessons.subject_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('lessons.subject_id')
            ->get();

        foreach ($rows as $row) {
            $sid = (int) $row->subject_id;
            if (isset($out[$sid])) {
                $out[$sid] = (int) $row->cnt;
            }
        }

        return $out;
    }

    /**
     * AVG(quiz_results.percent) per subject. Null when no results.
     *
     * @param  int[]  $subjectIds
     * @return array<int, float|null>
     */
    private function batchSubjectAccuracy(int $studentId, array $subjectIds): array
    {
        $out = [];
        foreach ($subjectIds as $sid) {
            $out[(int) $sid] = null;
        }

        if ($subjectIds === [] || ! Schema::hasTable('quiz_results') || ! Schema::hasTable('quizes')) {
            return $out;
        }

        $query = DB::table('quiz_results')
            ->join('quizes', 'quizes.id', '=', 'quiz_results.quiz_id')
            ->where('quiz_results.student_id', $studentId)
            ->whereIn('quizes.subject_id', $subjectIds)
            ->whereNotNull('quiz_results.percent');

        if (Schema::hasColumn('quiz_results', 'is_authoritative')) {
            $query->where(function ($inner) {
                $inner->where('quiz_results.is_authoritative', 1)
                    ->orWhereNull('quiz_results.is_authoritative');
            });
        }

        $rows = $query
            ->select('quizes.subject_id', DB::raw('AVG(quiz_results.percent) as avg_percent'))
            ->groupBy('quizes.subject_id')
            ->get();

        foreach ($rows as $row) {
            $sid = (int) $row->subject_id;
            // array_key_exists: isset() is false when the placeholder value is null.
            if (array_key_exists($sid, $out) && $row->avg_percent !== null) {
                $out[$sid] = round((float) $row->avg_percent, 1);
            }
        }

        return $out;
    }
}
