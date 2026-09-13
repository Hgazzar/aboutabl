<?php

namespace App\Services\Student;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\StudentLessonCompletion;
use App\Models\StudentLessonContentCompletion;
use App\Models\StudentXpBalance;
use App\Models\StudentXpEvent;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Student Achievements V1 — read-only engine.
 *
 * Catalog: config/student_achievements.php
 * State: computed per request from existing tables. No persistence. No ledger writes.
 */
class StudentAchievementService
{
    /** @var StudentXpService */
    private $xp;

    public function __construct(StudentXpService $xp)
    {
        $this->xp = $xp;
    }

    /**
     * Full catalog with this student's progress / earned / earned_at.
     *
     * @return array<int, array{
     *     key: string,
     *     title: string,
     *     description: string,
     *     icon: string,
     *     progress: int,
     *     earned: bool,
     *     earned_at: string|null
     * }>
     */
    public function buildForStudent(int $studentId): array
    {
        if ($studentId <= 0) {
            return [];
        }

        return $this->mapCatalog($this->gatherMetrics($studentId));
    }

    /**
     * Map catalog definitions against precomputed metrics (also used by unit tests).
     *
     * @param  array<string, mixed>  $metrics
     * @return array<int, array<string, mixed>>
     */
    public function mapCatalog(array $metrics): array
    {
        $catalog = config('student_achievements.catalog', []);
        if (! is_array($catalog)) {
            return [];
        }

        $items = [];
        foreach ($catalog as $definition) {
            if (! is_array($definition) || empty($definition['key'])) {
                continue;
            }
            $items[] = $this->evaluateDefinition($definition, $metrics);
        }

        return $items;
    }

    /**
     * @param  array<string, mixed>  $definition
     * @param  array<string, mixed>  $metrics
     * @return array<string, mixed>
     */
    private function evaluateDefinition(array $definition, array $metrics): array
    {
        $ruleType = (string) ($definition['rule_type'] ?? '');
        $threshold = $this->resolveThreshold($definition);
        $current = $this->currentValueForRule($ruleType, $metrics, $threshold);
        $progress = $this->computeProgress($ruleType, $current, $threshold);
        $earned = $this->isEarned($ruleType, $current, $threshold);
        $earnedAt = $earned
            ? $this->resolveEarnedAt($ruleType, $threshold, $metrics)
            : null;

        return [
            'key'         => (string) $definition['key'],
            'title'       => (string) ($definition['title'] ?? ''),
            'description' => (string) ($definition['description'] ?? ''),
            'icon'        => (string) ($definition['icon'] ?? ''),
            'progress'    => $progress,
            'earned'      => $earned,
            'earned_at'   => $earnedAt,
        ];
    }

    /**
     * @param  array<string, mixed>  $definition
     */
    private function resolveThreshold(array $definition): int
    {
        if (isset($definition['threshold_from']) && is_string($definition['threshold_from'])) {
            $fromConfig = config($definition['threshold_from']);
            if (is_numeric($fromConfig)) {
                return max(1, (int) $fromConfig);
            }
        }

        if (isset($definition['threshold']) && is_numeric($definition['threshold'])) {
            return max(1, (int) $definition['threshold']);
        }

        return 1;
    }

    /**
     * @param  array<string, mixed>  $metrics
     */
    private function currentValueForRule(string $ruleType, array $metrics, int $threshold): float
    {
        switch ($ruleType) {
            case 'lessons_completed':
                return (float) ($metrics['lessons_completed'] ?? 0);
            case 'content_completed':
                return (float) ($metrics['content_completed'] ?? 0);
            case 'quizzes_completed':
                return (float) ($metrics['quizzes_completed'] ?? 0);
            case 'quizzes_passed':
                return (float) ($metrics['quizzes_passed'] ?? 0);
            case 'quiz_score':
                return (float) ($metrics['best_quiz_score'] ?? 0);
            case 'total_xp':
                return (float) ($metrics['total_xp'] ?? 0);
            case 'level':
                return (float) ($metrics['level'] ?? 1);
            default:
                return 0.0;
        }
    }

    private function computeProgress(string $ruleType, float $current, int $threshold): int
    {
        if ($ruleType === 'quiz_score') {
            return $current >= $threshold ? 100 : 0;
        }

        if ($threshold <= 0) {
            return 0;
        }

        return (int) min(100, max(0, (int) floor(($current / $threshold) * 100)));
    }

    private function isEarned(string $ruleType, float $current, int $threshold): bool
    {
        if ($ruleType === 'quiz_score') {
            return $current >= $threshold;
        }

        return $current >= $threshold;
    }

    /**
     * @param  array<string, mixed>  $metrics
     */
    private function resolveEarnedAt(string $ruleType, int $threshold, array $metrics): ?string
    {
        switch ($ruleType) {
            case 'lessons_completed':
                return $this->nthIsoTimestamp($metrics['lesson_completed_ats'] ?? [], $threshold);
            case 'content_completed':
                return $this->nthIsoTimestamp($metrics['content_completed_ats'] ?? [], $threshold);
            case 'quizzes_completed':
                return $this->nthIsoTimestamp($metrics['quiz_completed_ats'] ?? [], $threshold);
            case 'quizzes_passed':
                return $this->nthIsoTimestamp($metrics['quiz_passed_ats'] ?? [], $threshold);
            case 'quiz_score':
                return $this->firstScoreAtOrAbove(
                    $metrics['authoritative_quiz_scores'] ?? [],
                    $threshold
                );
            case 'total_xp':
                return $this->firstCumulativeXpAt($metrics['xp_events'] ?? [], $threshold);
            case 'level':
                $minXp = $this->xp->levelFloorXp($threshold);
                // Level 1 at 0 XP has no event-backed unlock date.
                if ($minXp <= 0) {
                    return null;
                }

                return $this->firstCumulativeXpAt($metrics['xp_events'] ?? [], $minXp);
            default:
                return null;
        }
    }

    /**
     * @param  list<string|null>  $orderedIso
     */
    private function nthIsoTimestamp(array $orderedIso, int $n): ?string
    {
        if ($n < 1 || count($orderedIso) < $n) {
            return null;
        }

        $value = $orderedIso[$n - 1] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * @param  list<array{percent: float, finalized_at: string|null}>  $scores
     */
    private function firstScoreAtOrAbove(array $scores, int $threshold): ?string
    {
        foreach ($scores as $row) {
            if ((float) ($row['percent'] ?? 0) >= $threshold) {
                $at = $row['finalized_at'] ?? null;

                return is_string($at) && $at !== '' ? $at : null;
            }
        }

        return null;
    }

    /**
     * @param  list<array{amount: int, earned_at: string|null}>  $events
     */
    private function firstCumulativeXpAt(array $events, int $threshold): ?string
    {
        $sum = 0;
        foreach ($events as $event) {
            $sum += max(0, (int) ($event['amount'] ?? 0));
            if ($sum >= $threshold) {
                $at = $event['earned_at'] ?? null;

                return is_string($at) && $at !== '' ? $at : null;
            }
        }

        return null;
    }

    /**
     * Gather reusable source metrics once per student (no N+1 per achievement).
     *
     * @return array<string, mixed>
     */
    public function gatherMetrics(int $studentId): array
    {
        $lessonAts = $this->orderedCompletionTimestamps(
            'student_lesson_completions',
            StudentLessonCompletion::class,
            $studentId
        );
        $contentAts = $this->orderedCompletionTimestamps(
            'student_lesson_content_completions',
            StudentLessonContentCompletion::class,
            $studentId
        );

        $quizBundle = $this->gatherQuizMetrics($studentId);
        $xpBundle = $this->gatherXpMetrics($studentId);

        return array_merge(
            [
                'lessons_completed'     => count($lessonAts),
                'lesson_completed_ats'  => $lessonAts,
                'content_completed'     => count($contentAts),
                'content_completed_ats' => $contentAts,
            ],
            $quizBundle,
            $xpBundle
        );
    }

    /**
     * @param  class-string  $modelClass
     * @return list<string>
     */
    private function orderedCompletionTimestamps(string $table, string $modelClass, int $studentId): array
    {
        if (! Schema::hasTable($table)) {
            return [];
        }

        return $modelClass::query()
            ->where('student_id', $studentId)
            ->orderBy('completed_at')
            ->orderBy('id')
            ->pluck('completed_at')
            ->map(function ($at) {
                return $this->toIso($at);
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function gatherQuizMetrics(int $studentId): array
    {
        $empty = [
            'quizzes_completed'           => 0,
            'quiz_completed_ats'          => [],
            'quizzes_passed'              => 0,
            'quiz_passed_ats'             => [],
            'best_quiz_score'             => 0.0,
            'authoritative_quiz_scores'   => [],
        ];

        if (! Schema::hasTable('quiz_results') || ! Schema::hasTable('quiz_attempts')) {
            return $empty;
        }

        $rows = DB::table('quiz_results as qr')
            ->join('quiz_attempts as qa', 'qa.id', '=', 'qr.attempt_id')
            ->where('qr.student_id', $studentId)
            ->where('qr.is_authoritative', 1)
            ->whereNull('qa.voided_at')
            ->where('qa.status', '!=', QuizAttempt::STATUS_VOIDED)
            ->orderBy('qr.finalized_at')
            ->orderBy('qr.id')
            ->get([
                'qr.quiz_id',
                'qr.percent',
                'qr.passed',
                'qr.finalized_at',
            ]);

        $completedFirstAt = [];
        $passedFirstAt = [];
        $scores = [];
        $best = 0.0;

        foreach ($rows as $row) {
            $quizId = (int) $row->quiz_id;
            $percent = (float) ($row->percent ?? 0);
            $finalizedAt = $this->toIso($row->finalized_at);
            $passed = (bool) $row->passed;

            $best = max($best, $percent);
            $scores[] = [
                'percent'      => $percent,
                'finalized_at' => $finalizedAt,
            ];

            if (! isset($completedFirstAt[$quizId]) && $finalizedAt !== null) {
                $completedFirstAt[$quizId] = $finalizedAt;
            }

            if ($passed && ! isset($passedFirstAt[$quizId]) && $finalizedAt !== null) {
                $passedFirstAt[$quizId] = $finalizedAt;
            }
        }

        $completedAts = array_values($completedFirstAt);
        sort($completedAts);
        $passedAts = array_values($passedFirstAt);
        sort($passedAts);

        return [
            'quizzes_completed'         => count($completedFirstAt),
            'quiz_completed_ats'        => $completedAts,
            'quizzes_passed'            => count($passedFirstAt),
            'quiz_passed_ats'           => $passedAts,
            'best_quiz_score'           => $best,
            'authoritative_quiz_scores' => $scores,
        ];
    }

    /**
     * Read-only XP / level — never calls syncAndGet / refreshBalance.
     *
     * @return array<string, mixed>
     */
    private function gatherXpMetrics(int $studentId): array
    {
        $events = [];
        $eventsSum = 0;

        if (Schema::hasTable('student_xp_events')) {
            $eventRows = StudentXpEvent::query()
                ->where('student_id', $studentId)
                ->orderBy('earned_at')
                ->orderBy('id')
                ->get(['amount', 'earned_at']);

            foreach ($eventRows as $row) {
                $amount = max(0, (int) $row->amount);
                $eventsSum += $amount;
                $events[] = [
                    'amount'    => $amount,
                    'earned_at' => $this->toIso($row->earned_at),
                ];
            }
        }

        $totalXp = $eventsSum;
        $level = $this->xp->resolveLevel($totalXp);

        if (Schema::hasTable('student_xp_balances')) {
            $balance = StudentXpBalance::query()->where('student_id', $studentId)->first();
            if ($balance !== null) {
                // Prefer authoritative balance for current totals/level; events still drive earned_at.
                $totalXp = (int) $balance->total_xp;
                $level = (int) $balance->level;
            }
        }

        return [
            'total_xp'  => $totalXp,
            'level'     => $level,
            'xp_events' => $events,
        ];
    }

    /**
     * @param  mixed  $value
     */
    private function toIso($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->toIso8601String();
        } catch (\Throwable $e) {
            return null;
        }
    }
}
