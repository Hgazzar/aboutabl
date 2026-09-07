<?php

namespace App\Support\Assignment;

use App\Models\AssignActivity;
use App\Models\AssignActivitySubmission;
use Illuminate\Support\Collection;

/**
 * Multi-Activity assignment metrics SSOT:
 * assign_activities + assign_activity_submissions.
 *
 * Does not use assigns.type_id or opened_at as the completion source.
 */
final class MultiActivityMetrics
{
    /**
     * Submission statuses that count as activity completed for metrics.
     *
     * @var array<int, string>
     */
    public const COMPLETED_STATUSES = [
        AssignActivitySubmission::STATUS_COMPLETED,
        AssignActivitySubmission::STATUS_GRADED,
        AssignActivitySubmission::STATUS_SUBMITTED,
    ];

    /**
     * @param  Collection<int, AssignActivity>  $activities
     * @param  Collection<int, AssignActivitySubmission>  $submissions  for one student
     * @return array{
     *     tasks_total: int,
     *     tasks_completed: int,
     *     completion_percent: float|null,
     *     score_percent: float|null,
     *     accuracy_percent: float|null,
     *     fully_complete: bool,
     *     last_submitted_at: string|null
     * }
     */
    public static function forStudent(Collection $activities, Collection $submissions): array
    {
        $tasksTotal = $activities->count();
        if ($tasksTotal === 0) {
            return [
                'tasks_total' => 0,
                'tasks_completed' => 0,
                'completion_percent' => null,
                'score_percent' => null,
                'accuracy_percent' => null,
                'fully_complete' => false,
                'last_submitted_at' => null,
            ];
        }

        $byActivityId = $submissions->keyBy(static function ($row) {
            return (int) $row->assign_activity_id;
        });

        $completed = 0;
        $scoreValues = [];
        $accuracyValues = [];
        $lastSubmitted = null;

        foreach ($activities as $activity) {
            $activityId = (int) $activity->id;
            $submission = $byActivityId->get($activityId);
            if ($submission === null) {
                continue;
            }

            if (self::isCompleted($submission)) {
                $completed++;
            }

            $score = self::scorePercentForActivity(
                (string) $activity->activity_type,
                $submission
            );
            if ($score !== null) {
                $scoreValues[] = $score;
                if (self::countsTowardAccuracy((string) $activity->activity_type)) {
                    $accuracyValues[] = $score;
                }
            }

            $submittedAt = $submission->submitted_at ?? $submission->graded_at;
            if ($submittedAt !== null) {
                $ts = $submittedAt instanceof \DateTimeInterface
                    ? $submittedAt->getTimestamp()
                    : strtotime((string) $submittedAt);
                if ($ts && ($lastSubmitted === null || $ts > $lastSubmitted)) {
                    $lastSubmitted = $ts;
                }
            }
        }

        $completionPercent = round(($completed / $tasksTotal) * 100, 2);
        $avgScore = $scoreValues === []
            ? null
            : round(array_sum($scoreValues) / count($scoreValues), 2);
        $avgAccuracy = $accuracyValues === []
            ? null
            : round(array_sum($accuracyValues) / count($accuracyValues), 2);

        return [
            'tasks_total' => $tasksTotal,
            'tasks_completed' => $completed,
            'completion_percent' => $completionPercent,
            'score_percent' => $avgScore,
            'accuracy_percent' => $avgAccuracy,
            'fully_complete' => $completed >= $tasksTotal,
            'last_submitted_at' => $lastSubmitted
                ? date('c', $lastSubmitted)
                : null,
        ];
    }

    public static function isCompleted(AssignActivitySubmission $submission): bool
    {
        return in_array(
            (string) $submission->status,
            self::COMPLETED_STATUSES,
            true
        );
    }

    /**
     * eBook completeness; game/quiz/worksheet percent/score when present.
     */
    public static function scorePercentForActivity(
        string $activityType,
        AssignActivitySubmission $submission
    ): ?float {
        if ($activityType === LearningActivityMap::TYPE_EBOOK) {
            if ($submission->completeness !== null) {
                return round((float) $submission->completeness, 2);
            }
            if ($submission->percent !== null) {
                return round((float) $submission->percent, 2);
            }

            return null;
        }

        if ($submission->percent !== null) {
            return round((float) $submission->percent, 2);
        }

        if (
            $submission->score !== null
            && $submission->max_score !== null
            && (float) $submission->max_score > 0
        ) {
            return round(
                ((float) $submission->score / (float) $submission->max_score) * 100,
                2
            );
        }

        return null;
    }

    public static function countsTowardAccuracy(string $activityType): bool
    {
        return in_array(
            $activityType,
            [
                LearningActivityMap::TYPE_GAME,
                LearningActivityMap::TYPE_QUIZ,
                LearningActivityMap::TYPE_WORKSHEET,
            ],
            true
        );
    }
}
