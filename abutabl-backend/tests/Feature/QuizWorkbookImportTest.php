<?php

namespace Tests\Feature;

use App\Imports\ActivityQuestionsImport;
use App\Imports\QuestionsImport;
use App\Imports\QuizWorkbookImport;
use App\Models\Lessons;
use App\Models\Questions;
use App\Models\Quizes;
use App\Models\QuizesQuestions;
use App\Models\QuizRuntime\QuizSnapshot;
use App\Models\QuizRuntime\QuizVersion;
use App\Models\QuizWorkbookField;
use App\Models\Subject;
use App\Models\Units;
use App\Models\User;
use App\Services\Assignment\LearningActivitiesBrowserService;
use App\Services\QuizRuntime\QuizPublishService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class QuizWorkbookImportTest extends TestCase
{
    /** @var Subject */
    private $subject;

    /** @var Units */
    private $unit;

    /** @var Lessons */
    private $lesson;

    /** @var User */
    private $admin;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'sqlite') {
            $this->markTestSkipped('Quiz workbook tests build a private schema and run only when DB_CONNECTION=sqlite.');
        }

        $this->buildPrivateSchema();

        $this->admin = User::create([
            'name' => 'Workbook Admin',
            'email' => 'workbook-admin@test.com',
            'phone' => '01000000001',
            'password' => bcrypt('password'),
            'type' => 'admin',
        ]);
        $this->subject = Subject::create(['name' => 'Arabic', 'name_ar' => 'عربي']);
        $this->unit = Units::create([
            'name' => 'Unit 1',
            'name_ar' => 'الوحدة 1',
            'subject_id' => $this->subject->id,
        ]);
        $lessonDispatcher = Lessons::getEventDispatcher();
        Lessons::unsetEventDispatcher();
        $this->lesson = Lessons::create([
            'name_en' => 'Lesson 1',
            'name_ar' => 'الدرس 1',
            'subject_id' => $this->subject->id,
            'unit_id' => $this->unit->id,
        ]);
        Lessons::setEventDispatcher($lessonDispatcher);
    }

    public function test_header_must_match_all_26_columns_including_title_space(): void
    {
        $headers = QuizWorkbookImport::HEADERS;
        $headers[4] = 'Title';
        $path = $this->workbook([$this->fullRow()], $headers);

        $preview = (new QuizWorkbookImport())->preview($path);

        $this->assertFalse($preview['valid']);
        $this->assertStringContainsString('Title ', $preview['file_errors'][0]);
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_reference_row_is_skipped_and_correct_answer_and_title_are_stored_as_given(): void
    {
        $row = $this->fullRow();
        $row[4] = 'Letter quiz';
        $row[12] = 1;
        $row[25] = 'RF.K.1';
        $path = $this->workbook([$this->legendRow(), $row]);

        $preview = (new QuizWorkbookImport())->preview($path);

        $this->assertTrue($preview['valid']);
        $this->assertCount(1, $preview['rows']);
        $this->assertSame(3, $preview['rows'][0]['row']);
        $this->assertSame('1', $preview['rows'][0]['fields']['corAnswer']);
        $this->assertSame('Letter quiz', $preview['rows'][0]['fields']['import_title']);
        $this->assertDatabaseCount('questions', 0);

        $result = (new QuizWorkbookImport())->commit($path, [], $this->admin->id);

        $this->assertTrue($result['written']);
        $saved = Questions::find($result['created'][0]['question_id']);
        $this->assertSame('1', $saved->corAnswer);
        $this->assertSame('Cat', $saved->answer1);
        $this->assertSame('RF.K.1', $saved->code);
        $this->assertSame('Look at the letter.', $saved->question);
        $side = QuizWorkbookField::where('question_id', $saved->id)->first();
        $this->assertSame('Letter quiz', $side->import_title);
        $this->assertSame('See the letter', $side->primary_head_text);
        $this->assertDatabaseCount('quizes', 0);
        $this->assertFalse(Schema::hasColumn('questions', 'import_title'));
    }

    public function test_commit_for_a_quiz_lesson_links_the_new_questions_in_one_transaction(): void
    {
        $activityId = DB::table('subject_activities')->insertGetId([
            'type' => 'Quizzes',
            'subject_id' => $this->subject->id,
            'unit_id' => $this->unit->id,
        ]);
        $lessonActivityId = DB::table('activity_lessons')->insertGetId([
            'name_en' => 'Demo Quiz Lesson',
            'name_ar' => 'درس اختبار',
            'subject_activity_id' => $activityId,
            'lesson_id' => $this->lesson->id,
        ]);
        $path = $this->workbook([$this->fullRow()]);
        $dispatcher = Quizes::getEventDispatcher();
        Quizes::unsetEventDispatcher();
        try {
            $result = (new QuizWorkbookImport())->commit($path, [], $this->admin->id, $lessonActivityId);
        } finally {
            Quizes::setEventDispatcher($dispatcher);
        }

        $this->assertTrue($result['written']);
        $quiz = Quizes::find($result['quiz_id']);
        $this->assertSame($lessonActivityId, (int) $quiz->activity_lesson_id);
        $this->assertSame($this->subject->id, (int) $quiz->subject_id);
        $this->assertSame('Demo Quiz Lesson', $quiz->title_en);
        $questionId = $result['created'][0]['question_id'];
        $this->assertSame($this->lesson->id, (int) Questions::find($questionId)->lesson_id);
        $this->assertSame(1, QuizesQuestions::where('quize_id', $quiz->id)->where('question_id', $questionId)->count());
        $this->assertSame(1, QuizWorkbookField::where('question_id', $questionId)->count());

        $rejected = (new QuizWorkbookImport())->commit($path, [], $this->admin->id, 999);
        $this->assertFalse($rejected['written']);
        $this->assertDatabaseCount('quizes', 1);
    }

    public function test_commit_still_saves_when_the_standards_link_table_is_missing(): void
    {
        $activityId = DB::table('subject_activities')->insertGetId([
            'type' => 'quizzes',
            'subject_id' => $this->subject->id,
            'unit_id' => $this->unit->id,
        ]);
        $lessonActivityId = DB::table('activity_lessons')->insertGetId([
            'name_en' => 'First',
            'subject_activity_id' => $activityId,
            'lesson_id' => $this->lesson->id,
        ]);
        $this->assertFalse(Schema::hasTable('content_standard'));

        $result = (new QuizWorkbookImport())->commit($this->workbook([$this->fullRow()]), [], $this->admin->id, $lessonActivityId);

        $this->assertTrue($result['written']);
        $this->assertDatabaseCount('questions', 1);
        $this->assertDatabaseCount('quiz_workbook_fields', 1);
        $this->assertDatabaseCount('quizes', 1);
        $this->assertDatabaseCount('quizes_questions', 1);
        $this->assertDatabaseCount('quiz_versions', 1);
        $this->assertDatabaseCount('quiz_snapshots', 1);
    }

    public function test_commit_publishes_a_runtime_version_without_a_default_close_date(): void
    {
        $lessonActivityId = $this->quizActivityLesson('Ready Quiz');
        DB::table('file_management')->insert([
            'name' => 'bird',
            'type' => 'mp3',
            'hashName' => 'abc.mp3',
            'path' => 'files_maanger/abc.mp3',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $row = $this->fullRow();
        $row[5] = 'bird.mp3';

        $result = (new QuizWorkbookImport())->commit($this->workbook([$row]), [], $this->admin->id, $lessonActivityId);

        $this->assertTrue($result['written']);
        $quiz = Quizes::find($result['quiz_id']);
        $this->assertNull($quiz->getAttributes()['start_date']);
        $this->assertNull($quiz->getAttributes()['due_date']);
        $this->assertSame(0.0, (float) $quiz->getAttributes()['score_to_pass']);
        $this->assertSame('1', (string) $quiz->getAttributes()['status']);

        $version = QuizVersion::where('quiz_id', $quiz->id)->first();
        $this->assertNotNull($version);
        $this->assertSame(QuizVersion::STATUS_PUBLISHED, $version->status);
        $this->assertSame($this->admin->id, (int) $version->published_by);
        $this->assertNull($version->settings_frozen['start_date'] ?? null);
        $this->assertNull($version->settings_frozen['due_date'] ?? null);

        $snapshot = QuizSnapshot::where('quiz_version_id', $version->id)->first();
        $this->assertNotNull($snapshot);
        $this->assertSame(1, (int) $snapshot->item_count);
        $questionId = $result['created'][0]['question_id'];
        $this->assertSame($questionId, (int) $snapshot->payload['questions'][0]['question_id']);
        $stem = $snapshot->payload['questions'][0]['stem'];
        $this->assertSame('file', $stem[0]['type']);
        $this->assertSame('audio', $stem[0]['ext']);
        $this->assertStringContainsString('/storage/files_maanger/abc.mp3', $stem[0]['text']);
        $this->assertSame(['type' => 'text', 'text' => 'Look at the letter.'], $stem[1]);
        $this->assertArrayNotHasKey('primary_head_audio', $snapshot->payload['questions'][0]);
        $this->assertSame('bird.mp3', QuizWorkbookField::where('question_id', $questionId)->value('primary_head_audio'));

        $listed = (new LearningActivitiesBrowserService())->activities(
            (int) $this->subject->id,
            'quizzes',
            [(int) $this->subject->id]
        );
        $this->assertSame((int) $quiz->id, (int) $listed[0]['activity_id']);
        $resolved = (new LearningActivitiesBrowserService())->resolveForStore(
            [[
                'activity_type' => 'quiz',
                'activity_id' => (int) $quiz->id,
            ]],
            [(int) $this->subject->id],
            (int) $this->subject->id
        );
        $this->assertSame((int) $quiz->id, (int) $resolved[0]['activity_id']);
        $this->assertSame('quizes', $resolved[0]['source_table']);
    }

    public function test_snapshot_includes_resolved_media_and_skips_a_missing_file(): void
    {
        DB::table('file_management')->insert([
            [
                'name' => 'bird',
                'type' => 'mp3',
                'hashName' => 'bird.mp3',
                'path' => 'files_maanger/bird.mp3',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'cat',
                'type' => 'png',
                'hashName' => 'cat.png',
                'path' => 'files_maanger/cat.png',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'dog',
                'type' => 'mp3',
                'hashName' => 'dog.mp3',
                'path' => 'files_maanger/dog.mp3',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
        $both = $this->fullRow();
        $both[5] = 'bird.mp3';
        $both[8] = 'cat.png';
        $both[9] = 'Question with image and audio';
        $both[13] = 'dog.mp3';
        $both[14] = 'cat.png';
        $imageOnly = $this->fullRow();
        $imageOnly[8] = 'cat.png';
        $imageOnly[9] = 'Question with image only';
        $audioOnly = $this->fullRow();
        $audioOnly[7] = 'bird.mp3';
        $audioOnly[9] = 'Question with audio only';
        $plain = $this->fullRow();
        $plain[6] = 'Plain head';
        $plain[9] = 'Question with no media';
        $lessonActivityId = $this->quizActivityLesson('Media Quiz');

        $result = (new QuizWorkbookImport())->commit(
            $this->workbook([$both, $imageOnly, $audioOnly, $plain]),
            [],
            $this->admin->id,
            $lessonActivityId
        );

        $this->assertTrue($result['written']);
        $snapshot = QuizSnapshot::where('quiz_id', $result['quiz_id'])->first();
        $byStem = [];
        foreach ($snapshot->payload['questions'] as $question) {
            $stem = $question['stem'];
            $text = is_array($stem)
                ? (string) (collect($stem)->firstWhere('type', 'text')['text'] ?? '')
                : (string) $stem;
            $byStem[$text] = $question;
        }

        $withBoth = $byStem['Question with image and audio'];
        $this->assertSame('audio', $withBoth['stem'][0]['ext']);
        $this->assertStringContainsString('/storage/files_maanger/bird.mp3', $withBoth['stem'][0]['text']);
        $this->assertSame('image', $withBoth['stem'][1]['ext']);
        $this->assertStringContainsString('/storage/files_maanger/cat.png', $withBoth['stem'][1]['text']);
        $this->assertStringContainsString('/storage/files_maanger/dog.mp3', $withBoth['options']['answer1_audio']);
        $this->assertStringContainsString('/storage/files_maanger/cat.png', $withBoth['options']['answer1_image']);

        $withImage = $byStem['Question with image only'];
        $this->assertSame('image', $withImage['stem'][0]['ext']);
        $this->assertArrayNotHasKey('answer1_image', $withImage['options']);

        $withAudio = $byStem['Question with audio only'];
        $this->assertSame('audio', $withAudio['stem'][0]['ext']);
        $this->assertSame('text', $withAudio['stem'][1]['type']);

        $this->assertSame('Question with no media', $byStem['Question with no media']['stem']);

        $plainId = (int) collect($result['created'])->last()['question_id'];
        QuizWorkbookField::where('question_id', $plainId)->update([
            'primary_content_image' => 'missing.png',
        ]);
        app(\App\Services\QuizRuntime\QuizPublishService::class)->publish([
            'quiz_id' => (int) $result['quiz_id'],
            'published_by' => $this->admin->id,
        ]);
        $this->assertSame(1, QuizSnapshot::where('quiz_id', $result['quiz_id'])->count());
        $again = QuizSnapshot::where('quiz_id', $result['quiz_id'])->first();
        $this->assertStringNotContainsString('missing.png', json_encode($again->payload));
    }

    public function test_publish_failure_rolls_back_the_quiz_questions_and_runtime_rows(): void
    {
        $this->mock(QuizPublishService::class, function ($mock) {
            $mock->shouldReceive('publish')->once()->andThrow(new \RuntimeException('publish failed'));
        });
        $lessonActivityId = $this->quizActivityLesson('Rollback Quiz');

        try {
            (new QuizWorkbookImport())->commit($this->workbook([$this->fullRow()]), [], $this->admin->id, $lessonActivityId);
            $this->fail('Publish failure must leave the import transaction.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('publish failed', $exception->getMessage());
        }

        $this->assertDatabaseCount('questions', 0);
        $this->assertDatabaseCount('quiz_workbook_fields', 0);
        $this->assertDatabaseCount('quizes', 0);
        $this->assertDatabaseCount('quizes_questions', 0);
        $this->assertDatabaseCount('quiz_versions', 0);
        $this->assertDatabaseCount('quiz_snapshots', 0);
    }

    public function test_add_quiz_still_publishes_from_the_controller(): void
    {
        $source = file_get_contents(app_path('Http/Controllers/Api/AdminControllers/QuizesController.php'));

        $this->assertStringContainsString('private function publishQuizRuntime(int $quizId): void', $source);
        $this->assertStringContainsString('$this->publishQuizRuntime((int) $quize->id);', $source);
        $this->assertStringContainsString("'published_by' => auth()->user()->id ?? null,", $source);
    }

    public function test_quiz_placement_accepts_lowercase_quizzes_and_rejects_other_activity_types(): void
    {
        $gamesActivityId = DB::table('subject_activities')->insertGetId([
            'type' => 'games',
            'subject_id' => $this->subject->id,
            'unit_id' => $this->unit->id,
        ]);
        $gamesLessonId = DB::table('activity_lessons')->insertGetId([
            'name_en' => 'Game Lesson',
            'subject_activity_id' => $gamesActivityId,
            'lesson_id' => $this->lesson->id,
        ]);
        $path = $this->workbook([$this->fullRow()]);

        $rejected = (new QuizWorkbookImport())->commit($path, [], $this->admin->id, $gamesLessonId);

        $this->assertFalse($rejected['written']);
        $this->assertSame('The selected lesson is not a quiz activity lesson. Nothing was saved.', $rejected['message']);
        $this->assertDatabaseCount('questions', 0);
        $this->assertDatabaseCount('quizes', 0);

        $nullActivityId = DB::table('subject_activities')->insertGetId([
            'type' => null,
            'subject_id' => $this->subject->id,
            'unit_id' => $this->unit->id,
        ]);
        $nullLessonId = DB::table('activity_lessons')->insertGetId([
            'name_en' => 'Null Type Lesson',
            'subject_activity_id' => $nullActivityId,
            'lesson_id' => $this->lesson->id,
        ]);
        $warnings = [];
        set_error_handler(function ($severity, $message) use (&$warnings) {
            $warnings[] = $message;

            return true;
        });
        try {
            $nullRejected = (new QuizWorkbookImport())->commit($path, [], $this->admin->id, $nullLessonId);
        } finally {
            restore_error_handler();
        }
        $this->assertSame([], $warnings);
        $this->assertFalse($nullRejected['written']);
        $this->assertSame('The selected lesson is not a quiz activity lesson. Nothing was saved.', $nullRejected['message']);
        $this->assertDatabaseCount('questions', 0);
        $this->assertDatabaseCount('quizes', 0);

        $quizActivityId = DB::table('subject_activities')->insertGetId([
            'type' => 'quizzes',
            'subject_id' => $this->subject->id,
            'unit_id' => $this->unit->id,
        ]);
        $quizLessonId = DB::table('activity_lessons')->insertGetId([
            'name_en' => 'Stored Quiz Lesson',
            'subject_activity_id' => $quizActivityId,
            'lesson_id' => $this->lesson->id,
        ]);
        $capitalActivityId = DB::table('subject_activities')->insertGetId([
            'type' => 'Quizzes',
            'subject_id' => $this->subject->id,
            'unit_id' => $this->unit->id,
        ]);
        $capitalLessonId = DB::table('activity_lessons')->insertGetId([
            'name_en' => 'Capital Quiz Lesson',
            'subject_activity_id' => $capitalActivityId,
            'lesson_id' => $this->lesson->id,
        ]);
        $capitalPath = $this->workbook([$this->secondRow()]);
        $dispatcher = Quizes::getEventDispatcher();
        Quizes::unsetEventDispatcher();
        try {
            $saved = (new QuizWorkbookImport())->commit($path, [], $this->admin->id, $quizLessonId);
            $capitalSaved = (new QuizWorkbookImport())->commit($capitalPath, [], $this->admin->id, $capitalLessonId);
        } finally {
            Quizes::setEventDispatcher($dispatcher);
        }

        $this->assertTrue($saved['written']);
        $this->assertSame($quizLessonId, (int) Quizes::find($saved['quiz_id'])->activity_lesson_id);
        $this->assertTrue($capitalSaved['written']);
        $this->assertSame($capitalLessonId, (int) Quizes::find($capitalSaved['quiz_id'])->activity_lesson_id);
        $this->assertDatabaseCount('questions', 2);
        $this->assertDatabaseCount('quizes', 2);
    }

    public function test_empty_answer_prevents_a_false_duplicate_inside_the_file_and_against_existing_rows(): void
    {
        $existing = $this->seedQuestion('Look at the letter.', '1', 'Cat', 'Dog', 'Bird', '');
        $complete = $this->fullRow();
        $partial = $this->fullRow();
        $partial[24] = '';
        $path = $this->workbook([$complete, $partial]);

        $preview = (new QuizWorkbookImport())->preview($path);

        $this->assertSame('ok', $preview['rows'][0]['status']);
        $this->assertNull($preview['rows'][0]['duplicate_of']);
        $this->assertSame('ok', $preview['rows'][1]['status']);
        $this->assertNull($preview['rows'][1]['duplicate_of']);
        $this->assertNull($preview['rows'][1]['duplicate_of_row']);

        $result = (new QuizWorkbookImport())->commit($path, [], $this->admin->id);

        $this->assertTrue($result['written']);
        $this->assertSame('1', Questions::find($existing->id)->corAnswer);
        $this->assertSame('', (string) Questions::find($existing->id)->answer4);
        $this->assertDatabaseCount('questions', 3);
    }

    public function test_full_match_is_duplicate_and_skip_or_create_new_never_replaces_the_original(): void
    {
        $existing = $this->seedQuestion('Look at the letter.', '1', 'Cat', 'Dog', 'Bird', 'Fish');
        $original = $existing->corAnswer;
        $path = $this->workbook([$this->fullRow(), $this->fullRow()]);

        $preview = (new QuizWorkbookImport())->preview($path);

        $this->assertSame('duplicate', $preview['rows'][0]['status']);
        $this->assertSame($existing->id, $preview['rows'][0]['duplicate_of']);
        $this->assertSame('duplicate', $preview['rows'][1]['status']);
        $this->assertSame(2, $preview['rows'][1]['duplicate_of_row']);

        $blocked = (new QuizWorkbookImport())->commit($path, [], $this->admin->id);
        $this->assertFalse($blocked['written']);
        $this->assertDatabaseCount('questions', 1);

        $skipped = (new QuizWorkbookImport())->commit($path, [
            2 => 'skip',
            3 => 'skip',
        ], $this->admin->id);
        $this->assertTrue($skipped['written']);
        $this->assertSame([], $skipped['created']);
        $this->assertDatabaseCount('questions', 1);
        $this->assertSame($original, Questions::find($existing->id)->corAnswer);

        $created = (new QuizWorkbookImport())->commit($path, [
            2 => 'create_new',
            3 => 'skip',
        ], $this->admin->id);
        $this->assertTrue($created['written']);
        $this->assertDatabaseCount('questions', 2);
        $this->assertNotSame($existing->id, $created['created'][0]['question_id']);
        $this->assertSame($original, Questions::find($existing->id)->corAnswer);
    }

    public function test_media_reference_uses_file_management_name_and_type_and_storage_url(): void
    {
        $id = DB::table('file_management')->insertGetId([
            'name' => 'bird',
            'type' => 'mp3',
            'hashName' => 'abc.mp3',
            'path' => 'files_maanger/abc.mp3',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $row = $this->fullRow();
        $row[5] = 'bird.mp3';
        $missing = $this->fullRow();
        $missing[6] = 'Another question stem for media miss';
        $missing[9] = '';
        $missing[5] = 'missing.mp3';
        $path = $this->workbook([$row, $missing]);

        $preview = (new QuizWorkbookImport())->preview($path);

        $this->assertFalse($preview['valid']);
        $this->assertSame($id, $preview['rows'][0]['fields']['media']['primary_head_audio']['file_management_id']);
        $this->assertStringContainsString('/storage/files_maanger/abc.mp3', $preview['rows'][0]['fields']['media']['primary_head_audio']['resolved_url']);
        $this->assertSame('error', $preview['rows'][1]['status']);
        $this->assertDatabaseCount('file_management', 1);

        $result = (new QuizWorkbookImport())->commit($path, [], $this->admin->id);
        $this->assertFalse($result['written']);
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_commit_rolls_back_the_question_and_the_side_row_together(): void
    {
        $path = $this->workbook([$this->fullRow(), $this->secondRow()]);
        $seen = 0;
        Questions::creating(function () use (&$seen) {
            $seen++;
            if ($seen === 2) {
                throw new \RuntimeException('forced failure');
            }
        });

        try {
            (new QuizWorkbookImport())->commit($path, [], $this->admin->id);
            $this->fail('Commit should rethrow after rollback.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('forced failure', $exception->getMessage());
        }

        $this->assertDatabaseCount('questions', 0);
        $this->assertDatabaseCount('quiz_workbook_fields', 0);
    }

    public function test_admin_routes_require_admin_and_add_questions_permission(): void
    {
        $preview = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/quiz_workbook/preview';
        });
        $commit = collect(Route::getRoutes())->first(function ($route) {
            return $route->uri() === 'api/quiz_workbook/commit';
        });

        $this->assertNotNull($preview);
        $this->assertNotNull($commit);
        $this->assertContains('quizLibraryAdminOnly', $preview->gatherMiddleware());
        $this->assertContains('can:add-questions', $preview->gatherMiddleware());
        $this->assertContains('checkUserToken:admin-api', $preview->gatherMiddleware());
        $this->assertContains('quizLibraryAdminOnly', $commit->gatherMiddleware());
        $this->assertContains('can:add-questions', $commit->gatherMiddleware());

        $path = $this->workbook([$this->fullRow()]);
        $upload = new UploadedFile(
            $path,
            'quiz.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $teacher = User::create([
            'name' => 'Workbook Teacher',
            'email' => 'workbook-teacher@test.com',
            'phone' => '01000000002',
            'password' => bcrypt('password'),
            'type' => 'teacher',
        ]);

        $this->withHeaders($this->staffHeaders($teacher))
            ->post('/api/quiz_workbook/preview', ['file' => $upload])
            ->assertStatus(403);

        $this->withHeaders($this->staffHeaders($this->admin))
            ->post('/api/quiz_workbook/preview', ['file' => $upload])
            ->assertStatus(403);

        $permission = Permission::create(['name' => 'add-questions', 'guard_name' => 'admin-api']);
        $this->admin->givePermissionTo($permission);

        $response = $this->withHeaders($this->staffHeaders($this->admin))
            ->post('/api/quiz_workbook/preview', ['file' => $upload]);

        $response->assertStatus(200);
        $response->assertJsonPath('preview.valid', true);
        $this->assertDatabaseCount('questions', 0);
        $this->assertArrayNotHasKey('question', $response->json());
    }

    public function test_a_numeric_row_without_curriculum_is_reported_and_only_the_legend_is_skipped(): void
    {
        $numeric = array_fill(0, 26, null);
        $numeric[15] = 9;
        $numeric[18] = 8;
        $path = $this->workbook([$this->legendRow(), $numeric]);

        $preview = (new QuizWorkbookImport())->preview($path);

        $this->assertFalse($preview['valid']);
        $this->assertCount(1, $preview['rows']);
        $this->assertSame(3, $preview['rows'][0]['row']);
        $this->assertSame('error', $preview['rows'][0]['status']);
        $this->assertStringContainsString('Subject was not found.', implode(' ', $preview['rows'][0]['errors']));

        $result = (new QuizWorkbookImport())->commit($path, [], $this->admin->id);
        $this->assertFalse($result['written']);
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_the_original_template_has_no_questions_and_skips_the_instruction_row(): void
    {
        $path = base_path('../abutabl-admin/public/quiz.xlsx');
        $this->assertFileExists($path);

        $preview = (new QuizWorkbookImport())->preview($path);

        $this->assertFalse($preview['valid']);
        $this->assertSame([], $preview['rows']);
        $this->assertSame(['The workbook contains no questions to import.'], $preview['file_errors']);
        $encoded = json_encode($preview);
        $this->assertStringNotContainsString('Subject was not found.', $encoded);
        $this->assertStringNotContainsString('Question Type must be MCQ, TF, SHN, or Matching.', $encoded);
        $this->assertStringNotContainsString('Correct Answer is required.', $encoded);

        $result = (new QuizWorkbookImport())->commit($path, [], $this->admin->id);
        $this->assertFalse($result['written']);
        $this->assertSame('The workbook contains no questions to import.', $result['message']);
        $this->assertDatabaseCount('questions', 0);
        $this->assertDatabaseCount('quizes', 0);
    }

    public function test_a_real_question_row_is_still_validated_when_the_instruction_and_blank_rows_are_present(): void
    {
        $instruction = array_fill(0, 26, null);
        $instruction[6] = QuizWorkbookImport::TEMPLATE_INSTRUCTION_HEAD;
        $blank = array_fill(0, 26, null);
        $partial = array_fill(0, 26, null);
        $partial[6] = 'A real stem with missing fields';
        $path = $this->workbook([$this->legendRow(), $instruction, $blank, $partial]);

        $preview = (new QuizWorkbookImport())->preview($path);

        $this->assertFalse($preview['valid']);
        $this->assertSame([], $preview['file_errors']);
        $this->assertCount(1, $preview['rows']);
        $this->assertSame(5, $preview['rows'][0]['row']);
        $this->assertSame('error', $preview['rows'][0]['status']);
        $errors = implode(' ', $preview['rows'][0]['errors']);
        $this->assertStringContainsString('Subject was not found.', $errors);
        $this->assertStringContainsString('Question Type must be MCQ, TF, SHN, or Matching.', $errors);
        $this->assertStringContainsString('Correct Answer is required.', $errors);

        $this->assertFalse((new QuizWorkbookImport())->commit($path, [], $this->admin->id)['written']);
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_the_instruction_sentence_is_a_question_when_another_cell_is_filled(): void
    {
        $row = $this->fullRow();
        $row[6] = QuizWorkbookImport::TEMPLATE_INSTRUCTION_HEAD;
        $row[3] = '';
        $path = $this->workbook([$row]);

        $preview = (new QuizWorkbookImport())->preview($path);

        $this->assertCount(1, $preview['rows']);
        $this->assertSame('error', $preview['rows'][0]['status']);
        $this->assertStringContainsString(
            'Question Type must be MCQ, TF, SHN, or Matching.',
            implode(' ', $preview['rows'][0]['errors'])
        );
    }

    public function test_answer1_and_answer2_are_required_for_every_question_type_and_answer3_is_optional(): void
    {
        $missing = $this->fullRow();
        $missing[18] = '';
        $missingPath = $this->workbook([$missing]);
        $missingPreview = (new QuizWorkbookImport())->preview($missingPath);
        $this->assertSame('error', $missingPreview['rows'][0]['status']);
        $this->assertStringContainsString('Answer2 Text is required.', implode(' ', $missingPreview['rows'][0]['errors']));
        $this->assertFalse((new QuizWorkbookImport())->commit($missingPath, [], $this->admin->id)['written']);
        $this->assertDatabaseCount('questions', 0);

        foreach (['MCQ', 'TF', 'SHN', 'Matching'] as $type) {
            $row = $this->fullRow();
            $row[3] = $type;
            $row[9] = 'Stem for '.$type;
            if ($type === 'Matching') {
                $row[12] = '1|2';
            }
            $row[21] = '';
            $row[24] = '';
            $preview = (new QuizWorkbookImport())->preview($this->workbook([$row]));
            $this->assertSame('ok', $preview['rows'][0]['status'], $type.' should accept empty answer3 and answer4');
        }
    }

    public function test_unsupported_type_missing_subject_and_long_title_are_row_errors(): void
    {
        $badType = $this->fullRow();
        $badType[3] = 'Essay';
        $typePreview = (new QuizWorkbookImport())->preview($this->workbook([$badType]));
        $this->assertSame('error', $typePreview['rows'][0]['status']);
        $this->assertStringContainsString('Question Type must be MCQ, TF, SHN, or Matching.', implode(' ', $typePreview['rows'][0]['errors']));

        $missingSubject = $this->fullRow();
        $missingSubject[0] = 'No Such Subject';
        $subjectPreview = (new QuizWorkbookImport())->preview($this->workbook([$missingSubject]));
        $this->assertSame('error', $subjectPreview['rows'][0]['status']);
        $this->assertStringContainsString('Subject was not found.', implode(' ', $subjectPreview['rows'][0]['errors']));

        $longTitle = $this->fullRow();
        $longTitle[4] = str_repeat('ا', 256);
        $titlePreview = (new QuizWorkbookImport())->preview($this->workbook([$longTitle]));
        $this->assertSame('error', $titlePreview['rows'][0]['status']);
        $this->assertStringContainsString('Title is longer than 255 characters.', implode(' ', $titlePreview['rows'][0]['errors']));

        $this->assertDatabaseCount('questions', 0);
    }

    public function test_answer_image_reference_is_stored_and_a_missing_reference_fails_the_row(): void
    {
        DB::table('file_management')->insert([
            'name' => 'cat',
            'type' => 'png',
            'hashName' => 'cat.png',
            'path' => 'files_maanger/cat.png',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $row = $this->fullRow();
        $row[14] = 'cat.png';
        $path = $this->workbook([$row]);

        $preview = (new QuizWorkbookImport())->preview($path);
        $this->assertTrue($preview['valid']);
        $this->assertSame('cat.png', $preview['rows'][0]['fields']['media']['answer1_image']['reference']);
        $this->assertStringContainsString('/storage/files_maanger/cat.png', $preview['rows'][0]['fields']['media']['answer1_image']['resolved_url']);

        $result = (new QuizWorkbookImport())->commit($path, [], $this->admin->id);
        $this->assertTrue($result['written']);
        $this->assertSame('cat.png', QuizWorkbookField::first()->answer1_image);
        $this->assertDatabaseCount('file_management', 1);

        $missing = $this->fullRow();
        $missing[9] = 'Different stem';
        $missing[23] = 'gone.jpg';
        $missingPreview = (new QuizWorkbookImport())->preview($this->workbook([$missing]));
        $this->assertSame('error', $missingPreview['rows'][0]['status']);
        $this->assertStringContainsString('answer4_image', implode(' ', $missingPreview['rows'][0]['errors']));
    }

    public function test_http_commit_saves_and_unauthenticated_requests_are_rejected(): void
    {
        $permission = Permission::create(['name' => 'add-questions', 'guard_name' => 'admin-api']);
        $this->admin->givePermissionTo($permission);
        $upload = $this->upload($this->workbook([$this->fullRow()]));

        $this->withHeaders($this->secretOnlyHeaders())
            ->post('/api/quiz_workbook/preview', ['file' => $upload])
            ->assertStatus(401);
        $this->withHeaders($this->secretOnlyHeaders())
            ->post('/api/quiz_workbook/commit', ['file' => $upload])
            ->assertStatus(401);
        $this->assertDatabaseCount('questions', 0);

        $response = $this->withHeaders($this->staffHeaders($this->admin))
            ->post('/api/quiz_workbook/commit', ['file' => $upload]);

        $response->assertStatus(200);
        $response->assertJsonPath('import_result.written', true);
        $this->assertArrayNotHasKey('question', $response->json());
        $this->assertDatabaseCount('questions', 1);
        $this->assertDatabaseCount('quiz_workbook_fields', 1);
    }

    public function test_http_commit_hides_exception_details_and_rolls_back(): void
    {
        $permission = Permission::create(['name' => 'add-questions', 'guard_name' => 'admin-api']);
        $this->admin->givePermissionTo($permission);
        $logged = false;
        \Illuminate\Support\Facades\Event::listen(
            \Illuminate\Log\Events\MessageLogged::class,
            function ($event) use (&$logged) {
                $exception = $event->context['exception'] ?? null;
                if ($exception instanceof \Throwable && $exception->getMessage() === 'forced failure') {
                    $logged = true;
                }
            }
        );
        $seen = 0;
        Questions::creating(function () use (&$seen) {
            $seen++;
            if ($seen === 2) {
                throw new \RuntimeException('forced failure');
            }
        });

        $response = $this->withHeaders($this->staffHeaders($this->admin))
            ->post('/api/quiz_workbook/commit', [
                'file' => $this->upload($this->workbook([$this->fullRow(), $this->secondRow()])),
            ]);

        $response->assertStatus(422);
        $body = (string) $response->getContent();
        $this->assertStringNotContainsString('forced failure', $body);
        $this->assertStringNotContainsString('SQLSTATE', $body);
        $this->assertStringNotContainsString('stack', strtolower($body));
        $response->assertJsonPath('import_result.written', false);
        $response->assertJsonPath('import_result.file_errors', []);
        $this->assertTrue($logged);
        $this->assertDatabaseCount('questions', 0);
        $this->assertDatabaseCount('quiz_workbook_fields', 0);
    }

    public function test_existing_migration_is_checked_and_a_different_table_is_left_unchanged(): void
    {
        require_once database_path('migrations/2026_11_18_140000_create_quiz_workbook_fields_table.php');
        $migration = new \CreateQuizWorkbookFieldsTable();
        $migration->up();
        $this->assertTrue(Schema::hasColumn('quiz_workbook_fields', 'import_title'));

        Schema::disableForeignKeyConstraints();
        Schema::drop('quiz_workbook_fields');
        Schema::enableForeignKeyConstraints();
        Schema::create('quiz_workbook_fields', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('unexpected')->nullable();
        });

        try {
            $migration->up();
            $this->fail('A different existing table must stop the migration.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('does not match the required structure', $exception->getMessage());
            $this->assertStringContainsString('without changing the table', $exception->getMessage());
        }

        $this->assertTrue(Schema::hasColumn('quiz_workbook_fields', 'unexpected'));
        $this->assertFalse(Schema::hasColumn('quiz_workbook_fields', 'question_id'));
        $this->assertFalse(Schema::hasColumn('quiz_workbook_fields', 'import_title'));
    }

    public function test_existing_import_classes_are_not_replaced(): void
    {
        $this->assertTrue(class_exists(QuestionsImport::class));
        $this->assertTrue(class_exists(ActivityQuestionsImport::class));
        $questionsController = file_get_contents(app_path('Http/Controllers/Api/AdminControllers/QuestionsController.php'));
        $activityController = file_get_contents(app_path('Http/Controllers/Api/AdminControllers/ActivityLessonsController.php'));
        $this->assertStringContainsString('QuestionsImport', $questionsController);
        $this->assertStringNotContainsString('QuizWorkbookImport', $questionsController);
        $this->assertStringContainsString('ActivityQuestionsImport', $activityController);
        $this->assertStringNotContainsString('QuizWorkbookImport', $activityController);
    }

    public function test_correct_answer_format_follows_the_question_type(): void
    {
        $cases = [
            ['MCQ', '3', 'ok', null],
            ['MCQ', 'Bird', 'ok', null],
            ['MCQ', '5', 'error', 'choice number from 1 to 4'],
            ['MCQ', 'cat', 'error', 'exact text of one answer'],
            ['MCQ', '1,2', 'error', 'choice number from 1 to 4'],
            ['TF', ' Yes ', 'ok', null],
            ['TF', 'FALSE', 'ok', null],
            ['TF', '0', 'ok', null],
            ['TF', 't', 'error', '1, 0, true, false, yes, or no'],
            ['TF', 'maybe', 'error', '1, 0, true, false, yes, or no'],
            ['SHN', 'أي نص', 'ok', null],
            ['SHN', '   ', 'error', 'Correct Answer is required.'],
            ['Matching', '2|1, 1|2', 'ok', null],
            ['Matching', '1|2,1|3', 'error', 'cannot repeat either side'],
            ['Matching', '1|2,3|2', 'error', 'cannot repeat either side'],
            ['Matching', '1:2,2:1', 'error', 'pairs like 1|2,2|1'],
            ['Matching', '1|5,2|1', 'error', 'pairs like 1|2,2|1'],
        ];

        foreach ($cases as [$type, $correct, $status, $message]) {
            $row = $this->fullRow();
            $row[3] = $type;
            $row[12] = $correct;
            $preview = (new QuizWorkbookImport())->preview($this->workbook([$row]));
            $parsed = $preview['rows'][0];

            $this->assertSame($status, $parsed['status'], $type.' '.$correct);
            if ($status === 'ok') {
                $this->assertSame(trim((string) $correct), $parsed['fields']['corAnswer']);
                $this->assertSame([], $parsed['errors']);
            } else {
                $this->assertStringContainsString($message, implode(' ', $parsed['errors']));
            }
        }

        $this->assertDatabaseCount('questions', 0);
    }

    private function buildPrivateSchema(): void
    {
        Schema::dropAllTables();

        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('password')->nullable();
            $table->string('type')->nullable();
            $table->timestamps();
        });
        Schema::create('subjects', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->nullable();
            $table->string('name_ar')->nullable();
            $table->timestamps();
        });
        Schema::create('units', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->nullable();
            $table->string('name_ar')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->timestamps();
        });
        Schema::create('lessons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name_en')->nullable();
            $table->string('name_ar')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->timestamps();
        });
        Schema::create('questions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type')->nullable();
            $table->string('code')->nullable();
            $table->longText('question')->nullable();
            $table->longText('corAnswer')->nullable();
            $table->longText('answer1')->nullable();
            $table->longText('answer2')->nullable();
            $table->longText('answer3')->nullable();
            $table->longText('answer4')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
        Schema::create('quiz_workbook_fields', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('question_id');
            $table->string('import_title', 255)->nullable();
            $table->longText('primary_head_text')->nullable();
            $table->longText('primary_content_text')->nullable();
            $table->longText('secondary_head_text')->nullable();
            $table->string('primary_head_audio', 255)->nullable();
            $table->string('primary_content_audio', 255)->nullable();
            $table->string('primary_content_image', 255)->nullable();
            $table->string('secondary_head_audio', 255)->nullable();
            $table->string('answer1_audio', 255)->nullable();
            $table->string('answer1_image', 255)->nullable();
            $table->string('answer2_audio', 255)->nullable();
            $table->string('answer2_image', 255)->nullable();
            $table->string('answer3_audio', 255)->nullable();
            $table->string('answer3_image', 255)->nullable();
            $table->string('answer4_audio', 255)->nullable();
            $table->string('answer4_image', 255)->nullable();
            $table->timestamps();
            $table->unique('question_id');
            $table->foreign('question_id')->references('id')->on('questions')->onDelete('cascade');
        });
        Schema::create('file_management', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->nullable();
            $table->string('hashName')->nullable();
            $table->string('type')->nullable();
            $table->string('path')->nullable();
            $table->timestamps();
        });
        Schema::create('quizes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title_en')->nullable();
            $table->string('title_ar')->nullable();
            $table->string('status')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('navigation_method')->nullable();
            $table->string('questions_per_page')->nullable();
            $table->string('score_method')->nullable();
            $table->double('score_to_pass')->nullable();
            $table->string('unlimited_attempts')->nullable();
            $table->integer('num_attempts')->nullable();
            $table->string('notify_student')->nullable();
            $table->string('notify_about_submission')->nullable();
            $table->string('notify_about_late_submission')->nullable();
            $table->string('reminder_before_due_date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->integer('time_limit')->nullable();
            $table->string('type_time')->nullable();
            $table->unsignedBigInteger('activity_lesson_id')->nullable();
            $table->timestamps();
        });
        Schema::create('quizes_questions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('quize_id')->nullable();
            $table->unsignedBigInteger('question_id')->nullable();
            $table->double('score')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
        Schema::create('quiz_versions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedInteger('version_number');
            $table->string('status', 32)->default('draft');
            $table->char('content_hash', 64)->nullable();
            $table->json('settings_frozen')->nullable();
            $table->unsignedBigInteger('published_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('source_definition_updated_at')->nullable();
            $table->timestamps();
            $table->foreign('quiz_id')->references('id')->on('quizes');
            $table->foreign('published_by')->references('id')->on('users');
        });
        Schema::create('quiz_snapshots', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('quiz_version_id');
            $table->unsignedBigInteger('quiz_id');
            $table->char('content_hash', 64)->nullable();
            $table->json('payload');
            $table->unsignedInteger('item_count')->default(0);
            $table->timestamps();
            $table->foreign('quiz_version_id')->references('id')->on('quiz_versions');
            $table->foreign('quiz_id')->references('id')->on('quizes');
        });
        Schema::create('subject_activities', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->timestamps();
        });
        Schema::create('activity_lessons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name_en')->nullable();
            $table->string('name_ar')->nullable();
            $table->unsignedBigInteger('subject_activity_id')->nullable();
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->timestamps();
        });
        Schema::create('permissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();
        });
        Schema::create('model_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->primary(['permission_id', 'model_id', 'model_type']);
        });
        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->primary(['role_id', 'model_id', 'model_type']);
        });
        Schema::create('role_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->unsignedBigInteger('role_id');
            $table->primary(['permission_id', 'role_id']);
        });
    }

    /**
     * @param  array<int, array<int, mixed>>  $dataRows
     * @param  array<int, string>|null  $headers
     */
    private function workbook(array $dataRows, ?array $headers = null): string
    {
        $sheet = (new Spreadsheet())->getActiveSheet();
        $headers = $headers ?? QuizWorkbookImport::HEADERS;
        foreach ($headers as $index => $header) {
            $sheet->setCellValueByColumnAndRow($index + 1, 1, $header);
        }
        $excelRow = 2;
        foreach ($dataRows as $row) {
            foreach ($row as $index => $value) {
                if ($value !== null && $value !== '') {
                    $sheet->setCellValueByColumnAndRow($index + 1, $excelRow, $value);
                }
            }
            $excelRow++;
        }
        $path = storage_path('app/temp/quiz_workbook_'.uniqid('', true).'.xlsx');
        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        (new Xlsx($sheet->getParent()))->save($path);

        return $path;
    }

    /**
     * @return array<int, mixed>
     */
    private function fullRow(): array
    {
        $row = array_fill(0, 26, null);
        $row[0] = 'Arabic';
        $row[1] = 'Unit 1';
        $row[2] = 'Lesson 1';
        $row[3] = 'MCQ';
        $row[4] = 'Letter quiz';
        $row[6] = 'See the letter';
        $row[9] = 'Look at the letter.';
        $row[12] = '1';
        $row[15] = 'Cat';
        $row[18] = 'Dog';
        $row[21] = 'Bird';
        $row[24] = 'Fish';
        $row[25] = 'RF.K.1';

        return $row;
    }

    /**
     * @return array<int, mixed>
     */
    private function secondRow(): array
    {
        $row = $this->fullRow();
        $row[6] = 'Second head';
        $row[9] = 'Second question stem';
        $row[12] = '2';
        $row[15] = 'A';
        $row[18] = 'B';
        $row[21] = 'C';
        $row[24] = 'D';

        return $row;
    }

    /**
     * @return array<int, mixed>
     */
    private function legendRow(): array
    {
        $row = array_fill(0, 26, null);
        $row[5] = 1;
        $row[6] = 2;
        $row[7] = 3;
        $row[8] = 4;
        $row[9] = 5;
        $row[10] = 6;
        $row[11] = 7;
        $row[13] = 1.1;
        $row[14] = 1.2;
        $row[15] = 1.3;
        $row[16] = 2.1;
        $row[17] = 2.2;
        $row[18] = 2.3;
        $row[19] = 3.1;
        $row[20] = 3.2;
        $row[21] = 3.3;
        $row[22] = 4.1;
        $row[23] = 4.2;
        $row[24] = 4.3;
        $row[25] = 8;

        return $row;
    }

    private function quizActivityLesson(string $name): int
    {
        $activityId = DB::table('subject_activities')->insertGetId([
            'type' => 'quizzes',
            'subject_id' => $this->subject->id,
            'unit_id' => $this->unit->id,
        ]);

        return (int) DB::table('activity_lessons')->insertGetId([
            'name_en' => $name,
            'name_ar' => $name,
            'subject_activity_id' => $activityId,
            'lesson_id' => $this->lesson->id,
        ]);
    }

    private function seedQuestion(string $question, string $correct, string $a1, string $a2, string $a3, string $a4): Questions
    {
        return Questions::create([
            'subject_id' => $this->subject->id,
            'unit_id' => $this->unit->id,
            'lesson_id' => $this->lesson->id,
            'type' => 'MCQ',
            'question' => $question,
            'corAnswer' => $correct,
            'answer1' => $a1,
            'answer2' => $a2,
            'answer3' => $a3 !== '' ? $a3 : null,
            'answer4' => $a4 !== '' ? $a4 : null,
            'created_by' => $this->admin->id,
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function secretOnlyHeaders(): array
    {
        return [
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ];
    }

    private function upload(string $path): UploadedFile
    {
        return new UploadedFile(
            $path,
            'quiz.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );
    }

    /**
     * @return array<string, string>
     */
    private function staffHeaders(User $user): array
    {
        auth()->setDefaultDriver('admin-api');
        $token = Auth::guard('admin-api')->login($user);

        return [
            'Authorization' => 'Bearer '.$token,
            'Authorizations' => 'Bearer '.$token,
            'apiSecret' => (string) env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Accept' => 'application/json',
        ];
    }
}
