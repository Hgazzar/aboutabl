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
        $this->assertSame(2, $payload['quests']['limit']);
        $this->assertLessThanOrEqual(2, count($payload['quests']['items']));

        $this->assertArrayHasKey('recommended_activities', $payload);
        $this->assertArrayHasKey('items', $payload['recommended_activities']);
        $this->assertIsArray($payload['recommended_activities']['items']);

        $this->assertArrayHasKey('recent_activities', $payload);
        $this->assertArrayHasKey('items', $payload['recent_activities']);
        $this->assertArrayHasKey('has_more', $payload['recent_activities']);
    }

    public function test_rankings_items_include_weekly_xp_without_changing_rank_order(): void
    {
        /** @var StudentDashboardService $service */
        $service = $this->app->make(StudentDashboardService::class);

        $student = \App\Models\Student::query()->first();
        if (! $student) {
            $this->markTestSkipped('No student seed data.');
        }

        $payload = $service->build($student->id, 'week');
        $rankings = $payload['rankings'] ?? [];

        if (($rankings['available'] ?? false) !== true || empty($rankings['items'])) {
            $this->markTestSkipped('No ranking data for seeded student.');
        }

        $previousRank = 0;
        foreach ($rankings['items'] as $item) {
            $this->assertArrayHasKey('weekly_xp', $item);
            $this->assertIsInt($item['weekly_xp']);
            $this->assertGreaterThanOrEqual(0, $item['weekly_xp']);
            $this->assertArrayHasKey('rank', $item);
            $this->assertArrayHasKey('score_percent', $item);
            $this->assertGreaterThan($previousRank, (int) $item['rank']);
            $previousRank = (int) $item['rank'];
        }

        $this->assertLessThanOrEqual(3, count($rankings['items']));
    }
}
