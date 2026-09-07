<?php

namespace Tests\Unit\Assignment;

use App\Models\AssignActivitySubmission;
use App\Services\Assignment\AssignActivitySubmissionService;
use Illuminate\Support\Collection;
use Tests\TestCase;

class AssignActivitySubmissionLifecyclePhase1Test extends TestCase
{
    public function test_terminal_statuses_are_graded_and_completed_only(): void
    {
        /** @var AssignActivitySubmissionService $svc */
        $svc = app(AssignActivitySubmissionService::class);

        $this->assertTrue($svc->isTerminalSubmissionStatus(AssignActivitySubmission::STATUS_GRADED));
        $this->assertTrue($svc->isTerminalSubmissionStatus(AssignActivitySubmission::STATUS_COMPLETED));
        $this->assertFalse($svc->isTerminalSubmissionStatus(AssignActivitySubmission::STATUS_SUBMITTED));
        $this->assertFalse($svc->isTerminalSubmissionStatus(AssignActivitySubmission::STATUS_PENDING));
        $this->assertFalse($svc->isTerminalSubmissionStatus(AssignActivitySubmission::STATUS_IN_PROGRESS));
    }

    public function test_lifecycle_mode_from_activity_submissions_only(): void
    {
        /** @var AssignActivitySubmissionService $svc */
        $svc = app(AssignActivitySubmissionService::class);

        $this->assertSame('homework_hero', $svc->deriveLifecycleMode(collect()));

        $awaiting = new AssignActivitySubmission();
        $awaiting->status = AssignActivitySubmission::STATUS_SUBMITTED;
        $this->assertSame('waiting_on_teacher', $svc->deriveLifecycleMode(collect([$awaiting])));

        $graded = new AssignActivitySubmission();
        $graded->status = AssignActivitySubmission::STATUS_GRADED;
        $this->assertSame('assignment_graded', $svc->deriveLifecycleMode(collect([$graded, $awaiting])));

        // Auto-complete alone is NOT Waiting and NOT Graded (Completed tab ≠ Graded).
        $completed = new AssignActivitySubmission();
        $completed->status = AssignActivitySubmission::STATUS_COMPLETED;
        $this->assertSame('homework_hero', $svc->deriveLifecycleMode(collect([$completed])));

        $pending = new AssignActivitySubmission();
        $pending->status = AssignActivitySubmission::STATUS_PENDING;
        $this->assertSame('homework_hero', $svc->deriveLifecycleMode(collect([$pending, $completed])));
    }

    public function test_submit_source_contains_submission_locked_guard(): void
    {
        $source = file_get_contents(
            app_path('Services/Assignment/AssignActivitySubmissionService.php')
        );

        $this->assertNotFalse($source);
        $this->assertStringContainsString('submission_locked', $source);
        $this->assertStringContainsString('isTerminalSubmissionStatus', $source);
        $this->assertStringContainsString('studentDetailPayload', $source);
        $this->assertStringContainsString('MultiActivityMetrics::forStudent', $source);
    }

    public function test_student_learning_activity_routes_are_registered(): void
    {
        $routes = collect(\Illuminate\Support\Facades\Route::getRoutes())->map(static function ($route) {
            return $route->uri().'|'.implode(',', $route->methods());
        })->implode("\n");

        $this->assertStringContainsString('api/student/assigns/{assignId}/learning_activities', $routes);
        $this->assertStringContainsString('api/student/assigns/{assignId}/submit', $routes);
        $this->assertStringContainsString('api/student/assign-activities/{assignActivityId}/submit', $routes);
        $this->assertStringContainsString('api/student/assign-activities/{assignActivityId}', $routes);
    }
}
