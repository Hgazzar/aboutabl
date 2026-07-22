<?php

namespace Tests\Unit;

use App\Events\LessonCompleted;
use App\Models\StudentLessonContentCompletion;
use App\Services\LessonContentCompletionRuntimeService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Tests\Support\LessonProgressFixtures;
use Tests\TestCase;

/**
 * F-030 — Lesson content completion runtime (F-029a contract).
 */
class LessonContentCompletionRuntimeServiceTest extends TestCase
{
    use LessonProgressFixtures;

    protected function tearDown(): void
    {
        $this->destroyF031Fixture();
        parent::tearDown();
    }

    /**
     * @return array{student:\App\Models\Student,lesson:\App\Models\Lessons,content:\App\Models\LessonsContents}
     */
    private function seedAccessibleVideoContent(): array
    {
        $fx = $this->createF031Fixture();
        $fx['content_a']->type = 'video';
        $fx['content_a']->save();

        return [
            'student' => $fx['student'],
            'lesson' => $fx['lesson_a'],
            'content' => $fx['content_a'],
        ];
    }

    private function mediaEvidence(string $kind = 'media_ended'): array
    {
        return [
            'kind' => $kind,
            'client_event_id' => (string) Str::uuid(),
            'occurred_at' => now()->toIso8601String(),
            'media' => [
                'duration_ms' => 10000,
                'position_ms' => $kind === 'media_threshold' ? 9500 : 10000,
            ],
        ];
    }

    public function test_media_completion_persists_once_and_dispatches_lesson_completed_once(): void
    {
        $seed = $this->seedAccessibleVideoContent();

        Event::fake([LessonCompleted::class]);
        $service = app(LessonContentCompletionRuntimeService::class);

        $first = $service->complete(
            (int) $seed['student']->id,
            (int) $seed['content']->id,
            $this->mediaEvidence('media_ended')
        );

        $this->assertFalse($first['content_already_completed']);
        $this->assertTrue($first['content_completed']);
        $this->assertTrue($first['lesson_completed']);

        Event::assertDispatchedTimes(LessonCompleted::class, 1);

        $second = $service->complete(
            (int) $seed['student']->id,
            (int) $seed['content']->id,
            $this->mediaEvidence('media_ended')
        );

        $this->assertTrue($second['content_already_completed']);
        Event::assertDispatchedTimes(LessonCompleted::class, 1);

        $this->assertSame(
            1,
            StudentLessonContentCompletion::query()
                ->where('student_id', $seed['student']->id)
                ->where('lesson_content_id', $seed['content']->id)
                ->count()
        );
    }

    public function test_scorm_type_is_rejected(): void
    {
        $seed = $this->seedAccessibleVideoContent();

        $seed['content']->type = 'scorm';
        $seed['content']->save();

        $service = app(LessonContentCompletionRuntimeService::class);

        $this->expectException(InvalidArgumentException::class);
        $service->complete(
            (int) $seed['student']->id,
            (int) $seed['content']->id,
            $this->mediaEvidence('media_ended')
        );
    }

    public function test_document_requires_explicit_confirm_with_loaded_viewer(): void
    {
        $seed = $this->seedAccessibleVideoContent();

        $seed['content']->type = 'pdf';
        $seed['content']->save();

        $service = app(LessonContentCompletionRuntimeService::class);

        try {
            $service->complete(
                (int) $seed['student']->id,
                (int) $seed['content']->id,
                $this->mediaEvidence('media_ended')
            );
            $this->fail('Expected InvalidArgumentException');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('explicit_confirm', $e->getMessage());
        }

        Event::fake([LessonCompleted::class]);

        $ok = $service->complete(
            (int) $seed['student']->id,
            (int) $seed['content']->id,
            [
                'kind' => 'explicit_confirm',
                'client_event_id' => (string) Str::uuid(),
                'viewer' => ['loaded' => true],
            ]
        );

        $this->assertTrue($ok['content_completed']);
        Event::assertDispatchedTimes(LessonCompleted::class, 1);
    }

    public function test_media_threshold_below_95_percent_rejected(): void
    {
        $seed = $this->seedAccessibleVideoContent();

        $service = app(LessonContentCompletionRuntimeService::class);

        $this->expectException(InvalidArgumentException::class);
        $service->complete(
            (int) $seed['student']->id,
            (int) $seed['content']->id,
            [
                'kind' => 'media_threshold',
                'client_event_id' => (string) Str::uuid(),
                'media' => [
                    'duration_ms' => 10000,
                    'position_ms' => 9000,
                ],
            ]
        );
    }
}
