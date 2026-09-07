<?php

namespace Tests\Unit\Assignment;

use App\Models\AssignActivity;
use App\Models\AssignActivitySubmission;
use App\Support\Assignment\LearningActivityMap;
use App\Support\Assignment\MultiActivityMetrics;
use Tests\TestCase;

class MultiActivityMetricsTest extends TestCase
{
    public function test_for_student_counts_completed_activities_and_averages_scores(): void
    {
        $activities = collect([
            $this->fakeActivity(1, LearningActivityMap::TYPE_EBOOK),
            $this->fakeActivity(2, LearningActivityMap::TYPE_GAME),
            $this->fakeActivity(3, LearningActivityMap::TYPE_WORKSHEET),
            $this->fakeActivity(4, LearningActivityMap::TYPE_QUIZ),
        ]);

        $submissions = collect([
            $this->fakeSubmission(1, AssignActivitySubmission::STATUS_COMPLETED, [
                'completeness' => 100,
            ]),
            $this->fakeSubmission(2, AssignActivitySubmission::STATUS_COMPLETED, [
                'percent' => 80,
            ]),
            $this->fakeSubmission(3, AssignActivitySubmission::STATUS_SUBMITTED, []),
            $this->fakeSubmission(4, AssignActivitySubmission::STATUS_COMPLETED, [
                'percent' => 90,
            ]),
        ]);

        $metrics = MultiActivityMetrics::forStudent($activities, $submissions);

        $this->assertSame(4, $metrics['tasks_total']);
        $this->assertSame(4, $metrics['tasks_completed']);
        $this->assertSame(100.0, $metrics['completion_percent']);
        $this->assertTrue($metrics['fully_complete']);
        // ebook 100 + game 80 + quiz 90 = 270 / 3 (worksheet has no score yet)
        $this->assertSame(90.0, $metrics['score_percent']);
        // accuracy excludes ebook: game 80 + quiz 90 = 85
        $this->assertSame(85.0, $metrics['accuracy_percent']);
    }

    public function test_for_student_partial_completion_does_not_use_opened_at(): void
    {
        $activities = collect([
            $this->fakeActivity(1, LearningActivityMap::TYPE_EBOOK),
            $this->fakeActivity(2, LearningActivityMap::TYPE_QUIZ),
        ]);

        $submissions = collect([
            $this->fakeSubmission(1, AssignActivitySubmission::STATUS_COMPLETED, [
                'completeness' => 100,
            ]),
        ]);

        $metrics = MultiActivityMetrics::forStudent($activities, $submissions);

        $this->assertSame(2, $metrics['tasks_total']);
        $this->assertSame(1, $metrics['tasks_completed']);
        $this->assertSame(50.0, $metrics['completion_percent']);
        $this->assertFalse($metrics['fully_complete']);
        $this->assertSame(100.0, $metrics['score_percent']);
    }

    public function test_in_progress_quiz_is_not_completed(): void
    {
        $activities = collect([
            $this->fakeActivity(1, LearningActivityMap::TYPE_QUIZ),
        ]);
        $submissions = collect([
            $this->fakeSubmission(1, AssignActivitySubmission::STATUS_IN_PROGRESS, []),
        ]);

        $metrics = MultiActivityMetrics::forStudent($activities, $submissions);

        $this->assertSame(0, $metrics['tasks_completed']);
        $this->assertFalse($metrics['fully_complete']);
        $this->assertNull($metrics['score_percent']);
    }

    private function fakeActivity(int $id, string $type): AssignActivity
    {
        $activity = new AssignActivity();
        $activity->id = $id;
        $activity->activity_type = $type;

        return $activity;
    }

    /**
     * @param  array<string, mixed>  $attrs
     */
    private function fakeSubmission(int $activityId, string $status, array $attrs): AssignActivitySubmission
    {
        $submission = new AssignActivitySubmission();
        $submission->assign_activity_id = $activityId;
        $submission->status = $status;
        $submission->completeness = $attrs['completeness'] ?? null;
        $submission->percent = $attrs['percent'] ?? null;
        $submission->score = $attrs['score'] ?? null;
        $submission->max_score = $attrs['max_score'] ?? null;
        $submission->submitted_at = $attrs['submitted_at'] ?? now();

        return $submission;
    }
}
