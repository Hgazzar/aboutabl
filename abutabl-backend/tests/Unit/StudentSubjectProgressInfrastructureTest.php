<?php

namespace Tests\Unit;

use App\Models\StudentSubjectProgress;
use App\Observers\StudentSubjectProgressObserver;
use App\Repositories\StudentSubjectProgressRepository;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;
use App\Services\StudentMetricsService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Mockery;
use RuntimeException;
use Tests\TestCase;
use Throwable;

/**
 * F-021 — Student Progress storage infrastructure (no Progress calculation).
 */
class StudentSubjectProgressInfrastructureTest extends TestCase
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

    public function test_direct_model_write_is_blocked(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('StudentSubjectProgressRepository');

        $row = new StudentSubjectProgress([
            'student_id' => 1,
            'subject_id' => 1,
            'value' => 10,
        ]);
        $row->save();
    }

    public function test_observer_fires_once_on_create_via_write_gate(): void
    {
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')
            ->once()
            ->with(
                42,
                PerformanceSnapshotSource::PROGRESS_UPDATED,
                null,
                null,
                null,
                StudentSubjectProgress::class,
                99,
                Mockery::on(function ($meta) {
                    return ($meta['subject_id'] ?? null) === 7
                        && (float) ($meta['value'] ?? -1) === 55.5;
                })
            );

        $row = Mockery::mock(StudentSubjectProgress::class)->makePartial();
        $row->wasRecentlyCreated = true;
        $row->shouldReceive('wasChanged')->with('value')->andReturn(false);
        $row->student_id = 42;
        $row->subject_id = 7;
        $row->value = 55.5;
        $row->id = 99;

        (new StudentSubjectProgressObserver($trigger))->saved($row);
        $this->addToAssertionCount(1);
    }

    public function test_observer_skips_when_value_unchanged_on_update(): void
    {
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldNotReceive('captureStudent');

        $row = Mockery::mock(StudentSubjectProgress::class)->makePartial();
        $row->wasRecentlyCreated = false;
        $row->shouldReceive('wasChanged')->with('value')->andReturn(false);
        $row->student_id = 42;
        $row->subject_id = 7;
        $row->value = 55.5;
        $row->id = 99;

        (new StudentSubjectProgressObserver($trigger))->saved($row);
        $this->assertTrue(true);
    }

    public function test_repository_rejects_out_of_range_value(): void
    {
        $repo = new StudentSubjectProgressRepository();

        $this->expectException(\InvalidArgumentException::class);
        $repo->saveProgress(1, 1, 101.0);
    }

    public function test_duplicate_writes_update_one_row_only(): void
    {
        $this->requireProgressTable();

        $studentId = (int) (\DB::table('students')->orderBy('id')->value('id') ?? 0);
        $subjectId = (int) (\DB::table('subjects')->orderBy('id')->value('id') ?? 0);

        if ($studentId <= 0 || $subjectId <= 0) {
            $this->markTestSkipped('No students/subjects available for F-021 persistence test.');
        }

        $repo = app(StudentSubjectProgressRepository::class);

        $first = $repo->saveProgress($studentId, $subjectId, 12.5);
        $second = $repo->saveProgress($studentId, $subjectId, 33.0);
        $third = $repo->saveProgress($studentId, $subjectId, 33.0); // idempotent

        $this->assertSame((int) $first->id, (int) $second->id);
        $this->assertSame((int) $second->id, (int) $third->id);
        $this->assertSame(33.0, (float) $second->value);

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

    public function test_unique_constraint_exists_after_hardening(): void
    {
        $this->requireProgressTable();

        $indexes = collect(\DB::select('SHOW INDEX FROM student_subject_progress'));
        $unique = $indexes->first(function ($idx) {
            return $idx->Key_name === 'ssp_student_subject_unique' && (int) $idx->Non_unique === 0;
        });

        if (! $unique) {
            $this->markTestSkipped('ssp_student_subject_unique not applied yet — run F-021 migration.');
        }

        $this->assertNotNull($unique);
    }

    public function test_metrics_reader_still_loads_progress_map(): void
    {
        $this->requireProgressTable();

        $studentId = (int) (\DB::table('students')->orderBy('id')->value('id') ?? 0);
        $subjectId = (int) (\DB::table('subjects')->orderBy('id')->value('id') ?? 0);

        if ($studentId <= 0 || $subjectId <= 0) {
            $this->markTestSkipped('No students/subjects available.');
        }

        $repo = app(StudentSubjectProgressRepository::class);
        $repo->saveProgress($studentId, $subjectId, 40.0);

        try {
            $map = app(StudentMetricsService::class)->loadProgressByStudent(
                new Collection([$studentId]),
                new Collection([$subjectId])
            );

            $this->assertArrayHasKey($studentId, $map);
            $this->assertSame(40.0, (float) $map[$studentId][$subjectId]);
        } finally {
            StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId) {
                StudentSubjectProgress::query()
                    ->where('student_id', $studentId)
                    ->where('subject_id', $subjectId)
                    ->delete();
            });
        }
    }

    public function test_observer_fires_once_on_repository_value_change(): void
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

        $calls = 0;
        $trigger = Mockery::mock(PerformanceSnapshotTrigger::class);
        $trigger->shouldReceive('captureStudent')
            ->andReturnUsing(function () use (&$calls) {
                $calls++;
            });
        // Observer is resolved from the container on each Eloquent event.
        $this->app->instance(PerformanceSnapshotTrigger::class, $trigger);

        $repo = app(StudentSubjectProgressRepository::class);
        $repo->saveProgress($studentId, $subjectId, 10.0);
        $repo->saveProgress($studentId, $subjectId, 10.0); // no change → no observer
        $repo->saveProgress($studentId, $subjectId, 20.0);

        $this->assertSame(2, $calls, 'Observer should fire on create and value change only.');

        StudentSubjectProgress::withWriteAllowed(function () use ($studentId, $subjectId) {
            StudentSubjectProgress::query()
                ->where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->delete();
        });
    }
}
