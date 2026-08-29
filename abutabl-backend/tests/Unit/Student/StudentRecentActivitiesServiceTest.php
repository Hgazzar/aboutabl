<?php

namespace Tests\Unit\Student;

use App\Services\Student\StudentRecentActivitiesService;
use Tests\TestCase;

class StudentRecentActivitiesServiceTest extends TestCase
{
    public function test_build_dashboard_payload_returns_items_wrapper(): void
    {
        /** @var StudentRecentActivitiesService $service */
        $service = $this->app->make(StudentRecentActivitiesService::class);

        $payload = $service->buildDashboardPayload(-999999, 2);

        $this->assertArrayHasKey('items', $payload);
        $this->assertArrayHasKey('has_more', $payload);
        $this->assertIsArray($payload['items']);
        $this->assertIsBool($payload['has_more']);
    }
}
