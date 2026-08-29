<?php

namespace App\Services\SmartInsight;

use App\Models\Lessons;
use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizResult;
use App\Models\StudentLessonCompletion;
use App\Models\StudentLessonContentCompletion;
use App\Services\PerformanceAnalytics\PerformanceHistoryService;
use App\Services\StudentMetricsService;
use App\Services\StudentProfile\StudentStandardsProvider;
use App\Services\TeacherDashboardService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

/**
 * Read-only metrics assembly for the Smart Insight Engine.
 * Progress always comes from StudentMetricsService — never recalculated here.
 */
class InsightMetricsReader
{
    /** @var StudentMetricsService */
    private $metrics;

    /** @var PerformanceHistoryService */
    private $history;

    /** @var TeacherDashboardService */
    private $dashboard;

    /** @var StudentStandardsProvider */
    private $standardsProvider;

    /** @var array<string, bool> */
    private $tableExistsCache = [];

    /** @var array<string, bool> */
    private $columnExistsCache = [];

    public function __construct(
        StudentMetricsService $metrics,
        PerformanceHistoryService $history,
        TeacherDashboardService $dashboard,
        StudentStandardsProvider $standardsProvider
    ) {
        $this->metrics = $metrics;
        $this->history = $history;
        $this->dashboard = $dashboard;
        $this->standardsProvider = $standardsProvider;
    }

    /**
     * @param  array<string, mixed>  $requestContext
     * @return array<string, mixed>
     */
    public function build(array $requestContext): array
    {
        $config = config('smart_insight', []);
        $studentId = (int) ($requestContext['student_id'] ?? 0);
        $classId = (int) ($requestContext['class_id'] ?? 0);
        $teacherId = (int) ($requestContext['teacher_id'] ?? 0);
        $schoolIds = is_array($requestContext['school_ids'] ?? null)
            ? $requestContext['school_ids']
            : [];
        $generatedAt = now()->toIso8601String();
        $now = now();

        $student = is_array($requestContext['student'] ?? null)
            ? $requestContext['student']
            : [];

        $progressPercent = 0.0;
        $hasProgressData = false;
        $sspRowCount = 0;
        $subjectIds = [];

        // Prefer subject_ids from the caller (Student Profile already resolved scope).
        if (! empty($requestContext['subject_ids']) && is_array($requestContext['subject_ids'])) {
            $subjectIds = array_values(array_unique(array_map('intval', $requestContext['subject_ids'])));
        } elseif ($teacherId > 0 && $classId > 0 && $studentId > 0) {
            $scope = $this->dashboard->resolveClassAccess($teacherId, $schoolIds, $classId);
            $subjectIds = array_map(
                'intval',
                $scope['subjects_by_class'][$classId] ?? []
            );
        }

        if ($studentId > 0 && $subjectIds !== []) {
            $map = $this->metrics->loadProgressByStudent(
                new Collection([$studentId]),
                new Collection($subjectIds)
            );
            $computed = $this->metrics->computeProgress($studentId, $subjectIds, $map);
            $progressPercent = (float) $computed['percent'];
            $hasProgressData = (bool) $computed['has_data'];
            $sspRowCount = isset($map[$studentId]) ? count($map[$studentId]) : 0;
        }

        // Fallback: if profile summary already carries performance, keep it;
        // progress still must come from Metrics when subjects resolve.
        $performancePercent = array_key_exists('performance_percent', $student)
            ? (float) $student['performance_percent']
            : 0.0;
        $scorePercent = array_key_exists('score_percent', $student)
            ? (float) $student['score_percent']
            : 0.0;
        $overdueCount = (int) ($student['overdue_count'] ?? 0);

        $snapshots = $this->loadSnapshots($studentId, $classId);
        if ($snapshots !== [] && ! array_key_exists('performance_percent', $student)) {
            $latest = $snapshots[count($snapshots) - 1];
            if ($latest['performance_percent'] !== null) {
                $performancePercent = (float) $latest['performance_percent'];
            }
        }

        $progressTrend = $this->resolveProgressTrend($snapshots, $config);
        $lessonStats = $this->loadLessonCompletionStats($studentId, $subjectIds);
        $performanceStats = $this->resolvePerformanceStats(
            $snapshots,
            $performancePercent,
            array_key_exists('performance_percent', $student),
            $config
        );
        $standardsStats = $this->resolveStandardsStats($requestContext, $config);
        $assessmentStats = $this->resolveAssessmentStats($requestContext, $config);
        $behaviourStats = $this->resolveLearningBehaviourStats($requestContext, $config, $now);

        $lastActivityAt = $requestContext['last_activity_at'] ?? null;
        if ($lastActivityAt !== null && ! $lastActivityAt instanceof Carbon) {
            try {
                $lastActivityAt = Carbon::parse($lastActivityAt);
            } catch (\Throwable $e) {
                $lastActivityAt = null;
            }
        }
        if (! ($lastActivityAt instanceof Carbon)) {
            // Reuse latest behaviour timestamp when present to avoid a second MAX pass.
            $lastActivityAt = $this->resolveLastActivityAt(
                $studentId,
                $behaviourStats['_latest_activity_at'] ?? null
            );
        }
        unset($behaviourStats['_latest_activity_at']);

        $baseContext = [
            'student_id' => $studentId,
            'class_id' => $classId,
            'teacher_id' => $teacherId,
            'subject_ids' => $subjectIds,
            'progress_percent' => $progressPercent,
            'progress' => $progressPercent,
            'has_progress_data' => $hasProgressData,
            'progress_change' => $progressTrend['progress_change'],
            'progress_trend' => $progressTrend['trend'],
            'progress_from' => $progressTrend['from'],
            'progress_to' => $progressTrend['to'],
            'progress_snapshot_count' => $progressTrend['snapshot_count'],
            'completed_lessons' => $lessonStats['completed_lessons'],
            'total_lessons' => $lessonStats['total_lessons'],
            'completion_percentage' => $lessonStats['completion_percentage'],
            'lesson_completion' => $lessonStats,
            'performance_percent' => $performancePercent,
            'performance' => $performanceStats['performance'],
            'has_performance_data' => $performanceStats['has_performance_data'],
            'performance_average' => $performanceStats['performance_average'],
            'performance_trend' => $performanceStats['performance_trend'],
            'performance_delta' => $performanceStats['performance_delta'],
            'performance_history' => $performanceStats['performance_history'],
            'performance_snapshot_count' => $performanceStats['performance_snapshot_count'],
            'performance_stddev' => $performanceStats['performance_stddev'],
            'risk_score' => $performanceStats['risk_score'],
            'performance_risk_score' => $performanceStats['risk_score'],
            'has_standards_data' => $standardsStats['has_standards_data'],
            'standards' => $standardsStats['standards'],
            'standards_average' => $standardsStats['standards_average'],
            'standards_gap' => $standardsStats['standards_gap'],
            'standards_gap_percent' => $standardsStats['standards_gap_percent'] ?? null,
            'standards_trend' => $standardsStats['standards_trend'],
            'mastered_standards' => $standardsStats['mastered_standards'],
            'weak_standards' => $standardsStats['weak_standards'],
            'mastered_standards_count' => $standardsStats['mastered_standards_count'],
            'weak_standards_count' => $standardsStats['weak_standards_count'],
            'standards_total_count' => $standardsStats['standards_total_count'],
            'standards_history' => $standardsStats['standards_history'],
            'standards_mastered_ratio' => $standardsStats['standards_mastered_ratio'],
            'standards_risk_score' => $standardsStats['standards_risk_score'],
            'has_assessment_data' => $assessmentStats['has_assessment_data'],
            'quiz_accuracy' => $assessmentStats['quiz_accuracy'],
            'average_quiz_score' => $assessmentStats['average_quiz_score'],
            'successful_attempts' => $assessmentStats['successful_attempts'],
            'failed_attempts' => $assessmentStats['failed_attempts'],
            'quiz_attempt_count' => $assessmentStats['quiz_attempt_count'],
            'quiz_result_count' => $assessmentStats['quiz_result_count'],
            'quiz_improvement' => $assessmentStats['quiz_improvement'],
            'quiz_trend' => $assessmentStats['quiz_trend'],
            'quiz_history' => $assessmentStats['quiz_history'],
            'quiz_pass_flags' => $assessmentStats['quiz_pass_flags'],
            'consecutive_failures' => $assessmentStats['consecutive_failures'],
            'consecutive_successes' => $assessmentStats['consecutive_successes'],
            'assessment_confidence' => $assessmentStats['assessment_confidence'],
            'assessment_risk' => $assessmentStats['assessment_risk'],
            'has_learning_behaviour_data' => $behaviourStats['has_learning_behaviour_data'],
            'engagement_score' => $behaviourStats['engagement_score'],
            'behaviour_score' => $behaviourStats['engagement_score'],
            'engagement_trend' => $behaviourStats['engagement_trend'],
            'study_days' => $behaviourStats['study_days'],
            'active_days' => $behaviourStats['active_days'],
            'inactive_days' => $behaviourStats['inactive_days'],
            'weekly_activity' => $behaviourStats['weekly_activity'],
            'monthly_activity' => $behaviourStats['monthly_activity'],
            'session_count' => $behaviourStats['session_count'],
            'average_session_time' => $behaviourStats['average_session_time'],
            'learning_consistency' => $behaviourStats['learning_consistency'],
            'return_after_inactivity' => $behaviourStats['return_after_inactivity'],
            'activity_distribution' => $behaviourStats['activity_distribution'],
            'behaviour_confidence' => $behaviourStats['behaviour_confidence'],
            'score_percent' => $scorePercent,
            'overdue_count' => $overdueCount,
            'snapshots' => $snapshots,
            'last_activity_at' => $lastActivityAt,
            'ssp_row_count' => $sspRowCount,
            'now' => $now,
            'generated_at' => $generatedAt,
            'config' => $config,
        ];

        $riskStats = $this->resolveEducationalRiskStats($baseContext, $config, $requestContext);
        $withRisk = array_merge($baseContext, $riskStats);
        $achievementStats = $this->resolveAchievementStats($withRisk, $config, $requestContext);

        return array_merge($withRisk, $achievementStats);
    }

    /**
     * Aggregate existing Student Profile / Standards provider payload (read-only).
     *
     * @param  array<string, mixed>  $requestContext
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    private function resolveStandardsStats(array $requestContext, array $config): array
    {
        $empty = [
            'has_standards_data' => false,
            'standards' => [],
            'standards_average' => null,
            'standards_gap' => null,
            'standards_trend' => null,
            'mastered_standards' => [],
            'weak_standards' => [],
            'mastered_standards_count' => 0,
            'weak_standards_count' => 0,
            'standards_total_count' => 0,
            'standards_history' => [],
            'standards_mastered_ratio' => null,
            'standards_risk_score' => 0.0,
        ];

        $payload = array_key_exists('standards', $requestContext)
            ? (is_array($requestContext['standards']) ? $requestContext['standards'] : null)
            : null;

        $studentId = (int) ($requestContext['student_id'] ?? 0);
        $classId = (int) ($requestContext['class_id'] ?? 0);
        $range = (string) ($requestContext['range'] ?? 'week');
        $subjectSlug = (string) ($requestContext['subject'] ?? $requestContext['subject_slug'] ?? 'letters-explorer');

        // Fallback to existing Standards provider only when profile did not pass standards.
        if ($payload === null && $studentId > 0 && $classId > 0) {
            try {
                $payload = $this->standardsProvider->build(
                    $classId,
                    $studentId,
                    $range,
                    $subjectSlug
                );
            } catch (\Throwable $e) {
                return $empty;
            }
        }

        if (! is_array($payload) || empty($payload['items']) || ! is_array($payload['items'])) {
            return $empty;
        }

        $mastery = (float) ($config['standards']['mastery_percent'] ?? 80);
        $standards = [];
        $history = [];
        $mastered = [];
        $weak = [];

        foreach ($payload['items'] as $item) {
            if (! is_array($item)) {
                continue;
            }
            $percent = (float) ($item['percentage'] ?? $item['percent'] ?? 0);
            $code = (string) ($item['code'] ?? $item['label'] ?? '');
            $row = [
                'standard_id' => (int) ($item['standard_id'] ?? 0),
                'code' => $code,
                'label' => (string) ($item['label'] ?? $code),
                'percent' => $percent,
                'status' => (string) ($item['status'] ?? ''),
                'domain' => (string) ($item['domain'] ?? ''),
            ];
            $standards[] = $row;
            $history[] = $percent;

            if ($percent >= $mastery || in_array($row['status'], ['excellent', 'good'], true)) {
                $mastered[] = $row;
            } else {
                $weak[] = $row;
            }
        }

        $total = count($standards);
        if ($total === 0) {
            return $empty;
        }

        $average = round(array_sum($history) / $total, 1);
        $masteredCount = count($mastered);
        $weakCount = count($weak);
        $masteredRatio = round($masteredCount / $total, 2);
        $gapRatio = round($weakCount / $total, 2);
        // Gap also expressed as distance from full mastery average.
        $gapPercent = round(max(0.0, 100.0 - $average), 1);

        $trend = 'stable';
        if ($masteredRatio >= 0.6 && $average >= $mastery) {
            $trend = 'improving';
        } elseif ($gapRatio >= 0.5 || $average < (float) ($config['standards']['weak_average_threshold'] ?? 50)) {
            $trend = 'declining';
        }

        $risk = 0.0;
        if ($gapRatio >= (float) ($config['standards']['gap_ratio_threshold'] ?? 0.4)) {
            $risk += 0.35;
        }
        if ($average < (float) ($config['standards']['weak_average_threshold'] ?? 50)) {
            $risk += 0.35;
        }
        if ($weakCount > $masteredCount) {
            $risk += 0.2;
        }
        $risk = round(max(0.0, min(1.0, $risk)), 2);

        return [
            'has_standards_data' => true,
            'standards' => $standards,
            'standards_average' => $average,
            'standards_gap' => $gapRatio,
            'standards_gap_percent' => $gapPercent,
            'standards_trend' => $trend,
            'mastered_standards' => $mastered,
            'weak_standards' => $weak,
            'mastered_standards_count' => $masteredCount,
            'weak_standards_count' => $weakCount,
            'standards_total_count' => $total,
            'standards_history' => $history,
            'standards_mastered_ratio' => $masteredRatio,
            'standards_risk_score' => $risk,
        ];
    }

    /**
     * Aggregate existing quiz_results / quiz_attempts (read-only). Never invents scores.
     *
     * @param  array<string, mixed>  $requestContext
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    private function resolveAssessmentStats(array $requestContext, array $config): array
    {
        $empty = [
            'has_assessment_data' => false,
            'quiz_accuracy' => null,
            'average_quiz_score' => null,
            'successful_attempts' => 0,
            'failed_attempts' => 0,
            'quiz_attempt_count' => 0,
            'quiz_result_count' => 0,
            'quiz_improvement' => null,
            'quiz_trend' => null,
            'quiz_history' => [],
            'quiz_pass_flags' => [],
            'consecutive_failures' => 0,
            'consecutive_successes' => 0,
            'assessment_confidence' => 0.0,
            'assessment_risk' => 0.0,
        ];

        $studentId = (int) ($requestContext['student_id'] ?? 0);
        $passFallback = (float) ($config['assessment']['pass_percent_fallback'] ?? 60);
        $history = [];
        $passFlags = [];

        // Prefer explicit assessment payload when profile/tests inject it.
        if (array_key_exists('assessment', $requestContext) && is_array($requestContext['assessment'])) {
            $payload = $requestContext['assessment'];
            $rawHistory = $payload['quiz_history'] ?? $payload['history'] ?? [];
            if (is_array($rawHistory)) {
                foreach ($rawHistory as $row) {
                    if (is_numeric($row)) {
                        $percent = round((float) $row, 1);
                        $history[] = $percent;
                        $passFlags[] = $percent >= $passFallback;
                    } elseif (is_array($row) && isset($row['percent'])) {
                        $percent = round((float) $row['percent'], 1);
                        $history[] = $percent;
                        if (array_key_exists('passed', $row)) {
                            $passFlags[] = (bool) $row['passed'];
                        } else {
                            $passFlags[] = $percent >= $passFallback;
                        }
                    }
                }
            }
        } elseif ($studentId > 0 && $this->tableExists('quiz_results')) {
            $rows = QuizResult::query()
                ->where('student_id', $studentId)
                ->where(function ($q) {
                    $q->where('is_authoritative', true)
                        ->orWhereNull('is_authoritative');
                })
                ->orderBy('finalized_at')
                ->orderBy('id')
                ->get(['percent', 'passed', 'finalized_at', 'quiz_id', 'attempt_id']);

            foreach ($rows as $row) {
                if ($row->percent === null) {
                    continue;
                }
                $percent = round((float) $row->percent, 1);
                $history[] = $percent;
                $passFlags[] = $row->passed !== null
                    ? (bool) $row->passed
                    : $percent >= $passFallback;
            }
        }

        $resultCount = count($history);
        $minAttempts = (int) ($config['assessment']['min_attempts'] ?? 2);

        $attemptCount = $resultCount;
        if ($studentId > 0 && $this->tableExists('quiz_attempts')) {
            $attemptCount = (int) QuizAttempt::query()
                ->where('student_id', $studentId)
                ->whereIn('status', [
                    QuizAttempt::STATUS_SUBMITTED,
                    QuizAttempt::STATUS_AUTO_GRADED,
                    QuizAttempt::STATUS_PENDING_MANUAL,
                    QuizAttempt::STATUS_FINALIZED,
                ])
                ->count();
            if ($attemptCount < $resultCount) {
                $attemptCount = $resultCount;
            }
        }

        if ($resultCount < $minAttempts) {
            // Insufficient assessment history — expose counts but mark unavailable.
            return array_merge($empty, [
                'quiz_attempt_count' => $attemptCount,
                'quiz_result_count' => $resultCount,
                'quiz_history' => $history,
                'quiz_pass_flags' => $passFlags,
            ]);
        }

        $successful = count(array_filter($passFlags));
        $failed = $resultCount - $successful;
        $average = round(array_sum($history) / $resultCount, 1);
        // Accuracy = share of successful (passed) attempts.
        $accuracy = round(($successful / $resultCount) * 100, 1);

        $improveMin = (int) ($config['assessment']['improve_min_attempts'] ?? 2);
        $improveDelta = (float) ($config['assessment']['improve_delta_percent'] ?? 10);
        $improvement = null;
        $trend = 'stable';
        if ($resultCount >= $improveMin) {
            $improvement = round($history[$resultCount - 1] - $history[0], 1);
            if ($improvement >= $improveDelta) {
                $trend = 'improving';
            } elseif ($improvement <= -1 * $improveDelta) {
                $trend = 'declining';
            }
        }

        $consecutiveFailures = 0;
        $consecutiveSuccesses = 0;
        $runFail = 0;
        $runSuccess = 0;
        foreach ($passFlags as $passed) {
            if ($passed) {
                $runSuccess++;
                $runFail = 0;
                $consecutiveSuccesses = max($consecutiveSuccesses, $runSuccess);
            } else {
                $runFail++;
                $runSuccess = 0;
                $consecutiveFailures = max($consecutiveFailures, $runFail);
            }
        }

        $confidence = 0.5;
        if ($resultCount >= 5) {
            $confidence += 0.25;
        } elseif ($resultCount >= 3) {
            $confidence += 0.15;
        } else {
            $confidence += 0.05;
        }
        $confidence = round(min(1.0, $confidence), 2);

        $risk = 0.0;
        $low = (float) ($config['assessment']['low_accuracy_threshold'] ?? 50);
        if ($accuracy < $low) {
            $risk += 0.4;
        }
        if ($consecutiveFailures >= (int) ($config['assessment']['repeated_failures_count'] ?? 3)) {
            $risk += 0.35;
        }
        if ($trend === 'declining') {
            $risk += 0.2;
        }
        $risk = round(max(0.0, min(1.0, $risk)), 2);

        return [
            'has_assessment_data' => true,
            'quiz_accuracy' => $accuracy,
            'average_quiz_score' => $average,
            'successful_attempts' => $successful,
            'failed_attempts' => $failed,
            'quiz_attempt_count' => $attemptCount,
            'quiz_result_count' => $resultCount,
            'quiz_improvement' => $improvement,
            'quiz_trend' => $trend,
            'quiz_history' => $history,
            'quiz_pass_flags' => $passFlags,
            'consecutive_failures' => $consecutiveFailures,
            'consecutive_successes' => $consecutiveSuccesses,
            'assessment_confidence' => $confidence,
            'assessment_risk' => $risk,
        ];
    }

    /**
     * Aggregate learning-behaviour signals from existing activity timestamps (read-only).
     * Never invents engagement when no activity history exists.
     *
     * @param  array<string, mixed>  $requestContext
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    private function resolveLearningBehaviourStats(array $requestContext, array $config, Carbon $now): array
    {
        $empty = [
            'has_learning_behaviour_data' => false,
            'engagement_score' => null,
            'engagement_trend' => null,
            'study_days' => null,
            'active_days' => null,
            'inactive_days' => null,
            'weekly_activity' => null,
            'monthly_activity' => null,
            'session_count' => null,
            'average_session_time' => null,
            'learning_consistency' => null,
            'return_after_inactivity' => null,
            'activity_distribution' => null,
            'behaviour_confidence' => null,
        ];

        $studentId = (int) ($requestContext['student_id'] ?? 0);
        $windowDays = (int) ($config['learning_behaviour']['window_days'] ?? 30);
        $windowStart = $now->copy()->subDays($windowDays)->startOfDay();

        $timestamps = [];
        $sessionDurations = [];

        // Allow tests / profile to inject observed activity without inventing values.
        if (array_key_exists('learning_behaviour', $requestContext) && is_array($requestContext['learning_behaviour'])) {
            $payload = $requestContext['learning_behaviour'];
            if (array_key_exists('has_learning_behaviour_data', $payload) && ! $payload['has_learning_behaviour_data']) {
                return $empty;
            }
            if (! empty($payload['activity_timestamps']) && is_array($payload['activity_timestamps'])) {
                foreach ($payload['activity_timestamps'] as $ts) {
                    try {
                        $timestamps[] = Carbon::parse($ts);
                    } catch (\Throwable $e) {
                        // skip invalid
                    }
                }
            }
            if (! empty($payload['session_durations_seconds']) && is_array($payload['session_durations_seconds'])) {
                foreach ($payload['session_durations_seconds'] as $sec) {
                    if (is_numeric($sec) && (float) $sec > 0) {
                        $sessionDurations[] = (float) $sec;
                    }
                }
            }
            // Fully precomputed payload for unit tests.
            if (isset($payload['engagement_score']) || isset($payload['active_days'])) {
                return array_merge($empty, [
                    'has_learning_behaviour_data' => true,
                    'engagement_score' => $payload['engagement_score'] ?? null,
                    'engagement_trend' => $payload['engagement_trend'] ?? null,
                    'study_days' => $payload['study_days'] ?? $payload['active_days'] ?? null,
                    'active_days' => $payload['active_days'] ?? null,
                    'inactive_days' => $payload['inactive_days'] ?? null,
                    'weekly_activity' => $payload['weekly_activity'] ?? null,
                    'monthly_activity' => $payload['monthly_activity'] ?? null,
                    'session_count' => $payload['session_count'] ?? null,
                    'average_session_time' => $payload['average_session_time'] ?? null,
                    'learning_consistency' => $payload['learning_consistency'] ?? null,
                    'return_after_inactivity' => $payload['return_after_inactivity'] ?? null,
                    'activity_distribution' => $payload['activity_distribution'] ?? null,
                    'behaviour_confidence' => $payload['behaviour_confidence'] ?? $payload['confidence'] ?? null,
                ]);
            }
        } elseif ($studentId > 0) {
            if ($this->tableExists('student_lesson_completions')) {
                $rows = StudentLessonCompletion::query()
                    ->where('student_id', $studentId)
                    ->where('completed_at', '>=', $windowStart)
                    ->pluck('completed_at');
                foreach ($rows as $at) {
                    if ($at) {
                        $timestamps[] = Carbon::parse($at);
                    }
                }
            }
            if ($this->tableExists('student_lesson_content_completions')) {
                $rows = StudentLessonContentCompletion::query()
                    ->where('student_id', $studentId)
                    ->where('completed_at', '>=', $windowStart)
                    ->pluck('completed_at');
                foreach ($rows as $at) {
                    if ($at) {
                        $timestamps[] = Carbon::parse($at);
                    }
                }
            }
            if ($this->tableExists('performance_facts')) {
                $rows = \App\Models\PerformanceFact::query()
                    ->where('student_id', $studentId)
                    ->where('captured_at', '>=', $windowStart)
                    ->pluck('captured_at');
                foreach ($rows as $at) {
                    if ($at) {
                        $timestamps[] = Carbon::parse($at);
                    }
                }
            }
            if ($this->tableExists('quiz_attempts')) {
                $attempts = QuizAttempt::query()
                    ->where('student_id', $studentId)
                    ->where(function ($q) use ($windowStart) {
                        $q->where('started_at', '>=', $windowStart)
                            ->orWhere('submitted_at', '>=', $windowStart);
                    })
                    ->get(['started_at', 'submitted_at']);
                foreach ($attempts as $attempt) {
                    if ($attempt->started_at) {
                        $timestamps[] = Carbon::parse($attempt->started_at);
                    }
                    if ($attempt->submitted_at) {
                        $timestamps[] = Carbon::parse($attempt->submitted_at);
                    }
                    if ($attempt->started_at && $attempt->submitted_at) {
                        $seconds = Carbon::parse($attempt->started_at)
                            ->diffInSeconds(Carbon::parse($attempt->submitted_at));
                        if ($seconds > 0) {
                            $sessionDurations[] = (float) $seconds;
                        }
                    }
                }
            }
        }

        if ($timestamps === []) {
            return $empty;
        }

        usort($timestamps, function (Carbon $a, Carbon $b) {
            return $a->timestamp <=> $b->timestamp;
        });

        $activeDayKeys = [];
        $weekdayCounts = [];
        $weeklyActivity = 0;
        $monthlyActivity = 0;
        $weekAgo = $now->copy()->subDays(7);
        $twoWeeksAgo = $now->copy()->subDays(14);

        foreach ($timestamps as $ts) {
            $dayKey = $ts->toDateString();
            $activeDayKeys[$dayKey] = true;
            $weekday = strtolower($ts->format('D'));
            $weekdayCounts[$weekday] = ($weekdayCounts[$weekday] ?? 0) + 1;
            $monthlyActivity++;
            if ($ts->gte($weekAgo)) {
                $weeklyActivity++;
            }
        }

        $activeDays = count($activeDayKeys);
        $inactiveDays = max(0, $windowDays - $activeDays);
        $engagementScore = round(min(100.0, ($activeDays / max(1, $windowDays)) * 100), 1);

        $prevWeekCount = 0;
        foreach ($timestamps as $ts) {
            if ($ts->gte($twoWeeksAgo) && $ts->lt($weekAgo)) {
                $prevWeekCount++;
            }
        }
        $engagementTrend = 'stable';
        if ($weeklyActivity > $prevWeekCount) {
            $engagementTrend = 'improving';
        } elseif ($weeklyActivity < $prevWeekCount) {
            $engagementTrend = 'declining';
        }

        // Consistency from gaps between unique active days (observed only).
        $sortedDays = array_keys($activeDayKeys);
        sort($sortedDays);
        $learningConsistency = null;
        if (count($sortedDays) >= 3) {
            $gaps = [];
            for ($i = 1; $i < count($sortedDays); $i++) {
                $gaps[] = Carbon::parse($sortedDays[$i - 1])->diffInDays(Carbon::parse($sortedDays[$i]));
            }
            $meanGap = array_sum($gaps) / count($gaps);
            if ($meanGap > 0) {
                $variance = 0.0;
                foreach ($gaps as $gap) {
                    $variance += ($gap - $meanGap) ** 2;
                }
                $stddev = sqrt($variance / count($gaps));
                $cv = $stddev / $meanGap;
                $learningConsistency = round(max(0.0, min(1.0, 1.0 - min(1.0, $cv))), 2);
            } else {
                $learningConsistency = 1.0;
            }
        }

        $returnGap = (int) ($config['learning_behaviour']['return_gap_days']
            ?? $config['inactive']['days']
            ?? 14);
        $returnRecent = (int) ($config['learning_behaviour']['return_recent_days'] ?? 7);
        $returnAfterInactivity = false;
        if (count($sortedDays) >= 2) {
            $lastDay = Carbon::parse($sortedDays[count($sortedDays) - 1]);
            if ($lastDay->gte($now->copy()->subDays($returnRecent)->startOfDay())) {
                for ($i = 1; $i < count($sortedDays); $i++) {
                    $gap = Carbon::parse($sortedDays[$i - 1])->diffInDays(Carbon::parse($sortedDays[$i]));
                    if ($gap >= $returnGap) {
                        $returnAfterInactivity = true;
                        break;
                    }
                }
            }
        }

        $avgSessionTime = null;
        if ($sessionDurations !== []) {
            $avgSessionTime = round(array_sum($sessionDurations) / count($sessionDurations), 1);
        }

        $confidence = 0.5;
        if ($activeDays >= 5) {
            $confidence += 0.25;
        } elseif ($activeDays >= 3) {
            $confidence += 0.15;
        } elseif ($activeDays >= 1) {
            $confidence += 0.05;
        }
        $confidence = round(min(1.0, $confidence), 2);

        $streaks = $this->computeDayStreaks($sortedDays, $now);

        return [
            'has_learning_behaviour_data' => true,
            'engagement_score' => $engagementScore,
            'engagement_trend' => $engagementTrend,
            'study_days' => $activeDays,
            'active_days' => $activeDays,
            'inactive_days' => $inactiveDays,
            'weekly_activity' => $weeklyActivity,
            'monthly_activity' => $monthlyActivity,
            'session_count' => count($timestamps),
            'average_session_time' => $avgSessionTime,
            'learning_consistency' => $learningConsistency,
            'return_after_inactivity' => $returnAfterInactivity,
            'activity_distribution' => $weekdayCounts,
            'behaviour_confidence' => $confidence,
            'current_streak' => $streaks['current'],
            'longest_streak' => $streaks['longest'],
            // Internal reuse for last-activity (stripped before context merge).
            '_latest_activity_at' => $timestamps !== []
                ? $timestamps[count($timestamps) - 1]
                : null,
        ];
    }

    /**
     * Educational risk score from existing metrics only (informational, never persisted).
     *
     * @param  array<string, mixed>  $context
     * @param  array<string, mixed>  $config
     * @param  array<string, mixed>  $requestContext
     * @return array<string, mixed>
     */
    private function resolveEducationalRiskStats(
        array $context,
        array $config,
        array $requestContext
    ): array {
        $empty = [
            'has_risk_data' => false,
            'educational_risk_score' => null,
            'risk_level' => null,
            'contributing_factors' => [],
            'detected_patterns' => [],
            'risk_confidence' => null,
            'days_since_activity' => null,
        ];

        // Allow injected risk payload for unit tests.
        if (array_key_exists('risk', $requestContext) && is_array($requestContext['risk'])) {
            $payload = $requestContext['risk'];
            if (array_key_exists('has_risk_data', $payload) && ! $payload['has_risk_data']) {
                return $empty;
            }
            if (isset($payload['educational_risk_score']) || isset($payload['risk_level'])) {
                return array_merge($empty, [
                    'has_risk_data' => true,
                    'educational_risk_score' => $payload['educational_risk_score'] ?? null,
                    'risk_level' => $payload['risk_level'] ?? null,
                    'contributing_factors' => $payload['contributing_factors'] ?? [],
                    'detected_patterns' => $payload['detected_patterns'] ?? [],
                    'risk_confidence' => $payload['risk_confidence'] ?? $payload['confidence'] ?? null,
                    'days_since_activity' => $payload['days_since_activity'] ?? null,
                    'dropout_signal' => (bool) ($payload['dropout_signal'] ?? false),
                    'intervention_signal' => (bool) ($payload['intervention_signal'] ?? false),
                ]);
            }
        }

        $factors = [];
        $patterns = [];
        $score = 0.0;
        $signals = 0;

        $now = isset($context['now']) && $context['now'] instanceof Carbon
            ? $context['now']
            : now();
        $lastActivity = $context['last_activity_at'] ?? null;
        $daysSince = null;
        if ($lastActivity instanceof Carbon) {
            $daysSince = $lastActivity->diffInDays($now);
        } elseif (is_string($lastActivity) && $lastActivity !== '') {
            try {
                $daysSince = Carbon::parse($lastActivity)->diffInDays($now);
            } catch (\Throwable $e) {
                $daysSince = null;
            }
        }

        $inactiveThreshold = (int) ($config['risk']['inactive_days_risk']
            ?? $config['inactive']['days']
            ?? 14);

        if ($daysSince === null) {
            $score += 0.2;
            $signals++;
            $factors[] = 'no_recent_activity_timestamp';
            $patterns[] = 'missing_activity';
        } elseif ($daysSince >= $inactiveThreshold) {
            $score += 0.25;
            $signals++;
            $factors[] = 'inactive_days:'.$daysSince;
            $patterns[] = 'prolonged_inactivity';
        }

        if (! empty($context['has_progress_data'])) {
            $progress = (float) ($context['progress'] ?? $context['progress_percent'] ?? 0);
            $lowProgress = (float) ($config['progress']['low_threshold'] ?? 40);
            if ($progress < $lowProgress) {
                $score += 0.15;
                $signals++;
                $factors[] = 'low_progress:'.$progress;
                $patterns[] = 'low_progress';
            }
            if (($context['progress_trend'] ?? null) === 'declining') {
                $score += 0.1;
                $signals++;
                $factors[] = 'progress_declining';
                $patterns[] = 'progress_decline';
            }
        }

        if (! empty($context['has_performance_data'])) {
            $performance = (float) ($context['performance'] ?? $context['performance_percent'] ?? 0);
            $weakPerf = (float) ($config['performance']['weak_threshold'] ?? 50);
            if ($performance < $weakPerf) {
                $score += 0.12;
                $signals++;
                $factors[] = 'weak_performance:'.$performance;
                $patterns[] = 'weak_performance';
            }
            if (($context['performance_trend'] ?? null) === 'declining') {
                $score += 0.1;
                $signals++;
                $factors[] = 'performance_declining';
                $patterns[] = 'performance_decline';
            }
        }

        $completion = (float) ($context['completion_percentage']
            ?? ($context['lesson_completion']['completion_percentage'] ?? 0));
        if (($context['total_lessons'] ?? 0) > 0 && $completion < 30) {
            $score += 0.08;
            $signals++;
            $factors[] = 'low_lesson_completion:'.$completion;
            $patterns[] = 'low_lesson_completion';
        }

        if (! empty($context['has_assessment_data'])) {
            $accuracy = $context['quiz_accuracy'] ?? null;
            $lowAcc = (float) ($config['assessment']['low_accuracy_threshold'] ?? 50);
            if ($accuracy !== null && (float) $accuracy < $lowAcc) {
                $score += 0.12;
                $signals++;
                $factors[] = 'low_quiz_accuracy:'.$accuracy;
                $patterns[] = 'low_quiz_accuracy';
            }
            if ((int) ($context['consecutive_failures'] ?? 0) >= (int) ($config['assessment']['repeated_failures_count'] ?? 3)) {
                $score += 0.1;
                $signals++;
                $factors[] = 'repeated_quiz_failures';
                $patterns[] = 'repeated_failures';
            }
        }

        if (! empty($context['has_learning_behaviour_data'])) {
            $engagement = $context['engagement_score'] ?? $context['behaviour_score'] ?? null;
            $lowEng = (float) ($config['learning_behaviour']['low_engagement_threshold'] ?? 25);
            if ($engagement !== null && (float) $engagement < $lowEng) {
                $score += 0.15;
                $signals++;
                $factors[] = 'low_engagement:'.$engagement;
                $patterns[] = 'low_engagement';
            }
            $consistency = $context['learning_consistency'] ?? null;
            $irregularMax = (float) ($config['learning_behaviour']['irregular_max_score'] ?? 0.35);
            if ($consistency !== null && (float) $consistency <= $irregularMax) {
                $score += 0.08;
                $signals++;
                $factors[] = 'irregular_learning_pattern';
                $patterns[] = 'irregular_pattern';
            }
        }

        if (! empty($context['has_standards_data'])) {
            $gap = $context['standards_gap'] ?? null;
            $gapThreshold = (float) ($config['standards']['gap_ratio_threshold'] ?? 0.4);
            if ($gap !== null && (float) $gap >= $gapThreshold) {
                $score += 0.1;
                $signals++;
                $factors[] = 'standards_gap:'.$gap;
                $patterns[] = 'standards_gap';
            }
            $masteredRatio = $context['standards_mastered_ratio'] ?? null;
            if ($masteredRatio !== null && (float) $masteredRatio < 0.3) {
                $score += 0.08;
                $signals++;
                $factors[] = 'low_standards_mastery:'.$masteredRatio;
                $patterns[] = 'low_standards_mastery';
            }
        }

        if ($signals === 0) {
            return $empty;
        }

        $score = round(max(0.0, min(1.0, $score)), 2);
        $atMin = (float) ($config['risk']['at_risk_min'] ?? 0.35);
        $highMin = (float) ($config['risk']['high_risk_min'] ?? 0.55);
        $criticalMin = (float) ($config['risk']['critical_risk_min'] ?? 0.75);

        $level = 'none';
        if ($score >= $criticalMin) {
            $level = 'critical';
        } elseif ($score >= $highMin) {
            $level = 'high';
        } elseif ($score >= $atMin) {
            $level = 'at_risk';
        }

        $dropoutFactors = 0;
        foreach (['prolonged_inactivity', 'low_engagement', 'low_progress', 'low_lesson_completion'] as $pattern) {
            if (in_array($pattern, $patterns, true)) {
                $dropoutFactors++;
            }
        }
        $dropoutMin = (int) ($config['risk']['dropout_min_factors'] ?? 3);
        $dropoutSignal = $dropoutFactors >= $dropoutMin;

        $interventionMin = (float) ($config['risk']['intervention_min'] ?? 0.7);
        $interventionSignal = $score >= $interventionMin || $level === 'critical' || $dropoutSignal;

        $confidence = round(min(1.0, 0.45 + ($signals * 0.08)), 2);

        return [
            'has_risk_data' => true,
            'educational_risk_score' => $score,
            'risk_level' => $level,
            'contributing_factors' => array_values(array_unique($factors)),
            'detected_patterns' => array_values(array_unique($patterns)),
            'risk_confidence' => $confidence,
            'days_since_activity' => $daysSince,
            'dropout_signal' => $dropoutSignal,
            'intervention_signal' => $interventionSignal,
        ];
    }

    /**
     * Educational achievement score from existing metrics only (informational, never persisted).
     *
     * @param  array<string, mixed>  $context
     * @param  array<string, mixed>  $config
     * @param  array<string, mixed>  $requestContext
     * @return array<string, mixed>
     */
    private function resolveAchievementStats(
        array $context,
        array $config,
        array $requestContext
    ): array {
        $empty = [
            'has_achievement_data' => false,
            'achievement_score' => null,
            'achievement_level' => null,
            'achievement_confidence' => null,
            'mastery_ratio' => null,
            'mastered_subjects' => 0,
            'improvement_score' => null,
            'consistency_score' => null,
            'learning_velocity' => null,
            'excellence_score' => null,
            'milestone_count' => 0,
            'achievement_positive_findings' => [],
            'achievement_contributing_factors' => [],
            'top_performer_signal' => false,
            'subject_mastery_signal' => false,
            'fast_learner_signal' => false,
            'consistent_excellence_signal' => false,
            'outstanding_improvement_signal' => false,
        ];

        if (array_key_exists('achievement', $requestContext) && is_array($requestContext['achievement'])) {
            $payload = $requestContext['achievement'];
            if (array_key_exists('has_achievement_data', $payload) && ! $payload['has_achievement_data']) {
                return $empty;
            }
            if (isset($payload['achievement_score']) || isset($payload['achievement_level'])) {
                return array_merge($empty, [
                    'has_achievement_data' => true,
                    'achievement_score' => $payload['achievement_score'] ?? null,
                    'achievement_level' => $payload['achievement_level'] ?? null,
                    'achievement_confidence' => $payload['achievement_confidence'] ?? $payload['confidence'] ?? null,
                    'mastery_ratio' => $payload['mastery_ratio'] ?? null,
                    'mastered_subjects' => (int) ($payload['mastered_subjects'] ?? 0),
                    'improvement_score' => $payload['improvement_score'] ?? null,
                    'consistency_score' => $payload['consistency_score'] ?? null,
                    'learning_velocity' => $payload['learning_velocity'] ?? null,
                    'excellence_score' => $payload['excellence_score'] ?? null,
                    'milestone_count' => (int) ($payload['milestone_count'] ?? 0),
                    'achievement_positive_findings' => $payload['positive_findings']
                        ?? $payload['achievement_positive_findings']
                        ?? [],
                    'achievement_contributing_factors' => $payload['contributing_factors']
                        ?? $payload['achievement_contributing_factors']
                        ?? [],
                    'top_performer_signal' => (bool) ($payload['top_performer_signal'] ?? false),
                    'subject_mastery_signal' => (bool) ($payload['subject_mastery_signal'] ?? false),
                    'fast_learner_signal' => (bool) ($payload['fast_learner_signal'] ?? false),
                    'consistent_excellence_signal' => (bool) ($payload['consistent_excellence_signal'] ?? false),
                    'outstanding_improvement_signal' => (bool) ($payload['outstanding_improvement_signal'] ?? false),
                ]);
            }
        }

        $factors = [];
        $findings = [];
        $score = 0.0;
        $signals = 0;
        $excellenceParts = [];
        $improvementParts = [];
        $milestoneCount = 0;

        $achCfg = $config['achievement'] ?? [];
        $highProgress = (float) ($config['progress']['high_threshold'] ?? 70);
        $excellentPerf = (float) ($config['performance']['excellent_threshold'] ?? 85);
        $highAccuracy = (float) ($config['assessment']['high_accuracy_threshold'] ?? 85);
        $excellentEng = (float) ($config['learning_behaviour']['excellent_engagement_threshold'] ?? 70);
        $consistentMin = (float) ($achCfg['consistency_min']
            ?? $config['learning_behaviour']['consistent_min_score']
            ?? 0.65);
        $fastDelta = (float) ($config['progress']['fast_delta_percent'] ?? 15);
        $improveDelta = (float) ($config['progress']['improve_delta_percent'] ?? 5);
        $rapidPerfDelta = (float) ($config['performance']['rapid_improve_delta_percent'] ?? 15);
        $masteryRatioMin = (float) ($achCfg['mastery_ratio_min'] ?? 0.7);
        $lessonCompletionMin = (float) ($achCfg['lesson_completion_min'] ?? 70);
        $milestoneMarks = $achCfg['milestone_progress_marks'] ?? [50, 75, 100];

        $masteryRatio = null;
        if (! empty($context['has_standards_data']) && isset($context['standards_mastered_ratio'])) {
            $masteryRatio = round(max(0.0, min(1.0, (float) $context['standards_mastered_ratio'])), 2);
        }

        $consistencyScore = null;
        if (isset($context['learning_consistency']) && is_numeric($context['learning_consistency'])) {
            $consistencyScore = round(max(0.0, min(1.0, (float) $context['learning_consistency'])), 2);
        }

        $learningVelocity = null;
        if (! empty($context['has_progress_data']) && isset($context['progress_change']) && is_numeric($context['progress_change'])) {
            $delta = (float) $context['progress_change'];
            if ($delta > 0 && $fastDelta > 0) {
                $learningVelocity = round(max(0.0, min(1.0, $delta / $fastDelta)), 2);
            } elseif ($delta > 0) {
                $learningVelocity = 0.5;
            } else {
                $learningVelocity = 0.0;
            }
        }

        if (! empty($context['has_progress_data'])) {
            $progress = (float) ($context['progress'] ?? $context['progress_percent'] ?? 0);
            foreach ($milestoneMarks as $mark) {
                if ($progress >= (float) $mark) {
                    $milestoneCount++;
                }
            }
            if ($progress >= $highProgress) {
                $score += 0.14;
                $signals++;
                $factors[] = 'high_progress:'.$progress;
                $findings[] = 'high_progress';
                $excellenceParts[] = min(1.0, $progress / 100.0);
            }
            if (($context['progress_trend'] ?? null) === 'improving'
                || (isset($context['progress_change']) && (float) $context['progress_change'] >= $improveDelta)
            ) {
                $score += 0.08;
                $signals++;
                $factors[] = 'progress_improving';
                $findings[] = 'progress_improvement';
                $improvementParts[] = 0.7;
            }
            if ($learningVelocity !== null && $learningVelocity >= (float) ($achCfg['fast_velocity_min'] ?? 0.7)) {
                $score += 0.1;
                $signals++;
                $factors[] = 'fast_learning_velocity:'.$learningVelocity;
                $findings[] = 'fast_learner';
                $improvementParts[] = $learningVelocity;
            }
        }

        if (! empty($context['has_performance_data'])) {
            $performance = (float) ($context['performance'] ?? $context['performance_percent'] ?? 0);
            if ($performance >= $excellentPerf) {
                $score += 0.14;
                $signals++;
                $factors[] = 'excellent_performance:'.$performance;
                $findings[] = 'excellent_performance';
                $excellenceParts[] = min(1.0, $performance / 100.0);
            } elseif ($performance >= (float) ($config['performance']['average_low_threshold'] ?? 50)) {
                $score += 0.06;
                $signals++;
                $factors[] = 'solid_performance:'.$performance;
                $findings[] = 'solid_performance';
                $excellenceParts[] = min(1.0, $performance / 100.0) * 0.7;
            }
            $perfDelta = $context['performance_delta'] ?? null;
            if (($context['performance_trend'] ?? null) === 'improving'
                || ($perfDelta !== null && (float) $perfDelta >= (float) ($config['performance']['improving_delta_percent'] ?? 5))
            ) {
                $score += 0.08;
                $signals++;
                $factors[] = 'performance_improving';
                $findings[] = 'performance_improvement';
                $improvementParts[] = 0.65;
            }
            if ($perfDelta !== null && (float) $perfDelta >= $rapidPerfDelta) {
                $score += 0.08;
                $signals++;
                $factors[] = 'rapid_performance_gain:'.$perfDelta;
                $findings[] = 'rapid_improvement';
                $improvementParts[] = 0.9;
            }
        }

        $completion = (float) ($context['completion_percentage']
            ?? ($context['lesson_completion']['completion_percentage'] ?? 0));
        if (($context['total_lessons'] ?? 0) > 0 && $completion >= $lessonCompletionMin) {
            $score += 0.08;
            $signals++;
            $factors[] = 'high_lesson_completion:'.$completion;
            $findings[] = 'lesson_completion_milestone';
            $excellenceParts[] = min(1.0, $completion / 100.0);
            if ($completion >= 100) {
                $milestoneCount++;
            }
        }

        if (! empty($context['has_assessment_data'])) {
            $accuracy = $context['quiz_accuracy'] ?? null;
            if ($accuracy !== null && (float) $accuracy >= $highAccuracy) {
                $score += 0.12;
                $signals++;
                $factors[] = 'high_quiz_accuracy:'.$accuracy;
                $findings[] = 'high_quiz_accuracy';
                $excellenceParts[] = min(1.0, (float) $accuracy / 100.0);
            }
            if (! empty($context['quiz_improvement'])
                || ($context['quiz_trend'] ?? null) === 'improving'
            ) {
                $score += 0.06;
                $signals++;
                $factors[] = 'quiz_improving';
                $findings[] = 'quiz_improvement';
                $improvementParts[] = 0.6;
            }
            $successStreak = (int) ($context['consecutive_successes'] ?? 0);
            $successNeed = (int) ($config['assessment']['repeated_success_count'] ?? 3);
            if ($successStreak >= $successNeed) {
                $score += 0.08;
                $signals++;
                $factors[] = 'repeated_quiz_success:'.$successStreak;
                $findings[] = 'repeated_success';
                $excellenceParts[] = 0.85;
                $milestoneCount++;
            }
        }

        if (! empty($context['has_learning_behaviour_data'])) {
            $engagement = $context['engagement_score'] ?? $context['behaviour_score'] ?? null;
            if ($engagement !== null && (float) $engagement >= $excellentEng) {
                $score += 0.1;
                $signals++;
                $factors[] = 'excellent_engagement:'.$engagement;
                $findings[] = 'excellent_engagement';
                $excellenceParts[] = min(1.0, (float) $engagement / 100.0);
            }
            if ($consistencyScore !== null && $consistencyScore >= $consistentMin) {
                $score += 0.08;
                $signals++;
                $factors[] = 'consistent_learning:'.$consistencyScore;
                $findings[] = 'consistent_excellence';
                $excellenceParts[] = $consistencyScore;
            }
        }

        if ($masteryRatio !== null) {
            if ($masteryRatio >= $masteryRatioMin) {
                $score += 0.12;
                $signals++;
                $factors[] = 'standards_mastery:'.$masteryRatio;
                $findings[] = 'subject_mastery';
                $excellenceParts[] = $masteryRatio;
                $milestoneCount++;
            } elseif ($masteryRatio >= (float) ($config['standards']['improve_min_mastered_ratio'] ?? 0.5)) {
                $score += 0.06;
                $signals++;
                $factors[] = 'emerging_standards_mastery:'.$masteryRatio;
                $findings[] = 'standards_progress';
            }
        }

        if ($signals === 0) {
            return $empty;
        }

        $score = round(max(0.0, min(1.0, $score)), 2);
        $excellenceScore = $excellenceParts === []
            ? 0.0
            : round(array_sum($excellenceParts) / count($excellenceParts), 2);
        $improvementScore = $improvementParts === []
            ? 0.0
            : round(array_sum($improvementParts) / count($improvementParts), 2);

        $highMin = (float) ($achCfg['high_min'] ?? 0.45);
        $excellenceMin = (float) ($achCfg['excellence_min'] ?? 0.7);
        $level = 'none';
        if ($score >= $excellenceMin) {
            $level = 'excellence';
        } elseif ($score >= $highMin) {
            $level = 'high';
        }

        $perfVal = (float) ($context['performance'] ?? $context['performance_percent'] ?? 0);
        $accVal = $context['quiz_accuracy'] ?? null;
        $topPerformer = ! empty($context['has_performance_data'])
            && $perfVal >= $excellentPerf
            && (
                empty($context['has_assessment_data'])
                || ($accVal !== null && (float) $accVal >= $highAccuracy)
            );

        $subjectMastery = $masteryRatio !== null && $masteryRatio >= $masteryRatioMin;
        $fastLearner = $learningVelocity !== null
            && $learningVelocity >= (float) ($achCfg['fast_velocity_min'] ?? 0.7);
        $consistentExcellence = $consistencyScore !== null
            && $consistencyScore >= $consistentMin
            && $excellenceScore >= (float) ($achCfg['excellence_composite_min'] ?? 0.65);
        $outstandingImprovement = $improvementScore >= (float) ($achCfg['improvement_min'] ?? 0.55)
            && count($improvementParts) >= 1;

        $masteredSubjects = 0;
        if ($subjectMastery || ($level === 'excellence' && ! empty($context['has_progress_data']))) {
            $subjectIds = $context['subject_ids'] ?? [];
            $masteredSubjects = is_array($subjectIds) && $subjectIds !== []
                ? count($subjectIds)
                : 1;
        } elseif (! empty($context['has_progress_data'])) {
            $progress = (float) ($context['progress'] ?? $context['progress_percent'] ?? 0);
            if ($progress >= $highProgress) {
                $masteredSubjects = 1;
            }
        }

        $confidence = round(min(1.0, 0.45 + ($signals * 0.07)), 2);

        return [
            'has_achievement_data' => true,
            'achievement_score' => $score,
            'achievement_level' => $level,
            'achievement_confidence' => $confidence,
            'mastery_ratio' => $masteryRatio,
            'mastered_subjects' => $masteredSubjects,
            'improvement_score' => $improvementScore,
            'consistency_score' => $consistencyScore,
            'learning_velocity' => $learningVelocity,
            'excellence_score' => $excellenceScore,
            'milestone_count' => $milestoneCount,
            'achievement_positive_findings' => array_values(array_unique($findings)),
            'achievement_contributing_factors' => array_values(array_unique($factors)),
            'top_performer_signal' => $topPerformer,
            'subject_mastery_signal' => $subjectMastery,
            'fast_learner_signal' => $fastLearner,
            'consistent_excellence_signal' => $consistentExcellence,
            'outstanding_improvement_signal' => $outstandingImprovement,
        ];
    }

    /**
     * Aggregate existing snapshot performance values (read-only; no new formulas).
     *
     * @param  array<int, array<string, mixed>>  $snapshots
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    private function resolvePerformanceStats(
        array $snapshots,
        float $performancePercent,
        bool $hasStudentPerformance,
        array $config
    ): array {
        $history = [];
        foreach ($snapshots as $row) {
            if (! array_key_exists('performance_percent', $row) || $row['performance_percent'] === null) {
                continue;
            }
            $history[] = round((float) $row['performance_percent'], 1);
        }

        $count = count($history);
        $hasData = $hasStudentPerformance || $count > 0;
        $performance = $hasData ? round($performancePercent, 1) : 0.0;
        if (! $hasStudentPerformance && $count > 0) {
            $performance = $history[$count - 1];
        }

        $average = $count > 0
            ? round(array_sum($history) / $count, 1)
            : ($hasData ? $performance : null);

        $delta = null;
        $trend = null;
        $min = (int) ($config['performance']['improve_min_snapshots'] ?? 2);
        if ($count >= $min) {
            $delta = round($history[$count - 1] - $history[0], 1);
            $improve = (float) ($config['performance']['improving_delta_percent'] ?? 5);
            $decline = (float) ($config['performance']['declining_delta_percent'] ?? 5);
            if ($delta >= $improve) {
                $trend = 'improving';
            } elseif ($delta <= -1 * $decline) {
                $trend = 'declining';
            } else {
                $trend = 'stable';
            }
        }

        $stddev = null;
        if ($count >= 2) {
            $mean = array_sum($history) / $count;
            $variance = 0.0;
            foreach ($history as $value) {
                $variance += ($value - $mean) ** 2;
            }
            $stddev = round(sqrt($variance / $count), 1);
        }

        // Read-only risk score for supporting_metrics (0..1), not persisted.
        $risk = 0.0;
        $weak = (float) ($config['performance']['weak_threshold'] ?? 50);
        if ($hasData && $performance < $weak) {
            $risk += 0.35;
        }
        if ($trend === 'declining') {
            $risk += 0.3;
        }
        $inconsistent = (float) ($config['performance']['inconsistent_stddev_threshold'] ?? 12);
        if ($stddev !== null && $stddev >= $inconsistent) {
            $risk += 0.25;
        }
        $risk = round(max(0.0, min(1.0, $risk)), 2);

        return [
            'performance' => $performance,
            'has_performance_data' => $hasData,
            'performance_average' => $average,
            'performance_trend' => $trend,
            'performance_delta' => $delta,
            'performance_history' => $history,
            'performance_snapshot_count' => $count,
            'performance_stddev' => $stddev,
            'risk_score' => $risk,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $snapshots
     * @param  array<string, mixed>  $config
     * @return array{progress_change: float|null, trend: string|null, from: float|null, to: float|null, snapshot_count: int}
     */
    private function resolveProgressTrend(array $snapshots, array $config): array
    {
        $min = (int) ($config['progress']['trend_min_snapshots'] ?? 2);
        $points = [];

        foreach ($snapshots as $row) {
            if (! array_key_exists('progress_average', $row) || $row['progress_average'] === null) {
                continue;
            }
            if (array_key_exists('has_progress_data', $row) && ! $row['has_progress_data']) {
                continue;
            }
            $points[] = (float) $row['progress_average'];
        }

        $count = count($points);
        if ($count < $min) {
            return [
                'progress_change' => null,
                'trend' => null,
                'from' => null,
                'to' => null,
                'snapshot_count' => $count,
            ];
        }

        $from = $points[0];
        $to = $points[$count - 1];
        $change = round($to - $from, 1);

        $improve = (float) ($config['progress']['improve_delta_percent'] ?? 5);
        $regress = (float) ($config['progress']['regress_delta_percent'] ?? 5);

        $trend = 'stable';
        if ($change >= $improve) {
            $trend = 'improving';
        } elseif ($change <= -1 * $regress) {
            $trend = 'declining';
        }

        return [
            'progress_change' => $change,
            'trend' => $trend,
            'from' => $from,
            'to' => $to,
            'snapshot_count' => $count,
        ];
    }

    /**
     * @param  int[]  $subjectIds
     * @return array{
     *   completed_lessons: int,
     *   total_lessons: int,
     *   completion_percentage: float
     * }
     */
    private function loadLessonCompletionStats(int $studentId, array $subjectIds): array
    {
        $empty = [
            'completed_lessons' => 0,
            'total_lessons' => 0,
            'completion_percentage' => 0.0,
        ];

        if ($studentId <= 0 || $subjectIds === []) {
            return $empty;
        }

        $total = 0;
        if ($this->tableExists('lessons')) {
            $total = (int) Lessons::query()
                ->whereIn('subject_id', $subjectIds)
                ->when(
                    $this->columnExists('lessons', 'status'),
                    function ($q) {
                        $q->where(function ($inner) {
                            $inner->where('status', 1)->orWhere('status', '1');
                        });
                    }
                )
                ->count();
        }

        $completed = 0;
        if ($this->tableExists('student_lesson_completions')) {
            $completed = (int) StudentLessonCompletion::query()
                ->where('student_id', $studentId)
                ->whereIn('subject_id', $subjectIds)
                ->distinct()
                ->count('lesson_id');
        }

        $percent = $total > 0
            ? round(($completed / $total) * 100, 1)
            : 0.0;

        return [
            'completed_lessons' => $completed,
            'total_lessons' => $total,
            'completion_percentage' => $percent,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function loadSnapshots(int $studentId, int $classId): array
    {
        if ($studentId <= 0 || ! $this->tableExists('performance_facts')) {
            return [];
        }

        $from = Carbon::now()->subDays(90)->startOfDay();
        $to = Carbon::now()->endOfDay();
        $facts = $this->history->factsForStudent(
            $studentId,
            $from,
            $to,
            $classId > 0 ? $classId : null,
            true
        );

        $rows = [];
        foreach ($facts as $fact) {
            $rows[] = [
                'metric_date' => optional($fact->metric_date)->toDateString(),
                'performance_percent' => $fact->performance_percent,
                'progress_average' => $fact->progress_average,
                'has_progress_data' => (bool) $fact->has_progress_data,
                'captured_at' => optional($fact->captured_at)->toIso8601String(),
            ];
        }

        return $rows;
    }

    /**
     * @param  Carbon|null  $knownLatest  When behaviour already observed recent activity, reuse it.
     */
    private function resolveLastActivityAt(int $studentId, $knownLatest = null): ?Carbon
    {
        if ($knownLatest instanceof Carbon) {
            return $knownLatest;
        }

        if ($studentId <= 0) {
            return null;
        }

        $candidates = [];

        if ($this->tableExists('student_lesson_completions')) {
            $at = StudentLessonCompletion::query()
                ->where('student_id', $studentId)
                ->max('completed_at');
            if ($at) {
                $candidates[] = Carbon::parse($at);
            }
        }

        if ($this->tableExists('student_lesson_content_completions')) {
            $at = StudentLessonContentCompletion::query()
                ->where('student_id', $studentId)
                ->max('completed_at');
            if ($at) {
                $candidates[] = Carbon::parse($at);
            }
        }

        if ($this->tableExists('performance_facts')) {
            $at = \App\Models\PerformanceFact::query()
                ->where('student_id', $studentId)
                ->max('captured_at');
            if ($at) {
                $candidates[] = Carbon::parse($at);
            }
        }

        if ($candidates === []) {
            return null;
        }

        usort($candidates, function (Carbon $a, Carbon $b) {
            return $a->gt($b) ? -1 : 1;
        });

        return $candidates[0];
    }

    /**
     * Request-scoped Schema::hasTable memo (avoids repeated information_schema hits).
     */
    private function tableExists(string $table): bool
    {
        if (! isset($this->tableExistsCache[$table])) {
            $this->tableExistsCache[$table] = Schema::hasTable($table);
        }

        return $this->tableExistsCache[$table];
    }

    /**
     * @param  string  $table
     * @param  string  $column
     */
    private function columnExists(string $table, string $column): bool
    {
        $key = $table.'.'.$column;
        if (! isset($this->columnExistsCache[$key])) {
            $this->columnExistsCache[$key] = Schema::hasColumn($table, $column);
        }

        return $this->columnExistsCache[$key];
    }

    /**
     * Read-only learning behaviour for student dashboard (no teacher scope).
     *
     * @return array<string, mixed>
     */
    public function learningBehaviourForStudent(int $studentId, ?Carbon $now = null): array
    {
        if ($studentId <= 0) {
            return [
                'has_learning_behaviour_data' => false,
                'current_streak' => 0,
                'longest_streak' => 0,
            ];
        }

        $now = $now ?? now();
        $stats = $this->resolveLearningBehaviourStats(
            ['student_id' => $studentId],
            config('smart_insight', []),
            $now
        );
        unset($stats['_latest_activity_at']);

        if (! ($stats['has_learning_behaviour_data'] ?? false)) {
            $stats['current_streak'] = 0;
            $stats['longest_streak'] = 0;
        }

        return $stats;
    }

    /**
     * @param  string[]  $sortedDayStrings  Y-m-d ascending
     * @return array{current: int, longest: int}
     */
    private function computeDayStreaks(array $sortedDayStrings, Carbon $now): array
    {
        if ($sortedDayStrings === []) {
            return ['current' => 0, 'longest' => 0];
        }

        $longest = 1;
        $run = 1;

        for ($i = 1, $count = count($sortedDayStrings); $i < $count; $i++) {
            $prev = Carbon::parse($sortedDayStrings[$i - 1])->startOfDay();
            $curr = Carbon::parse($sortedDayStrings[$i])->startOfDay();

            if ($prev->diffInDays($curr) === 1) {
                $run++;
                $longest = max($longest, $run);
            } else {
                $run = 1;
            }
        }

        $daySet = array_flip($sortedDayStrings);
        $current = 0;
        $cursor = $now->copy()->startOfDay();

        while (isset($daySet[$cursor->toDateString()])) {
            $current++;
            $cursor->subDay();
        }

        return [
            'current' => $current,
            'longest' => $longest,
        ];
    }
}
