<?php

namespace Tests\Unit\Student;

use App\Services\Student\StudentContinueLearningService;
use Tests\TestCase;

class StudentContinueLearningServiceTest extends TestCase
{
    public function test_build_for_subjects_returns_empty_for_no_subject_ids(): void
    {
        /** @var StudentContinueLearningService $service */
        $service = $this->app->make(StudentContinueLearningService::class);

        $this->assertSame([], $service->buildForSubjects(1, [], 2));
    }

    public function test_build_for_subjects_skips_invalid_subject_ids(): void
    {
        /** @var StudentContinueLearningService $service */
        $service = $this->app->make(StudentContinueLearningService::class);

        $this->assertSame([], $service->buildForSubjects(1, [0, -5], 2));
    }

    public function test_build_for_subjects_returns_only_available_payloads_in_order(): void
    {
        $partial = $this->getMockBuilder(StudentContinueLearningService::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['buildForSubject'])
            ->getMock();

        $partial->expects($this->exactly(3))
            ->method('buildForSubject')
            ->willReturnMap([
                [1, 10, ['available' => true, 'subject_id' => 10, 'title' => 'A']],
                [1, 20, ['available' => false]],
                [1, 30, ['available' => true, 'subject_id' => 30, 'title' => 'C']],
            ]);

        $items = $partial->buildForSubjects(1, [10, 20, 30], 2);

        $this->assertCount(2, $items);
        $this->assertSame(10, $items[0]['subject_id']);
        $this->assertSame(30, $items[1]['subject_id']);
    }

    public function test_build_for_subject_returns_unavailable_for_unknown_subject(): void
    {
        /** @var StudentContinueLearningService $service */
        $service = $this->app->make(StudentContinueLearningService::class);

        $payload = $service->buildForSubject(-999999, -999999);

        $this->assertFalse($payload['available'] ?? true);
    }
}
