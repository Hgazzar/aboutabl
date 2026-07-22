<?php

namespace Tests\Unit;

use App\Contracts\ProgressCoverageSourceInterface;
use App\Models\StudentSubjectProgress;
use App\Observers\StudentSubjectProgressObserver;
use App\Repositories\StudentSubjectProgressRepository;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;
use App\Services\Progress\ProgressWriterService;
use App\Services\StudentMetricsService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;
use Throwable;

/**
 * F-022 — Canonical Progress Writer.
 */
class ProgressWriterServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function requireProgressTable(): void
    {
        try {
            if (! Schema::hasTable('student_subject_progress')) {
                $this->markTestSkipped('student_subject_progress missing — run migrations.');
            }
        } catch (Throwable $e) {
            $this->markTestSkipped('Database unavailable: '.$e->getMessage());
        }
    }

    private function fakeSource(int $total, int $completed, bool $implemented = true): ProgressCoverageSourceInterface
    {
        return new class($total, $completed, $implemented) implements ProgressCoverageSourceInterface {
            private $total;
            private $completed;
            private $implemented;

            public function __construct(int $total, int $completed, bool $implemented)
            {
                $this->total = $total;
                $this->completed = $completed;
                $this->implemented = $implemented;
            }

            public function key(): string
            {
                return 'fake_test_source';
            }

            public function isImplemented(): bool
            {
                return $this->implemented;
            }

            public function measure(int $studentId, int $subjectId): array
            {
                return ['total' => $this->total, 'completed' => $this->completed];
            }
        };
    }

    public function test_calculate_skips_unimplemented_sources(): void
    {
        $writer = new ProgressWriterService(
            new StudentSubjectProgressRepository(),
            [$this->fakeSource(10, 5, false)]
        );

        $this->assertSame(0.0, $writer->calculate(1, 1));
    }

    public function test_calculate_uses_only_implemented_trusted_sources(): void
    {
        $writer = new ProgressWriterService(
            new StudentSubjectProgressRepository(),
            [
                $this->fakeSource(10, 5, true),
                $this->fakeSource(10, 10, false), // skipped
            ]
        );

        $this->assertSame(50.0, $writer->calculate(1, 1));
    }

    public function test_default_container_non_lesson_sources_remain_unimplemented(): void
    {
        $writer = app(ProgressWriterService::class);

        foreach ($writer->sources() as $source) {
            if ($source->key() === 'lesson_completion') {
                continue;
            }
            $this->assertFalse(
                $source->isImplemented(),
                $source->key().' must remain skipped until trusted completion exists'
            );
        }
    }

    public function test_same_value_does_not_save_or_fire_observer(): void
    {
        $this->requireProgressTable();

        $studentId = (int) (\DB::table('students')->orderBy('id')->value('id') ?? 0);
        $subjectId = (int) (\DB::table('subjects')->orderBy('id')->value('id') ?? 0);

        if ($studentId <= 0 || $subjectId <= 0) {
            $this->markTestSkipped('No students/subjects available.');
        }

        StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId) {
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->delete();
        });

        $calls = 0;
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')
            ->andReturnUsing(function () use (&$calls) {
                $calls++;
            });
        $this->app->instance(PerformanceSnapshotTrigger::class, $trigger);

        $writer = new ProgressWriterService(
            app(StudentSubjectProgressRepository::class),
            [$this->fakeSource(4, 2)]
        );

        $first = $writer->write($studentId, $subjectId);
        $second = $writer->write($studentId, $subjectId);

        $this->assertSame((int) $first->id, (int) $second->id);
        $this->assertSame(50.0, (float) $first->value);
        $this->assertSame(1, $calls, 'Observer/snapshot once on create; same value must not re-save.');

        $count = StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->count();
        $this->assertSame(1, $count);

        StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId) {
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->delete();
        });
    }

    public function test_one_student_one_row_no_duplicates_on_repeated_writes(): void
    {
        $this->requireProgressTable();

        $studentId = (int) (\DB::table('students')->orderBy('id')->value('id') ?? 0);
        $subjectId = (int) (\DB::table('subjects')->orderByDesc('id')->value('id') ?? 0);

        if ($studentId <= 0 || $subjectId <= 0) {
            $this->markTestSkipped('No students/subjects available.');
        }

        StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId) {
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->delete();
        });

        $writer = new ProgressWriterService(
            app(StudentSubjectProgressRepository::class),
            [$this->fakeSource(10, 3)]
        );

        $a = $writer->write($studentId, $subjectId);
        $b = $writer->write($studentId, $subjectId);
        $writer = new ProgressWriterService(
            app(StudentSubjectProgressRepository::class),
            [$this->fakeSource(10, 7)]
        );
        $c = $writer->write($studentId, $subjectId);

        $this->assertSame((int) $a->id, (int) $b->id);
        $this->assertSame((int) $a->id, (int) $c->id);
        $this->assertSame(70.0, (float) $c->value);
        $this->assertSame(1, StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->count());

        StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId) {
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->delete();
        });
    }

    public function test_metrics_reader_sees_written_progress_immediately(): void
    {
        $this->requireProgressTable();

        $studentId = (int) (\DB::table('students')->orderBy('id')->value('id') ?? 0);
        $subjectId = (int) (\DB::table('subjects')->orderBy('id')->value('id') ?? 0);

        if ($studentId <= 0 || $subjectId <= 0) {
            $this->markTestSkipped('No students/subjects available.');
        }

        StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId) {
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->delete();
        });

        $writer = new ProgressWriterService(
            app(StudentSubjectProgressRepository::class),
            [$this->fakeSource(5, 4)]
        );
        $writer->write($studentId, $subjectId);

        try {
            $map = app(StudentMetricsService::class)->loadProgressByStudent(
                new Collection([$studentId]),
                new Collection([$subjectId])
            );

            $this->assertSame(80.0, (float) $map[$studentId][$subjectId]);

            $computed = app(StudentMetricsService::class)->computeProgress(
                $studentId,
                [$subjectId],
                $map
            );
            $this->assertTrue($computed['has_data']);
            $this->assertSame(80.0, (float) $computed['percent']);
        } finally {
            StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId) {
                StudentSubjectProgress::query()
                    ->where('student_id', $studentId)
                    ->where('subject_id', $subjectId)
                    ->delete();
            });
        }
    }

    public function test_observer_receives_progress_updated_source_label(): void
    {
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')
            ->once()
            ->withArgs(function ($studentId, $source) {
                return (int) $studentId === 9
                    && $source === PerformanceSnapshotSource::PROGRESS_UPDATED;
            });

        $row = Mockery::mock(StudentSubjectProgress::class)->makePartial();
        $row->wasRecentlyCreated = true;
        $row->student_id = 9;
        $row->subject_id = 3;
        $row->value = 25.0;
        $row->id = 1;

        (new StudentSubjectProgressObserver($trigger))->saved($row);
        $this->addToAssertionCount(1);
    }

    public function test_no_other_production_progress_writer_classes_exist(): void
    {
        $paths = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(base_path('app'))
        );

        $writers = [];
        foreach ($paths as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }

            $contents = file_get_contents($file->getPathname());
            if ($contents === false) {
                continue;
            }

            $writesSsp = stripos($contents, 'student_subject_progress') !== false
                || stripos($contents, 'StudentSubjectProgress') !== false;
            $hasWriteApi = preg_match(
                '/function\s+(saveProgress|updateProgress|write)\s*\(/',
                $contents
            );

            if ($writesSsp && $hasWriteApi) {
                $writers[] = $file->getFilename();
            }
        }

        sort($writers);
        $this->assertSame(
            ['ProgressWriterService.php', 'StudentSubjectProgressRepository.php'],
            $writers
        );
    }
}
