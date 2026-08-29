<?php

namespace Tests\Unit\Student;

use App\Services\Student\StudentContinueLearningService;
use App\Services\Student\StudentRecommendedActivitiesService;
use App\Services\Student\StudentXpService;
use Mockery;
use Tests\TestCase;

class StudentRecommendedActivitiesServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_build_dashboard_payload_order_and_shape(): void
    {
        /** @var StudentRecommendedActivitiesService $service */
        $service = $this->app->make(StudentRecommendedActivitiesService::class);

        $payload = $service->buildDashboardPayload(1, [1, 2], [
            ['assign_id' => 10],
            ['assign_id' => 11],
        ]);

        $this->assertArrayHasKey('items', $payload);
        $items = $payload['items'];
        $this->assertNotEmpty($items);

        $this->assertSame('pending_assignments', $items[0]['kind']);
        $this->assertSame(2, $items[0]['count']);
        $this->assertSame('/todo', $items[0]['cta_path']);
        $this->assertArrayNotHasKey('reward_xp', $items[0]);

        $last = $items[array_key_last($items)];
        $this->assertSame('game', $last['kind']);
        $this->assertSame('/games', $last['cta_path']);
        $this->assertArrayNotHasKey('reward_xp', $last);

        foreach ($items as $item) {
            if (($item['kind'] ?? '') === 'continue_learning') {
                $this->assertSame('potential', $item['reward_xp_kind'] ?? null);
                $this->assertSame(30, $item['reward_xp'] ?? null);
                $this->assertSame('lesson_content', $item['reward_xp_source'] ?? null);
            }
        }
    }

    public function test_passes_all_subject_ids_to_continue_learning_without_name_filter(): void
    {
        $subjectIds = [7, 15, 99];

        $continueMock = Mockery::mock(StudentContinueLearningService::class);
        $continueMock->shouldReceive('buildForSubjects')
            ->once()
            ->with(42, $subjectIds, 2)
            ->andReturn([
                [
                    'available'    => true,
                    'subject_id'   => 15,
                    'subject_name' => 'Astronomy',
                    'title'        => 'Planets',
                    'path'         => '/learn/15/details/501',
                ],
            ]);

        $xpMock = Mockery::mock(StudentXpService::class);
        $xpMock->shouldReceive('pointsForEventType')
            ->with('lesson_content')
            ->andReturn(30);

        $service = new StudentRecommendedActivitiesService($continueMock, $xpMock);
        $payload = $service->buildDashboardPayload(42, $subjectIds, []);

        $continueItems = array_values(array_filter(
            $payload['items'],
            fn (array $item) => ($item['kind'] ?? '') === 'continue_learning'
        ));

        $this->assertCount(1, $continueItems);
        $this->assertSame(15, $continueItems[0]['subject_id']);
        $this->assertSame('Astronomy', $continueItems[0]['subject_name']);
        $this->assertSame('Planets', $continueItems[0]['content_label']);
        $this->assertSame('lesson_content', $continueItems[0]['reward_xp_source']);
    }

    public function test_english_named_subject_appears_when_continue_learning_returns_it(): void
    {
        $continueMock = Mockery::mock(StudentContinueLearningService::class);
        $continueMock->shouldReceive('buildForSubjects')
            ->once()
            ->with(1, [10], 2)
            ->andReturn([
                [
                    'available'    => true,
                    'subject_id'   => 10,
                    'subject_name' => 'English',
                    'title'        => 'Letter Aa',
                    'path'         => '/learn/10/details/1',
                ],
            ]);

        $xpMock = Mockery::mock(StudentXpService::class);
        $xpMock->shouldReceive('pointsForEventType')->with('lesson_content')->andReturn(30);

        $service = new StudentRecommendedActivitiesService($continueMock, $xpMock);
        $payload = $service->buildDashboardPayload(1, [10], []);

        $continueItems = array_values(array_filter(
            $payload['items'],
            fn (array $item) => ($item['kind'] ?? '') === 'continue_learning'
        ));

        $this->assertCount(1, $continueItems);
        $this->assertSame('English', $continueItems[0]['subject_name']);
    }

    public function test_multiple_eligible_subjects_are_mapped_up_to_continue_limit(): void
    {
        $continueMock = Mockery::mock(StudentContinueLearningService::class);
        $continueMock->shouldReceive('buildForSubjects')
            ->once()
            ->with(1, [10, 20, 30], 2)
            ->andReturn([
                [
                    'available'    => true,
                    'subject_id'   => 10,
                    'subject_name' => 'Science',
                    'title'        => 'Cells',
                    'path'         => '/learn/10/details/1',
                ],
                [
                    'available'    => true,
                    'subject_id'   => 20,
                    'subject_name' => 'Arabic',
                    'title'        => 'Alif',
                    'path'         => '/learn/20/details/2',
                ],
            ]);

        $xpMock = Mockery::mock(StudentXpService::class);
        $xpMock->shouldReceive('pointsForEventType')->with('lesson_content')->andReturn(30);

        $service = new StudentRecommendedActivitiesService($continueMock, $xpMock);
        $payload = $service->buildDashboardPayload(1, [10, 20, 30], []);

        $continueItems = array_values(array_filter(
            $payload['items'],
            fn (array $item) => ($item['kind'] ?? '') === 'continue_learning'
        ));

        $this->assertCount(2, $continueItems);
        $this->assertSame([10, 20], array_column($continueItems, 'subject_id'));
    }

    public function test_no_continue_learning_cards_when_none_are_eligible(): void
    {
        $continueMock = Mockery::mock(StudentContinueLearningService::class);
        $continueMock->shouldReceive('buildForSubjects')
            ->once()
            ->with(1, [10, 20], 2)
            ->andReturn([]);

        $xpMock = Mockery::mock(StudentXpService::class);
        $xpMock->shouldReceive('pointsForEventType')->with('lesson_content')->andReturn(30);

        $service = new StudentRecommendedActivitiesService($continueMock, $xpMock);
        $payload = $service->buildDashboardPayload(1, [10, 20], []);

        $continueItems = array_values(array_filter(
            $payload['items'],
            fn (array $item) => ($item['kind'] ?? '') === 'continue_learning'
        ));

        $this->assertSame([], $continueItems);
        $this->assertSame('pending_assignments', $payload['items'][0]['kind']);
        $this->assertSame('game', $payload['items'][array_key_last($payload['items'])]['kind']);
    }

    public function test_production_code_has_no_english_math_name_heuristic(): void
    {
        $source = file_get_contents(
            app_path('Services/Student/StudentRecommendedActivitiesService.php')
        );

        $this->assertNotFalse($source);
        $this->assertStringNotContainsString('continueLearningSubjectIds', $source);
        $this->assertStringNotContainsString("'english'", strtolower($source));
        $this->assertStringNotContainsString("'math'", strtolower($source));
        $this->assertStringNotContainsString('انجل', $source);
        $this->assertStringNotContainsString('رياض', $source);
        $this->assertStringNotContainsString('App\Models\Subject', $source);
    }
}
