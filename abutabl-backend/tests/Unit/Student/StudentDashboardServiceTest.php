<?php

namespace Tests\Unit\Student;

use App\Services\Student\StudentDashboardService;
use Tests\TestCase;

class StudentDashboardServiceTest extends TestCase
{
    public function test_build_assignments_tabs_structure(): void
    {
        /** @var StudentDashboardService $service */
        $service = $this->app->make(StudentDashboardService::class);

        $method = new \ReflectionMethod(StudentDashboardService::class, 'buildAssignments');
        $method->setAccessible(true);

        $result = $method->invoke($service, -999999);

        $this->assertSame(0, $result['new_count']);
        $this->assertArrayHasKey('todo', $result['tabs']);
        $this->assertArrayHasKey('past_due', $result['tabs']);
        $this->assertArrayHasKey('completed', $result['tabs']);
    }

    public function test_build_includes_quests_payload_shape(): void
    {
        /** @var StudentDashboardService $service */
        $service = $this->app->make(StudentDashboardService::class);

        $student = \App\Models\Student::query()->first();
        if (! $student) {
            $this->markTestSkipped('No student seed data.');
        }

        $payload = $service->build($student->id, 'week');

        $this->assertArrayHasKey('quests', $payload);
        $this->assertArrayHasKey('available', $payload['quests']);
        $this->assertArrayHasKey('items', $payload['quests']);
        $this->assertArrayHasKey('limit', $payload['quests']);
        $this->assertIsArray($payload['quests']['items']);
        $this->assertSame(1, $payload['quests']['limit']);

        $this->assertArrayHasKey('recommended_activities', $payload);
        $this->assertArrayHasKey('items', $payload['recommended_activities']);
        $this->assertIsArray($payload['recommended_activities']['items']);

        $this->assertArrayHasKey('recent_activities', $payload);
        $this->assertArrayHasKey('items', $payload['recent_activities']);
        $this->assertArrayHasKey('has_more', $payload['recent_activities']);
    }
}
