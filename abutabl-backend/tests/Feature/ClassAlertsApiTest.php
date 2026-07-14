<?php

namespace Tests\Feature;

use App\Models\ClassAlertDismissal;
use App\Models\User;
use App\Services\ClassAlertsService;
use Tests\TestCase;

class ClassAlertsApiTest extends TestCase
{
    public function test_class_alerts_service_returns_payload_shape(): void
    {
        $report = app(ClassAlertsService::class)->buildAlerts(179, [], 21);

        $this->assertSame('dynamic_class_alerts', $report['source']);
        $this->assertSame(21, $report['class_id']);
        $this->assertArrayHasKey('meta', $report);
        $this->assertArrayHasKey('total', $report['meta']);
        $this->assertArrayHasKey('items', $report);
    }

    public function test_class_alerts_endpoint_requires_auth(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => env('API_SECRET', 'OASzRok654E0AJ20KH'),
        ])->getJson('/api/dashboard/teacher/classes/21/alerts');

        $response->assertStatus(401);
    }

    public function test_class_alerts_endpoint_returns_payload_for_teacher(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/dashboard/teacher/classes/21/alerts');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'source',
                'class_id',
                'meta' => [
                    'total',
                    'dismissed_total',
                ],
                'items',
            ]);
    }

    public function test_dismiss_undo_and_reset_flow(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $token = auth('admin-api')->login($teacher);
        $headers = [
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ];

        $alertKey = 'performance_drop:week:test-key';

        ClassAlertDismissal::query()
            ->where('teacher_id', 179)
            ->where('class_id', 21)
            ->where('alert_key', $alertKey)
            ->delete();

        $dismiss = $this->withHeaders($headers)->postJson(
            '/api/dashboard/teacher/classes/21/alerts/dismiss',
            ['alert_key' => $alertKey]
        );

        $dismiss->assertStatus(200);
        $this->assertDatabaseHas('class_alert_dismissals', [
            'teacher_id' => 179,
            'class_id'   => 21,
            'alert_key'  => $alertKey,
        ]);

        $undo = $this->withHeaders($headers)->deleteJson(
            '/api/dashboard/teacher/classes/21/alerts/'.rawurlencode($alertKey)
        );

        $undo->assertStatus(200);
        $this->assertDatabaseMissing('class_alert_dismissals', [
            'teacher_id' => 179,
            'class_id'   => 21,
            'alert_key'  => $alertKey,
        ]);

        $this->withHeaders($headers)->postJson(
            '/api/dashboard/teacher/classes/21/alerts/dismiss',
            ['alert_key' => $alertKey]
        )->assertStatus(200);

        $reset = $this->withHeaders($headers)->postJson(
            '/api/dashboard/teacher/classes/21/alerts/reset-dismissals'
        );

        $reset->assertStatus(200);
        $this->assertDatabaseMissing('class_alert_dismissals', [
            'teacher_id' => 179,
            'class_id'   => 21,
            'alert_key'  => $alertKey,
        ]);
    }
}
