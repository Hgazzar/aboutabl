<?php

namespace Tests\Unit;

use App\Services\Progress\ProgressWriterService;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * F-023/F-025 — Progress source connection audit.
 *
 * F-025: lesson_completion is the first production Progress source.
 * SCORM / curriculum events remain disconnected.
 */
class ProgressWriterConnectionAuditTest extends TestCase
{
    public function test_registered_coverage_source_keys(): void
    {
        $keys = array_map(
            fn ($source) => $source->key(),
            app(ProgressWriterService::class)->sources()
        );
        sort($keys);

        $this->assertSame(
            ['curriculum_completion_events', 'lesson_completion', 'scorm_completion'],
            $keys
        );
    }

    public function test_non_lesson_sources_remain_disconnected(): void
    {
        foreach (app(ProgressWriterService::class)->sources() as $source) {
            if ($source->key() === 'lesson_completion') {
                continue;
            }
            $this->assertFalse(
                $source->isImplemented(),
                $source->key().' must stay disconnected'
            );
        }
    }

    public function test_only_listener_is_production_progress_writer_caller(): void
    {
        $paths = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(base_path('app'))
        );

        $callers = [];
        foreach ($paths as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }

            $path = $file->getPathname();
            if (str_contains($path, DIRECTORY_SEPARATOR.'Progress'.DIRECTORY_SEPARATOR)) {
                continue;
            }
            if (basename($path) === 'AppServiceProvider.php') {
                continue;
            }

            $contents = file_get_contents($path);
            if ($contents === false) {
                continue;
            }

            if (
                preg_match('/ProgressWriterService/', $contents)
                && preg_match('/->\s*(write|updateProgress)\s*\(/', $contents)
            ) {
                $callers[] = basename($path);
            }
        }

        sort($callers);
        // LessonCompleted listener + curriculum denominator refresh (lesson add/disable/delete).
        $this->assertSame(
            ['LessonsObserver.php', 'UpdateProgressAfterLessonCompleted.php'],
            $callers
        );
    }

    public function test_update_progress_aliases_write(): void
    {
        $writer = app(ProgressWriterService::class);
        $this->assertTrue(method_exists($writer, 'updateProgress'));
        $this->assertTrue(method_exists($writer, 'write'));
    }

    public function test_quiz_lp_adapter_still_does_not_write_progress(): void
    {
        $lp = file_get_contents(base_path('app/Services/QuizRuntime/QuizLearningProgressAdapter.php'));
        $this->assertNotFalse($lp);
        $this->assertStringNotContainsString('ProgressWriterService', $lp);
        $this->assertStringContainsString('opened_at', $lp);
    }

    public function test_lesson_source_implemented_when_tables_exist(): void
    {
        try {
            if (
                ! Schema::hasTable('student_lesson_completions')
                || ! Schema::hasTable('lessons')
            ) {
                $this->markTestSkipped('Lesson completion tables missing — run migrations.');
            }
        } catch (Throwable $e) {
            $this->markTestSkipped('Database unavailable: '.$e->getMessage());
        }

        $lessonSource = null;
        foreach (app(ProgressWriterService::class)->sources() as $source) {
            if ($source->key() === 'lesson_completion') {
                $lessonSource = $source;
                break;
            }
        }

        $this->assertNotNull($lessonSource);
        $this->assertTrue($lessonSource->isImplemented());
    }
}
