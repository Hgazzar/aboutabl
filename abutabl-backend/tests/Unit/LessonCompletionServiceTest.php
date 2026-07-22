<?php

namespace Tests\Unit;

use App\Events\LessonCompleted;
use App\Models\LessonsContents;
use App\Models\StudentLessonCompletion;
use App\Models\StudentLessonContentCompletion;
use App\Services\LessonCompletionService;
use Illuminate\Support\Facades\Event;
use Tests\Support\LessonProgressFixtures;
use Tests\TestCase;

/**
 * F-024 — Lesson Completion infrastructure.
 */
class LessonCompletionServiceTest extends TestCase
{
    use LessonProgressFixtures;

    protected function tearDown(): void
    {
        $this->destroyF031Fixture();
        parent::tearDown();
    }

    /**
     * @return array{student_id:int,lesson_id:int,content_ids:int[]}
     */
    private function seedLessonWithContents(int $contentCount): array
    {
        $fx = $this->createF031Fixture();
        $studentId = (int) $fx['student']->id;
        $lessonId = (int) $fx['lesson_a']->id;
        $subjectId = (int) $fx['subject_id'];

        $contentIds = [(int) $fx['content_a']->id];
        while (count($contentIds) < $contentCount) {
            $created = LessonsContents::query()->create([
                'name_en' => 'F024 content '.uniqid('', true),
                'name_ar' => 'F024',
                'lesson_id' => $lessonId,
                'subject_id' => $subjectId,
                'type' => 'image',
                'status' => '1',
                'path' => 'storage/f024.png',
            ]);
            $contentIds[] = (int) $created->id;
        }

        return [
            'student_id' => $studentId,
            'lesson_id' => $lessonId,
            'content_ids' => array_slice($contentIds, 0, $contentCount),
        ];
    }

    public function test_lesson_view_does_not_invoke_completion_service(): void
    {
        $path = base_path('app/Http/Controllers/Api/StudentControllers/SubjectController.php');
        $contents = file_get_contents($path);
        $this->assertNotFalse($contents);
        $this->assertStringContainsString('function lessonView', $contents);
        $this->assertStringNotContainsString('LessonCompletionService', $contents);
        $this->assertStringNotContainsString('recordContentCompleted', $contents);
    }

    public function test_progress_writer_not_called_from_lesson_completion(): void
    {
        $service = file_get_contents(base_path('app/Services/LessonCompletionService.php'));
        $event = file_get_contents(base_path('app/Events/LessonCompleted.php'));
        $this->assertNotFalse($service);
        $this->assertNotFalse($event);
        $this->assertStringNotContainsString('use App\\Services\\Progress\\ProgressWriterService', $service);
        $this->assertStringNotContainsString('->updateProgress(', $service);
        $this->assertStringNotContainsString('->write(', $service);
        $this->assertStringNotContainsString('ProgressWriterService', $event);
    }

    public function test_partial_content_does_not_complete_lesson(): void
    {
        $seed = $this->seedLessonWithContents(2);

        Event::fake([LessonCompleted::class]);
        $service = app(LessonCompletionService::class);

        $result = $service->recordContentCompleted(
            $seed['student_id'],
            $seed['content_ids'][0]
        );

        $this->assertNull($result);
        $this->assertFalse($service->evaluate($seed['student_id'], $seed['lesson_id']));
        $this->assertNull($service->findCompletion($seed['student_id'], $seed['lesson_id']));
        Event::assertNotDispatched(LessonCompleted::class);
    }

    public function test_all_content_finished_stores_completion_and_fires_event_once(): void
    {
        $seed = $this->seedLessonWithContents(2);

        Event::fake([LessonCompleted::class]);
        $service = app(LessonCompletionService::class);

        $service->recordContentCompleted($seed['student_id'], $seed['content_ids'][0]);
        $completion = $service->recordContentCompleted($seed['student_id'], $seed['content_ids'][1]);

        $this->assertNotNull($completion);
        $this->assertSame($seed['student_id'], (int) $completion->student_id);
        $this->assertSame($seed['lesson_id'], (int) $completion->lesson_id);

        Event::assertDispatchedTimes(LessonCompleted::class, 1);

        $again = $service->recordContentCompleted($seed['student_id'], $seed['content_ids'][1]);
        $this->assertNotNull($again);
        $this->assertSame((int) $completion->id, (int) $again->id);

        $third = $service->completeIfEligible($seed['student_id'], $seed['lesson_id']);
        $this->assertSame((int) $completion->id, (int) $third->id);

        Event::assertDispatchedTimes(LessonCompleted::class, 1);

        $this->assertSame(
            1,
            StudentLessonCompletion::query()
                ->where('student_id', $seed['student_id'])
                ->where('lesson_id', $seed['lesson_id'])
                ->count()
        );
    }

    public function test_opening_lesson_path_does_not_create_completion_rows(): void
    {
        $seed = $this->seedLessonWithContents(1);

        $this->assertSame(
            0,
            StudentLessonCompletion::query()
                ->where('student_id', $seed['student_id'])
                ->where('lesson_id', $seed['lesson_id'])
                ->count()
        );
        $this->assertSame(
            0,
            StudentLessonContentCompletion::query()
                ->where('student_id', $seed['student_id'])
                ->where('lesson_id', $seed['lesson_id'])
                ->count()
        );
        $this->assertFalse(
            app(LessonCompletionService::class)->evaluate(
                $seed['student_id'],
                $seed['lesson_id']
            )
        );
    }

    public function test_duplicate_content_completion_is_idempotent(): void
    {
        $seed = $this->seedLessonWithContents(1);

        Event::fake([LessonCompleted::class]);
        $service = app(LessonCompletionService::class);
        $contentId = $seed['content_ids'][0];

        $first = $service->recordContentCompleted($seed['student_id'], $contentId);
        $second = $service->recordContentCompleted($seed['student_id'], $contentId);

        $this->assertNotNull($first);
        $this->assertSame((int) $first->id, (int) $second->id);
        $this->assertSame(
            1,
            StudentLessonContentCompletion::query()
                ->where('student_id', $seed['student_id'])
                ->where('lesson_content_id', $contentId)
                ->count()
        );
        Event::assertDispatchedTimes(LessonCompleted::class, 1);
    }
}
