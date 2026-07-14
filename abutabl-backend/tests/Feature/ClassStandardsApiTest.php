<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ClassStandardsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassStandardsApiTest extends TestCase
{
    public function test_standards_service_returns_chart_shape(): void
    {
        $report = app(ClassStandardsService::class)->buildReport(21, 'letters-explorer', 'term');

        $this->assertSame('quizzes_and_assignments', $report['source']);
        $this->assertArrayHasKey('tabs', $report);
        $this->assertArrayHasKey('items', $report);
        $this->assertNotEmpty($report['items']);

        $item = $report['items'][0];
        $this->assertArrayHasKey('label', $item);
        $this->assertArrayHasKey('code', $item);
        $this->assertArrayHasKey('percent', $item);
        $this->assertArrayHasKey('status', $item);
        $this->assertArrayHasKey('color', $item);
        $this->assertArrayHasKey('definition', $item);
        $this->assertArrayHasKey('link_sources', $item);
        $this->assertArrayHasKey('audit_details', $item);
    }

    public function test_standards_endpoint_requires_auth(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => env('API_SECRET', 'OASzRok654E0AJ20KH'),
        ])->getJson('/api/dashboard/teacher/classes/21/standards?subject=letters-explorer');

        $response->assertStatus(401);
    }

    public function test_standards_endpoint_returns_payload_for_teacher(): void
    {
        $teacher = User::where('username', '12345')->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 12345 not found.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/dashboard/teacher/classes/21/standards?subject=letters-explorer&range=term');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'source',
                'range',
                'class_id',
                'tabs',
                'items' => [
                    '*' => [
                        'standard_id',
                        'code',
                        'label',
                        'percent',
                        'status',
                        'color',
                        'definition',
                        'link_sources',
                        'audit_details' => [
                            '*' => [
                                'linked_at',
                                'link_type',
                                'reason',
                                'confidence_score',
                                'action',
                            ],
                        ],
                    ],
                ],
                'audit',
            ]);
    }
}
