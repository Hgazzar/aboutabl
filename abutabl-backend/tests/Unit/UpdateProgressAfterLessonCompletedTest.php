<?php

namespace Tests\Unit;

use App\Events\LessonCompleted;
use App\Listeners\UpdateProgressAfterLessonCompleted;
use App\Models\StudentLessonCompletion;
use App\Models\StudentSubjectProgress;
use App\Providers\EventServiceProvider;
use App\Repositories\StudentSubjectProgressRepository;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;
use App\Services\Progress\LessonCompletionCoverageSource;
use App\Services\Progress\ProgressWriterService;
use App\Services\StudentMetricsService;
use Illuminate\Support\Collection;
use Mockery;
use Tests\Support\LessonProgressFixtures;
use Tests\TestCase;

/**
 * F-025 — LessonCompleted → ProgressWriter (first production Progress source).
 */
class UpdateProgressAfterLessonCompletedTest extends TestCase
{
    use LessonProgressFixtures;

    protected function tearDown(): void
    {
        $this->destroyF031Fixture();
        Mockery::close();
        parent::tearDown();
    }

    public function test_listener_registered_for_lesson_completed_only(): void
    {
        $listen = (new EventServiceProvider($this->app))->listens();
        $this->assertArrayHasKey(LessonCompleted::class, $listen);
        $this->assertSame(
            [UpdateProgressAfterLessonCompleted::class],
            $listen[LessonCompleted::class]
        );
    }

    public function test_listener_calls_only_progress_writer(): void
    {
        $writer = Mockery::mock(ProgressWriterService::class);
        $writer->shouldReceive('updateProgress')
            ->once()
            ->with(11, 22)
            ->andReturn(new StudentSubjectProgress([
                'student_id' => 11,
                'subject_id' => 22,
                'value' => 50,
            ]));

        $completion = new StudentLessonCompletion([
            'student_id' => 11,
            'lesson_id' => 3,
            'subject_id' => 22,
        ]);

        (new UpdateProgressAfterLessonCompleted($writer))->handle(
            new LessonCompleted($completion)
        );
        $this->addToAssertionCount(1);
    }

    public function test_listener_does_not_call_repository_directly(): void
    {
        $path = base_path('app/Listeners/UpdateProgressAfterLessonCompleted.php');
        $contents = file_get_contents($path);
        $this->assertNotFalse($contents);
        $this->assertStringContainsString('ProgressWriterService', $contents);
        $this->assertStringContainsString('updateProgress', $contents);
        $this->assertStringNotContainsString('StudentSubjectProgressRepository', $contents);
        $this->assertStringNotContainsString('DB::', $contents);
    }

    public function test_lesson_coverage_formula_completed_over_active(): void
    {
        $source = new class implements \App\Contracts\ProgressCoverageSourceInterface {
            public function key(): string
            {
                return 'lesson_completion';
            }

            public function isImplemented(): bool
            {
                return true;
            }

            public function measure(int $studentId, int $subjectId): array
            {
                return ['total' => 4, 'completed' => 1];
            }
        };

        $writer = new ProgressWriterService(
            new StudentSubjectProgressRepository(),
            [$source]
        );

        $this->assertSame(25.0, $writer->calculate(1, 1));
    }

    public function test_progress_clamped_between_zero_and_one_hundred(): void
    {
        $over = new class implements \App\Contracts\ProgressCoverageSourceInterface {
            public function key(): string
            {
                return 'lesson_completion';
            }

            public function isImplemented(): bool
            {
                return true;
            }

            public function measure(int $studentId, int $subjectId): array
            {
                return ['total' => 2, 'completed' => 9];
            }
        };

        $writer = new ProgressWriterService(
            new StudentSubjectProgressRepository(),
            [$over]
        );

        $value = $writer->calculate(1, 1);
        $this->assertGreaterThanOrEqual(0.0, $value);
        $this->assertLessThanOrEqual(100.0, $value);
        $this->assertSame(100.0, $value);
    }

    public function test_lesson_completed_updates_progress_once_and_observer_once(): void
    {
        $fx = $this->createF031Fixture();
        $studentId = (int) $fx['student']->id;
        $subjectId = (int) $fx['subject_id'];
        $lessonId = (int) $fx['lesson_a']->id;

        $calls = 0;
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')
            ->andReturnUsing(function () use (&$calls) {
                $calls++;
            });
        $this->app->instance(PerformanceSnapshotTrigger::class, $trigger);

        $completion = StudentLessonCompletion::query()->create([
            'student_id' => $studentId,
            'lesson_id' => $lessonId,
            'subject_id' => $subjectId,
            'completed_at' => now(),
            'completion_source' => 'test_f025',
        ]);

        event(new LessonCompleted($completion));

        $expected = 50.0;
        $row = StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->first();

        $this->assertNotNull($row);
        $this->assertSame($expected, (float) $row->value);
        $this->assertSame(1, $calls, 'Observer/snapshot once on Progress value change.');

        event(new LessonCompleted($completion));
        $this->assertSame(1, $calls);
        $this->assertSame(
            1,
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->count()
        );

        $map = app(StudentMetricsService::class)->loadProgressByStudent(
            new Collection([$studentId]),
            new Collection([$subjectId])
        );
        $this->assertSame($expected, (float) $map[$studentId][$subjectId]);
    }

    public function test_coverage_source_ignores_inactive_lessons(): void
    {
        $fx = $this->createF031Fixture();
        $source = app(LessonCompletionCoverageSource::class);
        $this->assertTrue($source->isImplemented());

        $fx['lesson_b']->status = '0';
        $fx['lesson_b']->save();

        $measure = $source->measure((int) $fx['student']->id, (int) $fx['subject_id']);
        $this->assertSame(1, (int) $measure['total']);
    }
}
