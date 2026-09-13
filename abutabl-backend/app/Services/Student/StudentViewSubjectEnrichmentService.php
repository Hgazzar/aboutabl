<?php

namespace App\Services\Student;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Additive enrichment for GET /api/student/viewSubject/{id} (+ subjectGames).
 *
 * Reuses existing completion / XP SSOTs. Does not invent sequential locks,
 * worksheet completion, or quiz potential XP.
 */
class StudentViewSubjectEnrichmentService
{
    /** @var StudentXpService */
    private $xp;

    public function __construct(StudentXpService $xp)
    {
        $this->xp = $xp;
    }

    /**
     * Mutates the viewSubject syllabus payload in place (additive keys only).
     *
     * @param  array<int, array<string, mixed>>  $units
     * @param  array<int, array<string, mixed>>|\Illuminate\Support\Collection  $quizesSubject
     * @param  array<int, array<string, mixed>>|\Illuminate\Support\Collection  $worksheetsSubject
     * @return array{
     *   units: array<int, array<string, mixed>>,
     *   quizesSubject: mixed,
     *   worksheetsSubject: mixed
     * }
     */
    public function enrichViewSubjectPayload(
        int $studentId,
        int $subjectId,
        array $units,
        $quizesSubject,
        $worksheetsSubject
    ): array {
        unset($subjectId); // reserved for future subject-scoped batching; units carry IDs

        $unitIds = [];
        $contentIds = [];
        $quizIds = [];

        foreach ($units as $unit) {
            $uid = (int) ($unit['id'] ?? 0);
            if ($uid > 0) {
                $unitIds[] = $uid;
            }
            foreach ($unit['lessons'] ?? [] as $lesson) {
                foreach ($lesson['contents'] ?? [] as $content) {
                    $cid = (int) ($content['id'] ?? 0);
                    if ($cid > 0) {
                        $contentIds[] = $cid;
                    }
                }
                foreach ($lesson['quizesLesson'] ?? [] as $quiz) {
                    $qid = (int) (is_array($quiz) ? ($quiz['id'] ?? 0) : ($quiz->id ?? 0));
                    if ($qid > 0) {
                        $quizIds[] = $qid;
                    }
                }
            }
            foreach ($unit['quizesUnit'] ?? [] as $quiz) {
                $qid = (int) (is_array($quiz) ? ($quiz['id'] ?? 0) : ($quiz->id ?? 0));
                if ($qid > 0) {
                    $quizIds[] = $qid;
                }
            }
        }

        foreach ($quizesSubject as $quiz) {
            $qid = (int) (is_array($quiz) ? ($quiz['id'] ?? 0) : ($quiz->id ?? 0));
            if ($qid > 0) {
                $quizIds[] = $qid;
            }
        }

        $unitIds = array_values(array_unique($unitIds));
        $contentIds = array_values(array_unique($contentIds));
        $quizIds = array_values(array_unique($quizIds));

        $unitProgress = $this->unitProgressMapForUnitIds($studentId, $unitIds);
        $completedContents = $this->completedContentIdSet($studentId, $contentIds);
        $completedQuizzes = $this->completedQuizIdSet($studentId, $quizIds);
        $lessonContentXp = $this->xp->pointsForEventType('lesson_content');

        foreach ($units as $i => $unit) {
            $uid = (int) ($unit['id'] ?? 0);
            $progress = $unitProgress[$uid] ?? [
                'progress_percent' => null,
                'completed' => false,
            ];
            $units[$i]['progress_percent'] = $progress['progress_percent'];
            $units[$i]['completed'] = (bool) $progress['completed'];

            $lessons = $unit['lessons'] ?? [];
            foreach ($lessons as $li => $lesson) {
                $contents = $lesson['contents'] ?? [];
                foreach ($contents as $ci => $content) {
                    $cid = (int) ($content['id'] ?? 0);
                    $contents[$ci]['completed'] = $cid > 0 && isset($completedContents[$cid]);
                    $contents[$ci]['reward_xp'] = $lessonContentXp;
                    $contents[$ci]['reward_xp_kind'] = $lessonContentXp !== null ? 'potential' : null;
                }
                $lessons[$li]['contents'] = $contents;

                $lessonQuizzes = $this->normalizeQuizRows($lesson['quizesLesson'] ?? []);
                foreach ($lessonQuizzes as $qi => $quiz) {
                    $qid = (int) ($quiz['id'] ?? 0);
                    $lessonQuizzes[$qi]['completed'] = $qid > 0 && isset($completedQuizzes[$qid]);
                    $lessonQuizzes[$qi]['reward_xp'] = null;
                    $lessonQuizzes[$qi]['reward_xp_kind'] = null;
                }
                $lessons[$li]['quizesLesson'] = $lessonQuizzes;
            }
            $units[$i]['lessons'] = $lessons;

            $unitQuizzes = $this->normalizeQuizRows($unit['quizesUnit'] ?? []);
            foreach ($unitQuizzes as $qi => $quiz) {
                $qid = (int) ($quiz['id'] ?? 0);
                $unitQuizzes[$qi]['completed'] = $qid > 0 && isset($completedQuizzes[$qid]);
                $unitQuizzes[$qi]['reward_xp'] = null;
                $unitQuizzes[$qi]['reward_xp_kind'] = null;
            }
            $units[$i]['quizesUnit'] = $unitQuizzes;
        }

        $subjectQuizzes = $this->normalizeQuizRows($quizesSubject);
        foreach ($subjectQuizzes as $qi => $quiz) {
            $qid = (int) ($quiz['id'] ?? 0);
            $subjectQuizzes[$qi]['completed'] = $qid > 0 && isset($completedQuizzes[$qid]);
            $subjectQuizzes[$qi]['reward_xp'] = null;
            $subjectQuizzes[$qi]['reward_xp_kind'] = null;
        }

        // Worksheets: no authoritative student completion SSOT — preserve rows as plain arrays.
        $worksheets = [];
        foreach ($worksheetsSubject as $sheet) {
            if (is_array($sheet)) {
                $worksheets[] = $sheet;
            } elseif (is_object($sheet)) {
                $worksheets[] = [
                    'id' => (int) ($sheet->id ?? 0),
                    'title' => (string) ($sheet->title ?? ''),
                    'file_url' => (string) ($sheet->file_url ?? ''),
                ];
            }
        }

        return [
            'units' => $units,
            'quizesSubject' => $subjectQuizzes,
            'worksheetsSubject' => $worksheets,
        ];
    }

    /**
     * Additive enrichment for subjectGames rows (completed from games_students.status=1).
     *
     * @param  iterable<int, object|array<string, mixed>>  $games
     * @return array<int, array<string, mixed>>
     */
    public function enrichSubjectGames(iterable $games): array
    {
        $out = [];
        foreach ($games as $game) {
            if (is_array($game)) {
                $id = (int) ($game['id'] ?? 0);
                $name = (string) ($game['name'] ?? '');
                $background = $game['background'] ?? null;
                $progress = (int) ($game['progress'] ?? 0);
            } else {
                $id = (int) ($game->id ?? 0);
                $name = (string) ($game->name ?? '');
                $background = $game->background ?? null;
                $progress = (int) ($game->progress ?? 0);
            }

            $out[] = [
                'id' => $id,
                'name' => $name,
                'background' => $background,
                'progress' => $progress,
                'completed' => $progress >= 100,
                'reward_xp' => null,
                'reward_xp_kind' => null,
            ];
        }

        return $out;
    }

    /**
     * Per-unit progress from the same lesson-completion SSOT as My Progress batchUnitProgress:
     * a lesson counts when student_lesson_completions has a row; unit completed when all
     * active lessons in the unit are completed.
     *
     * @param  int[]  $unitIds
     * @return array<int, array{progress_percent: float|null, completed: bool}>
     */
    public function unitProgressMapForUnitIds(int $studentId, array $unitIds): array
    {
        $out = [];
        foreach ($unitIds as $uid) {
            $out[(int) $uid] = [
                'progress_percent' => null,
                'completed' => false,
            ];
        }

        $unitIds = array_values(array_filter(array_map('intval', $unitIds), static fn ($id) => $id > 0));
        if ($studentId <= 0 || $unitIds === [] || ! Schema::hasTable('lessons')) {
            return $out;
        }

        $lessons = DB::table('lessons')
            ->whereIn('unit_id', $unitIds)
            ->where(function ($q) {
                $q->where('status', '1')->orWhere('status', 1);
            })
            ->get(['id', 'unit_id']);

        $lessonsByUnit = [];
        $allLessonIds = [];
        foreach ($lessons as $lesson) {
            $uid = (int) $lesson->unit_id;
            $lid = (int) $lesson->id;
            $lessonsByUnit[$uid][] = $lid;
            $allLessonIds[] = $lid;
        }

        $completedLessonIds = [];
        if ($allLessonIds !== [] && Schema::hasTable('student_lesson_completions')) {
            $ids = DB::table('student_lesson_completions')
                ->where('student_id', $studentId)
                ->whereIn('lesson_id', $allLessonIds)
                ->pluck('lesson_id')
                ->map(static fn ($id) => (int) $id)
                ->all();
            $completedLessonIds = array_fill_keys($ids, true);
        }

        foreach ($unitIds as $uid) {
            $lessonIds = $lessonsByUnit[$uid] ?? [];
            $total = count($lessonIds);
            if ($total === 0) {
                $out[$uid] = [
                    'progress_percent' => null,
                    'completed' => false,
                ];
                continue;
            }

            $done = 0;
            foreach ($lessonIds as $lid) {
                if (isset($completedLessonIds[$lid])) {
                    $done++;
                }
            }

            $out[$uid] = [
                'progress_percent' => (float) round(($done / $total) * 100, 2),
                'completed' => $done === $total,
            ];
        }

        return $out;
    }

    /**
     * @param  int[]  $contentIds
     * @return array<int, true>
     */
    private function completedContentIdSet(int $studentId, array $contentIds): array
    {
        if ($studentId <= 0 || $contentIds === [] || ! Schema::hasTable('student_lesson_content_completions')) {
            return [];
        }

        $ids = DB::table('student_lesson_content_completions')
            ->where('student_id', $studentId)
            ->whereIn('lesson_content_id', $contentIds)
            ->pluck('lesson_content_id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        return array_fill_keys($ids, true);
    }

    /**
     * Quiz completed = authoritative quiz_results row exists (same SSOT family as achievements/XP).
     *
     * @param  int[]  $quizIds
     * @return array<int, true>
     */
    private function completedQuizIdSet(int $studentId, array $quizIds): array
    {
        if ($studentId <= 0 || $quizIds === [] || ! Schema::hasTable('quiz_results')) {
            return [];
        }

        $query = DB::table('quiz_results')
            ->where('student_id', $studentId)
            ->whereIn('quiz_id', $quizIds);

        if (Schema::hasColumn('quiz_results', 'is_authoritative')) {
            $query->where(function ($q) {
                $q->where('is_authoritative', 1)
                    ->orWhereNull('is_authoritative');
            });
        }

        if (
            Schema::hasTable('quiz_attempts')
            && Schema::hasColumn('quiz_results', 'attempt_id')
        ) {
            $query->whereExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('quiz_attempts')
                    ->whereColumn('quiz_attempts.id', 'quiz_results.attempt_id')
                    ->where(function ($q) {
                        $q->whereNull('quiz_attempts.voided_at')
                            ->where('quiz_attempts.status', '!=', 'voided');
                    });
            });
        }

        $ids = $query->distinct()->pluck('quiz_id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        return array_fill_keys($ids, true);
    }
    /**
     * @param  mixed  $rows
     * @return array<int, array<string, mixed>>
     */
    private function normalizeQuizRows($rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            if (is_array($row)) {
                $out[] = [
                    'id' => (int) ($row['id'] ?? 0),
                    'title' => (string) ($row['title'] ?? ''),
                    'title_en' => $row['title_en'] ?? null,
                    'title_ar' => $row['title_ar'] ?? null,
                    'path' => $row['path'] ?? null,
                ];
                continue;
            }
            if (is_object($row)) {
                $out[] = [
                    'id' => (int) ($row->id ?? 0),
                    'title' => (string) ($row->title ?? ''),
                    'title_en' => $row->title_en ?? null,
                    'title_ar' => $row->title_ar ?? null,
                    'path' => $row->path ?? null,
                ];
            }
        }

        return $out;
    }
}
