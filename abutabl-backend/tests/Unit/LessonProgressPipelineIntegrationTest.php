<?php

namespace Tests\Unit;

use App\Events\LessonCompleted;
use App\Http\Controllers\Api\StudentControllers\LessonContentCompletionController;
use App\Listeners\UpdateProgressAfterLessonCompleted;
use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\StudentLessonCompletion;
use App\Models\StudentLessonContentCompletion;
use App\Models\StudentSubjectProgress;
use App\Observers\StudentSubjectProgressObserver;
use App\Providers\EventServiceProvider;
use App\Repositories\StudentSubjectProgressRepository;
use App\Services\LessonCompletionService;
use App\Services\LessonContentCompletionRuntimeService;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;
use App\Services\Progress\ProgressWriterService;
use App\Services\StudentMetricsService;
use App\Services\StudentProfile\StudentSummaryProvider;
use App\Services\TeacherDashboardService;
use Illuminate\Support\Collection;
use Mockery;
use Tests\Support\LessonProgressFixtures;
use Tests\TestCase;

/**
 * F-030 / F-031 — Canonical Lesson Progress pipeline integration validation.
 */
class LessonProgressPipelineIntegrationTest extends TestCase
{
    use LessonProgressFixtures;

    protected function tearDown(): void
    {
        $this->destroyF031Fixture();
        Mockery::close();
        parent::tearDown();
    }

    public function test_pipeline_layers_remain_wired_without_bypass(): void
    {
        $listen = (new EventServiceProvider($this->app))->listens();
        $this->assertSame(
            [UpdateProgressAfterLessonCompleted::class],
            $listen[LessonCompleted::class] ?? null
        );

        $listener = file_get_contents(base_path('app/Listeners/UpdateProgressAfterLessonCompleted.php'));
        $this->assertStringContainsString('ProgressWriterService', $listener);
        $this->assertStringNotContainsString('StudentSubjectProgressRepository', $listener);
        $this->assertStringNotContainsString('PerformanceSnapshotTrigger', $listener);

        $writer = file_get_contents(base_path('app/Services/Progress/ProgressWriterService.php'));
        $this->assertStringContainsString('StudentSubjectProgressRepository', $writer);
        $this->assertStringNotContainsString(
            'use App\\Services\\PerformanceAnalytics\\PerformanceSnapshotTrigger',
            $writer
        );
        $this->assertStringNotContainsString('captureStudent', $writer);

        $observer = file_get_contents(base_path('app/Observers/StudentSubjectProgressObserver.php'));
        $this->assertStringContainsString('PerformanceSnapshotTrigger', $observer);

        $runtime = file_get_contents(base_path('app/Services/LessonContentCompletionRuntimeService.php'));
        $this->assertStringContainsString('LessonCompletionService', $runtime);
        $this->assertStringNotContainsString('ProgressWriterService', $runtime);
        $this->assertStringNotContainsString('StudentSubjectProgressRepository', $runtime);

        $controller = file_get_contents(
            base_path('app/Http/Controllers/Api/StudentControllers/LessonContentCompletionController.php')
        );
        $this->assertStringContainsString('LessonContentCompletionRuntimeService', $controller);
        $this->assertStringNotContainsString('ProgressWriterService', $controller);

        $this->assertTrue(class_exists(LessonContentCompletionController::class));
        $this->assertTrue(class_exists(StudentSummaryProvider::class));
        $this->assertTrue(class_exists(TeacherDashboardService::class));
        $this->assertTrue(method_exists(StudentMetricsService::class, 'loadProgressByStudent'));
        $this->assertTrue(method_exists(StudentMetricsService::class, 'computeProgress'));
    }

    public function test_exactly_one_repository_persistence_and_one_progress_writer_service(): void
    {
        $paths = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(base_path('app'))
        );

        $sspWriters = [];
        $progressWriterCallers = [];

        foreach ($paths as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }
            $path = $file->getPathname();
            $base = basename($path);
            $contents = file_get_contents($path);
            if ($contents === false) {
                continue;
            }

            if (
                $base !== 'StudentSubjectProgressRepository.php'
                && $base !== 'StudentSubjectProgress.php'
                && preg_match('/StudentSubjectProgress::(query\(\)|withWriteAllowed)/', $contents)
                && preg_match('/->(create|update|save|insert)\s*\(/', $contents)
            ) {
                $sspWriters[] = $base;
            }

            if (
                ! str_contains($path, DIRECTORY_SEPARATOR.'Progress'.DIRECTORY_SEPARATOR)
                && $base !== 'AppServiceProvider.php'
                && preg_match('/ProgressWriterService/', $contents)
                && preg_match('/->\s*(write|updateProgress)\s*\(/', $contents)
            ) {
                $progressWriterCallers[] = $base;
            }
        }

        sort($sspWriters);
        sort($progressWriterCallers);

        $this->assertSame([], $sspWriters, 'No production code may write SSP outside the repository.');
        $this->assertSame(
            ['LessonsObserver.php', 'UpdateProgressAfterLessonCompleted.php'],
            $progressWriterCallers
        );
        $this->assertTrue(class_exists(StudentSubjectProgressRepository::class));
        $this->assertTrue(class_exists(ProgressWriterService::class));
        $this->assertTrue(class_exists(StudentSubjectProgressObserver::class));
    }

    public function test_dashboard_and_profile_consume_metrics_progress_not_direct_writes(): void
    {
        $dashboard = file_get_contents(base_path('app/Services/TeacherDashboardService.php'));
        $summary = file_get_contents(base_path('app/Services/StudentProfile/StudentSummaryProvider.php'));

        $this->assertStringContainsString('StudentMetricsService', $dashboard);
        $this->assertStringContainsString('loadProgressByStudent', $dashboard);
        $this->assertStringContainsString('computeProgress', $dashboard);
        $this->assertStringNotContainsString('ProgressWriterService', $dashboard);
        $this->assertStringNotContainsString('StudentSubjectProgressRepository', $dashboard);

        $this->assertStringContainsString('StudentMetricsService', $summary);
        $this->assertStringNotContainsString('ProgressWriterService', $summary);
        $this->assertStringNotContainsString('StudentSubjectProgressRepository', $summary);
    }

    public function test_metrics_has_no_progress_cache_layer(): void
    {
        $metrics = file_get_contents(base_path('app/Services/StudentMetricsService.php'));
        $this->assertStringNotContainsString('Cache::', $metrics);
        $this->assertStringNotContainsString('->remember(', $metrics);
    }

    public function test_end_to_end_completion_is_idempotent_and_updates_metrics_once(): void
    {
        $seed = $this->createF031Fixture();

        $snapshotCalls = 0;
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')
            ->andReturnUsing(function () use (&$snapshotCalls) {
                $snapshotCalls++;
            });
        $this->app->instance(PerformanceSnapshotTrigger::class, $trigger);

        $runtime = app(LessonContentCompletionRuntimeService::class);
        $first = $runtime->complete(
            (int) $seed['student']->id,
            (int) $seed['content_a']->id,
            $this->explicitConfirmEvidence()
        );
        $this->assertTrue($first['content_completed']);
        $this->assertTrue($first['lesson_completed']);

        $expected = 50.0;
        $row = StudentSubjectProgress::query()
            ->where('student_id', $seed['student']->id)
            ->where('subject_id', $seed['subject_id'])
            ->first();
        $this->assertNotNull($row);
        $this->assertSame($expected, (float) $row->value);
        $this->assertSame(1, $snapshotCalls);

        $second = $runtime->complete(
            (int) $seed['student']->id,
            (int) $seed['content_a']->id,
            $this->explicitConfirmEvidence()
        );
        $this->assertTrue($second['content_already_completed']);
        $this->assertSame(1, $snapshotCalls);
        $this->assertSame(
            1,
            StudentLessonContentCompletion::query()
                ->where('student_id', $seed['student']->id)
                ->where('lesson_content_id', $seed['content_a']->id)
                ->count()
        );

        $map = app(StudentMetricsService::class)->loadProgressByStudent(
            new Collection([(int) $seed['student']->id]),
            new Collection([(int) $seed['subject_id']])
        );
        $this->assertSame($expected, (float) $map[(int) $seed['student']->id][(int) $seed['subject_id']]);
    }

    public function test_disabling_lesson_recalculates_progress_via_writer(): void
    {
        $seed = $this->createF031Fixture();

        $snapshotCalls = 0;
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')
            ->andReturnUsing(function () use (&$snapshotCalls) {
                $snapshotCalls++;
            });
        $this->app->instance(PerformanceSnapshotTrigger::class, $trigger);

        app(LessonContentCompletionRuntimeService::class)->complete(
            (int) $seed['student']->id,
            (int) $seed['content_a']->id,
            $this->explicitConfirmEvidence()
        );

        $before = (float) StudentSubjectProgress::query()
            ->where('student_id', $seed['student']->id)
            ->where('subject_id', $seed['subject_id'])
            ->value('value');
        $callsBeforeDisable = $snapshotCalls;

        $seed['lesson_b']->status = '0';
        $seed['lesson_b']->save();

        $after = (float) StudentSubjectProgress::query()
            ->where('student_id', $seed['student']->id)
            ->where('subject_id', $seed['subject_id'])
            ->value('value');

        $this->assertSame(50.0, $before);
        $this->assertSame(100.0, $after);
        $this->assertGreaterThan($callsBeforeDisable, $snapshotCalls);

        $seed['lesson_a']->name_en = 'Renamed '.uniqid('', true);
        $seed['lesson_a']->save();
        $this->assertSame(
            100.0,
            (float) StudentSubjectProgress::query()
                ->where('student_id', $seed['student']->id)
                ->where('subject_id', $seed['subject_id'])
                ->value('value')
        );
    }

    public function test_adding_lesson_recalculates_progress_downward_not_corrupt(): void
    {
        $seed = $this->createF031Fixture();

        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')->andReturnNull();
        $this->app->instance(PerformanceSnapshotTrigger::class, $trigger);

        app(LessonContentCompletionRuntimeService::class)->complete(
            (int) $seed['student']->id,
            (int) $seed['content_a']->id,
            $this->explicitConfirmEvidence()
        );

        $before = (float) StudentSubjectProgress::query()
            ->where('student_id', $seed['student']->id)
            ->where('subject_id', $seed['subject_id'])
            ->value('value');
        $this->assertSame(50.0, $before);

        $extra = Lessons::query()->create([
            'name_en' => 'F031 Extra '.uniqid('', true),
            'name_ar' => 'Extra',
            'subject_id' => $seed['subject_id'],
            'status' => '1',
        ]);

        $after = (float) StudentSubjectProgress::query()
            ->where('student_id', $seed['student']->id)
            ->where('subject_id', $seed['subject_id'])
            ->value('value');
        $this->assertSame(round(100.0 / 3, 2), $after);
        $this->assertLessThan($before, $after);

        $extra->delete();
    }

    public function test_deleted_inactive_content_does_not_block_or_duplicate_progress_rows(): void
    {
        $seed = $this->createF031Fixture();

        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')->andReturnNull();
        $this->app->instance(PerformanceSnapshotTrigger::class, $trigger);

        $extraContent = LessonsContents::query()->create([
            'name_en' => 'Extra content '.uniqid('', true),
            'name_ar' => 'X',
            'lesson_id' => $seed['lesson_a']->id,
            'subject_id' => $seed['subject_id'],
            'type' => 'image',
            'status' => '1',
        ]);

        app(LessonContentCompletionRuntimeService::class)->complete(
            (int) $seed['student']->id,
            (int) $seed['content_a']->id,
            $this->explicitConfirmEvidence()
        );
        $this->assertNull(
            StudentLessonCompletion::query()
                ->where('student_id', $seed['student']->id)
                ->where('lesson_id', $seed['lesson_a']->id)
                ->first()
        );

        $extraContent->status = '0';
        $extraContent->save();

        $lessonCompletion = app(LessonCompletionService::class)->completeIfEligible(
            (int) $seed['student']->id,
            (int) $seed['lesson_a']->id
        );
        $this->assertNotNull($lessonCompletion);

        $required = app(LessonCompletionService::class)->requiredContentIds((int) $seed['lesson_a']->id);
        $this->assertNotContains((int) $extraContent->id, $required);

        $extraContent->delete();
    }

    public function test_progress_writer_clamps_and_repository_rejects_out_of_range(): void
    {
        $writer = new ProgressWriterService(
            new StudentSubjectProgressRepository(),
            [new class implements \App\Contracts\ProgressCoverageSourceInterface {
                public function key(): string
                {
                    return 't';
                }

                public function isImplemented(): bool
                {
                    return true;
                }

                public function measure(int $studentId, int $subjectId): array
                {
                    return ['total' => 1, 'completed' => 5];
                }
            }]
        );
        $this->assertSame(100.0, $writer->calculate(1, 1));

        $this->expectException(\InvalidArgumentException::class);
        (new StudentSubjectProgressRepository())->saveProgress(1, 1, 101.0);
    }
}
