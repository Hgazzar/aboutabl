<?php

namespace Tests\Unit\Student;

use App\Models\Student;
use App\Models\StudentQuest;
use App\Services\Student\StudentQuestService;
use Tests\TestCase;

class StudentQuestServiceTest extends TestCase
{
    public function test_build_dashboard_payload_empty_without_subjects(): void
    {
        /** @var StudentQuestService $service */
        $service = $this->app->make(StudentQuestService::class);

        $result = $service->buildDashboardPayload(-999999, null, []);

        $this->assertFalse($result['available']);
        $this->assertSame([], $result['items']);
        $this->assertSame(1, $result['limit']);
    }

    public function test_build_cta_path_format(): void
    {
        /** @var StudentQuestService $service */
        $service = $this->app->make(StudentQuestService::class);

        $this->assertSame('/learn/10?focusUnit=20', $service->buildCtaPath(10, 20));
    }

    public function test_map_quest_row_uses_xp_reward_type_without_fake_stars(): void
    {
        $quest = new StudentQuest([
            'id' => 1,
            'quest_type' => StudentQuest::TYPE_UNIT_LESSONS,
            'unit_label' => 'Unit 2',
            'subject_name' => 'English',
            'subject_id' => 10,
            'unit_id' => 20,
            'reward_label' => '3 stars',
            'progress_current' => 5,
            'progress_target' => 10,
            'status' => StudentQuest::STATUS_ACTIVE,
            'cta_path' => '/learn/10?focusUnit=20',
        ]);

        /** @var StudentQuestService $service */
        $service = $this->app->make(StudentQuestService::class);
        $method = new \ReflectionMethod(StudentQuestService::class, 'mapQuestRow');
        $method->setAccessible(true);

        $row = $method->invoke($service, $quest);

        $this->assertSame(5, $row['progress_current']);
        $this->assertSame(10, $row['progress_target']);
        $this->assertSame(50, $row['progress_percent']);
        $this->assertSame('Unit 2', $row['unit_label']);
        $this->assertSame('/learn/10?focusUnit=20', $row['cta_path']);
        $this->assertNull($row['reward_label']);
        $this->assertSame('xp', $row['reward_type']);
    }

    public function test_build_dashboard_payload_scoped_to_student_subjects(): void
    {
        /** @var StudentQuestService $service */
        $service = $this->app->make(StudentQuestService::class);

        $student = Student::query()->where('status', '1')->first();
        if (! $student) {
            $this->markTestSkipped('No active student seed data.');
        }

        $subjectIds = app(\App\Services\Student\StudentDashboardService::class)
            ->subjectIdsForStudent($student);

        if ($subjectIds === []) {
            $this->markTestSkipped('Student has no scoped subjects.');
        }

        $payload = $service->buildDashboardPayload((int) $student->id, (int) $student->school_id, $subjectIds);

        $this->assertArrayHasKey('available', $payload);
        $this->assertArrayHasKey('items', $payload);
        $this->assertArrayHasKey('limit', $payload);
        $this->assertSame(1, $payload['limit']);

        foreach ($payload['items'] as $item) {
            $this->assertContains((int) $item['subject_id'], $subjectIds);
            $this->assertSame(StudentQuest::TYPE_UNIT_LESSONS, $item['quest_type']);
            $this->assertSame(StudentQuest::STATUS_ACTIVE, $item['status']);
            $this->assertNull($item['reward_label']);
            $this->assertSame('xp', $item['reward_type']);
            $this->assertMatchesRegularExpression('#^/learn/\d+\?focusUnit=\d+$#', (string) $item['cta_path']);
            $this->assertLessThanOrEqual($item['progress_target'], $item['progress_current']);
        }
    }

    public function test_quest_rows_are_isolated_per_student(): void
    {
        $students = Student::query()->where('status', '1')->limit(2)->get();
        if ($students->count() < 2) {
            $this->markTestSkipped('Need at least two active students.');
        }

        /** @var StudentQuestService $service */
        $service = $this->app->make(StudentQuestService::class);
        $dashboard = app(\App\Services\Student\StudentDashboardService::class);

        $payloadA = $service->buildDashboardPayload(
            (int) $students[0]->id,
            (int) $students[0]->school_id,
            $dashboard->subjectIdsForStudent($students[0])
        );
        $payloadB = $service->buildDashboardPayload(
            (int) $students[1]->id,
            (int) $students[1]->school_id,
            $dashboard->subjectIdsForStudent($students[1])
        );

        $idsA = StudentQuest::query()->where('student_id', $students[0]->id)->pluck('id')->all();
        $idsB = StudentQuest::query()->where('student_id', $students[1]->id)->pluck('id')->all();

        if ($idsA !== [] && $idsB !== []) {
            $this->assertEmpty(array_intersect($idsA, $idsB));
        }

        $this->assertIsArray($payloadA['items']);
        $this->assertIsArray($payloadB['items']);
    }
}
