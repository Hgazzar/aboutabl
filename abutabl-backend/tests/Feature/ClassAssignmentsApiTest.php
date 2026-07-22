<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

/**
 * F-041E.2 — GET /api/dashboard/teacher/classes/{classId}/assignments
 */
class ClassAssignmentsApiTest extends TestCase
{
    public function test_assignments_endpoint_requires_auth(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => env('API_SECRET', 'OASzRok654E0AJ20KH'),
        ])->getJson('/api/dashboard/teacher/classes/21/assignments');

        $response->assertStatus(401);
    }

    public function test_assignments_endpoint_returns_paginated_cards_for_teacher(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/dashboard/teacher/classes/21/assignments?range=all&per_page=5&page=1');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('source', 'assigns')
            ->assertJsonPath('class_id', 21)
            ->assertJsonStructure([
                'status',
                'class_id',
                'source',
                'filters' => [
                    'search',
                    'status',
                    'subject',
                    'teacher',
                    'range',
                    'sort',
                ],
                'data',
                'current_page',
                'last_page',
                'per_page',
                'total',
            ]);

        $data = $response->json('data');
        $this->assertIsArray($data);

        if ($data !== []) {
            $card = $data[0];
            foreach ([
                'id',
                'title',
                'subtitle',
                'assignment_type',
                'status',
                'due_at',
                'created_at',
                'created_by',
                'subject',
                'module',
                'target_students',
                'completed_students',
                'pending_students',
                'overdue_students',
                'completion_percentage',
                'has_missing_students',
                'has_overdue_students',
                'standards_count',
            ] as $field) {
                $this->assertArrayHasKey($field, $card);
            }
            $this->assertContains($card['status'], ['active', 'done', 'overdue']);
        }
    }

    public function test_assignments_filter_validation(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/dashboard/teacher/classes/21/assignments?status=invalid&sort=nope');

        $response->assertStatus(400)
            ->assertJsonPath('status', false);
    }

    public function test_activities_tasks_endpoint_still_unchanged(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/dashboard/teacher/classes/21/activities-tasks?filter=all&range=term');

        $response->assertStatus(200)
            ->assertJsonPath('source', 'assigns_students')
            ->assertJsonStructure([
                'status',
                'source',
                'tab_counts' => ['all', 'pending', 'late', 'completed'],
                'items',
            ]);
    }
}
