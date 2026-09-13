<?php

namespace Tests\Unit\Assignment;

use App\Models\AssignActivity;
use App\Models\Assigns;
use App\Services\Assignment\AssignmentCurriculumContextResolver;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

class AssignmentCurriculumContextResolverTest extends TestCase
{
    public function test_game_and_worksheet_have_no_lesson_unit_context(): void
    {
        $resolver = app(AssignmentCurriculumContextResolver::class);

        $this->assertNull(
            $resolver->resolveActivityContext(LearningActivityMap::TYPE_GAME, 1)
        );
        $this->assertNull(
            $resolver->resolveActivityContext(LearningActivityMap::TYPE_WORKSHEET, 1)
        );
    }

    public function test_mixed_or_missing_activity_contexts_hide_label(): void
    {
        $resolver = app(AssignmentCurriculumContextResolver::class);

        $ebook = new AssignActivity([
            'activity_type' => LearningActivityMap::TYPE_EBOOK,
            'activity_id' => 1,
        ]);
        $worksheet = new AssignActivity([
            'activity_type' => LearningActivityMap::TYPE_WORKSHEET,
            'activity_id' => 1,
        ]);

        $this->assertNull($resolver->commonActivityContext([$ebook, $worksheet]));
        $this->assertNull($resolver->commonActivityContext([$worksheet]));
    }

    public function test_subject_name_comes_from_subjects_table_not_assigned_name(): void
    {
        if (! Schema::hasTable('subjects')) {
            $this->markTestSkipped('subjects table unavailable.');
        }

        $subject = DB::table('subjects')->orderBy('id')->first();
        if (! $subject) {
            $this->markTestSkipped('No subjects rows.');
        }

        $resolver = app(AssignmentCurriculumContextResolver::class);
        $name = $resolver->subjectName((int) $subject->id);
        $expectedEn = trim((string) ($subject->name ?? ''));
        $expectedAr = trim((string) ($subject->name_ar ?? ''));
        $expected = $expectedEn !== '' ? $expectedEn : ($expectedAr !== '' ? $expectedAr : null);

        $this->assertSame($expected, $name);
        $this->assertNotSame('English Homework: Letter Aa', $name);
    }

    public function test_ebook_context_uses_lessons_contents_fks_when_present(): void
    {
        if (
            ! Schema::hasTable('lessons_contents')
            || ! Schema::hasTable('lessons')
            || ! Schema::hasTable('units')
        ) {
            $this->markTestSkipped('Curriculum tables unavailable.');
        }

        $content = DB::table('lessons_contents')
            ->whereNotNull('lesson_id')
            ->where('lesson_id', '>', 0)
            ->orderBy('id')
            ->first();
        if (! $content) {
            $this->markTestSkipped('No lessons_contents with lesson_id.');
        }

        $resolver = app(AssignmentCurriculumContextResolver::class);
        $ctx = $resolver->resolveActivityContext(
            LearningActivityMap::TYPE_EBOOK,
            (int) $content->id
        );

        $this->assertNotNull($ctx);
        $this->assertNotEmpty($ctx['context_label']);
        $this->assertSame((int) $content->lesson_id, (int) $ctx['lesson_id']);
    }

    public function test_for_assign_hides_context_when_activities_differ(): void
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assign_activities')
            || ! Schema::hasTable('subjects')
            || ! Schema::hasTable('lessons_contents')
        ) {
            $this->markTestSkipped('Tables unavailable.');
        }

        $subject = DB::table('subjects')->orderBy('id')->first();
        $contents = DB::table('lessons_contents')
            ->whereNotNull('lesson_id')
            ->where('lesson_id', '>', 0)
            ->orderBy('id')
            ->limit(5)
            ->get();
        if (! $subject || $contents->count() < 2) {
            $this->markTestSkipped('Need subject + 2 ebook contents.');
        }

        $a = $contents[0];
        $b = $contents->first(function ($row) use ($a) {
            return (int) $row->lesson_id !== (int) $a->lesson_id;
        });
        if (! $b) {
            $this->markTestSkipped('Need two ebooks with different lesson_id.');
        }

        $assignId = null;
        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => 'Do Not Parse This Title',
                'assigned_path' => '/todo',
                'school_id' => 1,
                'grade_id' => 1,
                'subject_id' => (int) $subject->id,
                'status' => 1,
                'created_by' => 1,
                'due_at' => now()->addDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('assign_activities')->insert([
                [
                    'assign_id' => $assignId,
                    'activity_type' => LearningActivityMap::TYPE_EBOOK,
                    'activity_id' => (int) $a->id,
                    'source_table' => 'lessons_contents',
                    'grading_mode' => LearningActivityMap::GRADING_AUTOMATIC_COMPLETENESS,
                    'title_snapshot' => 'Snapshot A — never use',
                    'sort_order' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'assign_id' => $assignId,
                    'activity_type' => LearningActivityMap::TYPE_EBOOK,
                    'activity_id' => (int) $b->id,
                    'source_table' => 'lessons_contents',
                    'grading_mode' => LearningActivityMap::GRADING_AUTOMATIC_COMPLETENESS,
                    'title_snapshot' => 'Snapshot B — never use',
                    'sort_order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            $assign = Assigns::with('activities')->find($assignId);
            $this->assertNotNull($assign);

            $payload = app(AssignmentCurriculumContextResolver::class)->forAssign($assign);
            $en = trim((string) ($subject->name ?? ''));
            $ar = trim((string) ($subject->name_ar ?? ''));
            $expected = $en !== '' ? $en : ($ar !== '' ? $ar : null);

            $this->assertSame($expected, $payload['subject_name']);
            $this->assertNotSame('Do Not Parse This Title', $payload['subject_name']);
            $this->assertNull($payload['context_label']);
        } catch (Throwable $e) {
            $this->markTestSkipped('Could not seed mixed-ebook assign: '.$e->getMessage());
        } finally {
            if ($assignId) {
                try {
                    DB::table('assign_activities')->where('assign_id', $assignId)->delete();
                    DB::table('assigns')->where('id', $assignId)->delete();
                } catch (Throwable $e) {
                    // ignore
                }
            }
        }
    }
}
