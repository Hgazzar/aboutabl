<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ClassStudentsOverviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassStudentsOverviewApiTest extends TestCase
{
    public function test_students_overview_service_returns_row_shape(): void
    {
        $report = app(ClassStudentsOverviewService::class)->buildOverview(179, [], 21, 'term', 'rank', 'asc');

        $this->assertSame('assigns_students_and_subject_progress', $report['source']);
        $this->assertArrayHasKey('meta', $report);
        $this->assertArrayHasKey('items', $report);
        $this->assertArrayHasKey('class_label', $report);

        if ($report['items'] === []) {
            $this->assertTrue(true);

            return;
        }

        $item = $report['items'][0];
        $this->assertArrayHasKey('student_id', $item);
        $this->assertArrayHasKey('name', $item);
        $this->assertArrayHasKey('performance', $item);
        $this->assertArrayHasKey('score', $item);
        $this->assertArrayHasKey('status', $item);
        $this->assertArrayHasKey('rank', $item);
        $this->assertArrayHasKey('percent', $item['performance']);
        $this->assertArrayHasKey('label', $item['performance']);
        $this->assertArrayHasKey('trend', $item['performance']);
        $this->assertArrayHasKey('has_data', $item['score']);
    }

    public function test_students_overview_endpoint_requires_auth(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => env('API_SECRET', 'OASzRok654E0AJ20KH'),
        ])->getJson('/api/dashboard/teacher/classes/21/students-overview');

        $response->assertStatus(401);
    }

    public function test_students_overview_endpoint_returns_payload_for_teacher(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/dashboard/teacher/classes/21/students-overview?range=week&sort=rank&order=asc');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'source',
                'range',
                'class_id',
                'class_label',
                'meta' => [
                    'total_students',
                    'sort',
                    'order',
                ],
                'items',
            ]);
    }

    public function test_students_overview_sort_validation(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/dashboard/teacher/classes/21/students-overview?sort=invalid');

        $response->assertStatus(400);
    }
}
