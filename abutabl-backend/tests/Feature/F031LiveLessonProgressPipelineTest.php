<?php

namespace Tests\Feature;

use App\Events\LessonCompleted;
use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\PerformanceFact;
use App\Models\StudentLessonCompletion;
use App\Models\StudentLessonContentCompletion;
use App\Models\StudentSubjectProgress;
use App\Services\LessonCompletionService;
use App\Services\LessonContentCompletionRuntimeService;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\Progress\ProgressWriterService;
use App\Services\StudentMetricsService;
use App\Services\StudentProfileService;
use App\Services\TeacherDashboardService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Tests\Support\LessonProgressFixtures;
use Tests\TestCase;

/**
 * F-031 — Live MySQL end-to-end validation of the Lesson Progress pipeline.
 * Does not skip: requires migrated onesave DB with class-21 student.
 */
class F031LiveLessonProgressPipelineTest extends TestCase
{
    use LessonProgressFixtures;

    protected function tearDown(): void
    {
        $this->destroyF031Fixture();
        parent::tearDown();
    }

    public function test_full_pipeline_completion_snapshot_metrics_dashboard_profile(): void
    {
        $fx = $this->createF031Fixture();
        $studentId = (int) $fx['student']->id;
        $subjectId = (int) $fx['subject_id'];
        $teacherId = (int) $fx['teacher_id'];
        $classId = (int) $fx['class_id'];

        $factsBefore = PerformanceFact::query()
            ->where('student_id', $studentId)
            ->where('source', PerformanceSnapshotSource::PROGRESS_UPDATED)
            ->count();

        $dispatched = 0;
        Event::listen(LessonCompleted::class, function () use (&$dispatched) {
            $dispatched++;
        });

        $runtime = app(LessonContentCompletionRuntimeService::class);
        $first = $runtime->complete($studentId, (int) $fx['content_a']->id, $this->explicitConfirmEvidence());

        $this->assertTrue($first['content_completed']);
        $this->assertTrue($first['lesson_completed']);
        $this->assertSame(1, $dispatched, 'LessonCompleted must fire once');

        $this->assertSame(
            1,
            StudentLessonContentCompletion::query()
                ->where('student_id', $studentId)
                ->where('lesson_content_id', $fx['content_a']->id)
                ->count()
        );
        $this->assertSame(
            1,
            StudentLessonCompletion::query()
                ->where('student_id', $studentId)
                ->where('lesson_id', $fx['lesson_a']->id)
                ->count()
        );

        $active = Lessons::query()
            ->where('subject_id', $subjectId)
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->count();
        $this->assertSame(2, $active);
        $expected = 50.0;

        $row = StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->first();
        $this->assertNotNull($row);
        $this->assertSame($expected, (float) $row->value);
        $this->assertSame(
            1,
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->count()
        );

        $factsAfter = PerformanceFact::query()
            ->where('student_id', $studentId)
            ->where('source', PerformanceSnapshotSource::PROGRESS_UPDATED)
            ->where('class_id', $classId)
            ->whereDate('metric_date', now()->toDateString())
            ->orderByDesc('id')
            ->get();

        $this->assertTrue(
            $factsAfter->isNotEmpty(),
            'performance_facts must contain a progress_updated row'
        );
        $latestFact = $factsAfter->first();
        $this->assertTrue((bool) $latestFact->has_progress_data);
        $this->assertNotNull($latestFact->progress_average);
        $this->assertGreaterThanOrEqual(0.0, (float) $latestFact->progress_average);
        $this->assertLessThanOrEqual(100.0, (float) $latestFact->progress_average);

        // Idempotent duplicate completion.
        $second = $runtime->complete($studentId, (int) $fx['content_a']->id, $this->explicitConfirmEvidence());
        $this->assertTrue($second['content_already_completed']);
        $this->assertSame(1, $dispatched);
        $this->assertSame(
            1,
            StudentLessonContentCompletion::query()
                ->where('student_id', $studentId)
                ->where('lesson_content_id', $fx['content_a']->id)
                ->count()
        );
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

        $computed = app(StudentMetricsService::class)->computeProgress(
            $studentId,
            [$subjectId],
            $map
        );
        $this->assertSame(50.0, (float) $computed['percent']);
        $this->assertTrue($computed['has_data']);
        $this->assertGreaterThanOrEqual(0.0, (float) $computed['percent']);
        $this->assertLessThanOrEqual(100.0, (float) $computed['percent']);

        $dashboard = app(TeacherDashboardService::class);
        $scope = $dashboard->resolveClassAccess($teacherId, [$fx['school_id']], $classId);
        $this->assertNotNull($scope);
        $subjectIds = array_map('intval', $scope['subjects_by_class'][$classId] ?? []);
        $this->assertContains($subjectId, $subjectIds);

        $progressByStudent = app(StudentMetricsService::class)->loadProgressByStudent(
            new Collection([$studentId]),
            collect($subjectIds)
        );
        $dashProgress = app(StudentMetricsService::class)->computeProgress(
            $studentId,
            $subjectIds,
            $progressByStudent
        );
        $this->assertTrue($dashProgress['has_data']);
        $this->assertGreaterThanOrEqual(0.0, (float) $dashProgress['percent']);
        $this->assertLessThanOrEqual(100.0, (float) $dashProgress['percent']);
        // Fixture subject alone must still read 50 via Metrics.
        $this->assertSame(
            50.0,
            (float) ($progressByStudent[$studentId][$subjectId] ?? -1)
        );

        $profile = app(StudentProfileService::class)->buildProfile(
            $teacherId,
            [$fx['school_id']],
            $classId,
            $studentId,
            'week',
            'letters-explorer',
            1,
            1,
            'class',
            null,
            null
        );
        $summaryStudent = $profile['student'] ?? null;
        $this->assertNotNull($summaryStudent);
        $this->assertNotEmpty($summaryStudent);
        $perf = (float) ($summaryStudent['performance_percent'] ?? -1);
        $this->assertGreaterThanOrEqual(0.0, $perf);
        $this->assertLessThanOrEqual(100.0, $perf);
    }

    public function test_disable_and_add_lesson_recalculate_progress(): void
    {
        $fx = $this->createF031Fixture();
        $studentId = (int) $fx['student']->id;
        $subjectId = (int) $fx['subject_id'];

        app(LessonContentCompletionRuntimeService::class)->complete(
            $studentId,
            (int) $fx['content_a']->id,
            $this->explicitConfirmEvidence()
        );

        $before = (float) StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->value('value');
        $this->assertSame(50.0, $before);

        $fx['lesson_b']->status = '0';
        $fx['lesson_b']->save();

        $afterDisable = (float) StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->value('value');
        $this->assertSame(100.0, $afterDisable);

        $extra = Lessons::query()->create([
            'name_en' => 'F031 Extra '.$fx['suffix'],
            'name_ar' => 'X',
            'subject_id' => $subjectId,
            'status' => '1',
        ]);

        $afterAdd = (float) StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->value('value');
        $this->assertSame(50.0, $afterAdd);
        $this->assertLessThan($afterDisable, $afterAdd);

        // Rename must not change Progress (order/name independent).
        $fx['lesson_a']->name_en = 'F031 Renamed '.$fx['suffix'];
        $fx['lesson_a']->save();
        $this->assertSame(
            50.0,
            (float) StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->value('value')
        );

        $extra->delete();
    }

    public function test_concurrent_progress_writes_remain_single_row(): void
    {
        $fx = $this->createF031Fixture();
        $studentId = (int) $fx['student']->id;
        $subjectId = (int) $fx['subject_id'];

        StudentLessonCompletion::query()->create([
            'student_id' => $studentId,
            'lesson_id' => $fx['lesson_a']->id,
            'subject_id' => $subjectId,
            'completed_at' => now(),
            'completion_source' => 'test_f031_concurrent',
        ]);

        $writer = app(ProgressWriterService::class);

        // Simulate concurrent writers (sequential locked upserts exercising race path).
        $procs = [];
        for ($i = 0; $i < 5; $i++) {
            $writer->updateProgress($studentId, $subjectId);
        }

        // True multi-process race via CLI.
        $php = PHP_BINARY;
        $base = base_path();
        $cmd = sprintf(
            'cd %s && %s -r %s',
            escapeshellarg($base),
            escapeshellarg($php),
            escapeshellarg(
                "require 'vendor/autoload.php';".
                "\$app=require 'bootstrap/app.php';".
                "\$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();".
                "app(App\\Services\\Progress\\ProgressWriterService::class)->updateProgress({$studentId}, {$subjectId});"
            )
        );

        $handles = [];
        for ($i = 0; $i < 4; $i++) {
            $handles[] = popen($cmd, 'r');
        }
        foreach ($handles as $h) {
            if (is_resource($h)) {
                stream_get_contents($h);
                pclose($h);
            }
        }

        $this->assertSame(
            1,
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->count()
        );

        $value = (float) StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->value('value');
        $this->assertGreaterThanOrEqual(0.0, $value);
        $this->assertLessThanOrEqual(100.0, $value);
    }

    public function test_architecture_guards_still_hold(): void
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

        $this->assertSame([], $sspWriters);
        $this->assertSame(
            ['LessonsObserver.php', 'UpdateProgressAfterLessonCompleted.php'],
            $progressWriterCallers
        );

        $observer = file_get_contents(base_path('app/Observers/StudentSubjectProgressObserver.php'));
        $writer = file_get_contents(base_path('app/Services/Progress/ProgressWriterService.php'));
        $this->assertStringContainsString('PerformanceSnapshotTrigger', $observer);
        $this->assertStringNotContainsString(
            'use App\\Services\\PerformanceAnalytics\\PerformanceSnapshotTrigger',
            $writer
        );
    }

    public function test_inactive_extra_content_then_complete_if_eligible(): void
    {
        $fx = $this->createF031Fixture();
        $studentId = (int) $fx['student']->id;

        $extra = LessonsContents::query()->create([
            'name_en' => 'F031 ExtraContent '.$fx['suffix'],
            'name_ar' => 'X',
            'lesson_id' => $fx['lesson_a']->id,
            'subject_id' => $fx['subject_id'],
            'type' => 'image',
            'status' => '1',
            'path' => 'storage/f031-extra.png',
        ]);

        app(LessonContentCompletionRuntimeService::class)->complete(
            $studentId,
            (int) $fx['content_a']->id,
            $this->explicitConfirmEvidence()
        );
        $this->assertNull(
            StudentLessonCompletion::query()
                ->where('student_id', $studentId)
                ->where('lesson_id', $fx['lesson_a']->id)
                ->first()
        );

        $extra->status = '0';
        $extra->save();

        $completion = app(LessonCompletionService::class)->completeIfEligible(
            $studentId,
            (int) $fx['lesson_a']->id
        );
        $this->assertNotNull($completion);

        $required = app(LessonCompletionService::class)->requiredContentIds((int) $fx['lesson_a']->id);
        $this->assertNotContains((int) $extra->id, $required);

        $extra->delete();
    }
}
