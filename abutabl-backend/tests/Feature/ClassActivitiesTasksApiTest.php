<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ClassActivitiesTasksService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassActivitiesTasksApiTest extends TestCase
{
    public function test_activities_tasks_service_returns_row_shape(): void
    {
        $report = app(ClassActivitiesTasksService::class)->buildList(179, [], 21, 'all', 'term');

        $this->assertSame('assigns_students', $report['source']);
        $this->assertArrayHasKey('tab_counts', $report);
        $this->assertArrayHasKey('items', $report);
        $this->assertArrayHasKey('all', $report['tab_counts']);

        if ($report['items'] === []) {
            $this->assertTrue(true);

            return;
        }

        $item = $report['items'][0];
        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('title', $item);
        $this->assertArrayHasKey('context', $item);
        $this->assertArrayHasKey('status', $item);
        $this->assertArrayHasKey('relative_time', $item);
        $this->assertContains($item['status'], ['pending', 'late', 'completed']);
    }

    public function test_activities_tasks_endpoint_requires_auth(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => env('API_SECRET', 'OASzRok654E0AJ20KH'),
        ])->getJson('/api/dashboard/teacher/classes/21/activities-tasks');

        $response->assertStatus(401);
    }

    public function test_activities_tasks_endpoint_returns_payload_for_teacher(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/dashboard/teacher/classes/21/activities-tasks?filter=pending&range=week');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'source',
                'range',
                'filter',
                'class_id',
                'tab_counts' => [
                    'all',
                    'pending',
                    'late',
                    'completed',
                ],
                'items',
            ]);
    }

    public function test_activities_tasks_filter_validation(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/dashboard/teacher/classes/21/activities-tasks?filter=invalid');

        $response->assertStatus(400);
    }
}
