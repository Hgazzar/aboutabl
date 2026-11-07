<?php

namespace Tests\Feature\LiveGames;

use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use App\Models\LiveGameSchool;
use App\Support\LiveCompetitions\LiveCompetitionCatalogService;
use App\Support\LiveCompetitions\LiveCompetitionWorkbookParser;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\Support\FakeLiveCompetitionMediaResolver;
use Tests\TestCase;
use Throwable;

/**
 * Uses a disposable sqlite memory connection. Does not run artisan migrate
 * and does not write to the application MySQL database.
 */
class LiveCompetitionsCatalogPersistTest extends TestCase
{
    /** @var string */
    private $previousDefault;

    /** @var string[] */
    private $tempFiles = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousDefault = config('database.default');
        config([
            'database.connections.live_competitions_test' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                'foreign_key_constraints' => true,
            ],
            'database.default' => 'live_competitions_test',
        ]);
        DB::purge('live_competitions_test');
        DB::reconnect('live_competitions_test');
        $this->createSchema();
    }

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
        config(['database.default' => $this->previousDefault]);
        DB::purge('live_competitions_test');
        parent::tearDown();
    }

    public function test_confirm_persists_unpublished_game_without_school_entitlements(): void
    {
        $path = $this->validWorkbook();
        $service = $this->service();
        $preview = $service->preview($path, 1);
        $this->assertTrue($preview['valid'], json_encode($preview['errors']));

        $game = $service->confirm($path, $preview['preview_token'], 1);

        $this->assertSame(LiveGame::STATUS_UNPUBLISHED, (int) $game->status);
        $this->assertFalse($game->isPublished());
        $this->assertSame(1, LiveGame::count());
        $this->assertSame(1, LiveGameQuestion::count());
        $this->assertSame(0, LiveGameSchool::count());
        $this->assertFalse($game->isSelectableForSchool(1));
        $this->assertFalse($game->isSelectableForSchool(99));
    }

    public function test_preview_does_not_write_catalog_rows(): void
    {
        $path = $this->validWorkbook();
        $this->service()->preview($path, 1);

        $this->assertSame(0, LiveGame::count());
        $this->assertSame(0, LiveGameQuestion::count());
        $this->assertSame(0, LiveGameSchool::count());
    }

    public function test_failed_import_rolls_back_all_records(): void
    {
        $path = $this->validWorkbook();
        $service = $this->service();
        $preview = $service->preview($path, 1);

        LiveGameQuestion::creating(function () {
            throw new \RuntimeException('forced failure');
        });

        try {
            $service->confirm($path, $preview['preview_token'], 1);
            $this->fail('Confirm should have thrown.');
        } catch (Throwable $e) {
            $this->assertSame('forced failure', $e->getMessage());
        } finally {
            LiveGameQuestion::flushEventListeners();
        }

        $this->assertSame(0, LiveGame::count());
        $this->assertSame(0, LiveGameQuestion::count());
    }

    public function test_publish_does_not_grant_school_access(): void
    {
        DB::table('schools')->insert(['id' => 5, 'name' => 'Alpha']);
        $path = $this->validWorkbook();
        $service = $this->service();
        $preview = $service->preview($path, 1);
        $game = $service->confirm($path, $preview['preview_token'], 1);
        $published = $service->publish($game);

        $this->assertTrue($published->isPublished());
        $this->assertSame(0, LiveGameSchool::count());
        $this->assertFalse($published->isSelectableForSchool(5));
    }

    public function test_empty_entitlements_authorize_no_schools_and_duplicates_are_rejected(): void
    {
        DB::table('schools')->insert(['id' => 5, 'name' => 'Alpha']);
        DB::table('schools')->insert(['id' => 6, 'name' => 'Beta']);
        $path = $this->validWorkbook();
        $service = $this->service();
        $preview = $service->preview($path, 1);
        $game = $service->confirm($path, $preview['preview_token'], 1);
        $service->publish($game);

        $this->assertFalse($game->fresh()->isSelectableForSchool(5));

        $updated = $service->replaceSchoolEntitlements($game, [5]);
        $this->assertTrue($updated->isSelectableForSchool(5));
        $this->assertFalse($updated->isSelectableForSchool(6));

        $cleared = $service->replaceSchoolEntitlements($updated, []);
        $this->assertSame(0, LiveGameSchool::count());
        $this->assertFalse($cleared->isSelectableForSchool(5));

        $this->expectException(\InvalidArgumentException::class);
        $service->replaceSchoolEntitlements($cleared, [5, 5]);
    }

    public function test_invalid_school_id_is_rejected(): void
    {
        $path = $this->validWorkbook();
        $service = $this->service();
        $preview = $service->preview($path, 1);
        $game = $service->confirm($path, $preview['preview_token'], 1);

        $this->expectException(\InvalidArgumentException::class);
        $service->replaceSchoolEntitlements($game, [999]);
    }

    public function test_confirm_replay_does_not_create_a_second_game(): void
    {
        $path = $this->validWorkbook();
        $service = $this->service();
        $preview = $service->preview($path, 1);
        $service->confirm($path, $preview['preview_token'], 1);

        try {
            $service->confirm($path, $preview['preview_token'], 1);
            $this->fail('Replay should fail.');
        } catch (Throwable $e) {
            $this->assertSame('Preview token has already been used.', $e->getMessage());
        }

        $this->assertSame(1, LiveGame::count());
        $this->assertSame(1, LiveGameQuestion::count());
    }

    public function test_unpublished_games_are_not_selectable_even_when_entitled(): void
    {
        DB::table('schools')->insert(['id' => 5, 'name' => 'Alpha']);
        $path = $this->validWorkbook();
        $service = $this->service();
        $preview = $service->preview($path, 1);
        $game = $service->confirm($path, $preview['preview_token'], 1);
        $service->replaceSchoolEntitlements($game, [5]);

        $this->assertFalse($game->fresh()->isPublished());
        $this->assertFalse($game->fresh()->isSelectableForSchool(5));
    }

    private function service(): LiveCompetitionCatalogService
    {
        $media = new FakeLiveCompetitionMediaResolver();

        return new LiveCompetitionCatalogService(new LiveCompetitionWorkbookParser($media));
    }

    private function validWorkbook(): string
    {
        $spreadsheet = new Spreadsheet();
        $game = $spreadsheet->getActiveSheet();
        $game->setTitle('Game');
        $game->fromArray([LiveCompetitionWorkbookParser::GAME_HEADERS], null, 'A1');
        $game->fromArray([['Classic', '10:00', '', 'classic', 1, '']], null, 'A2');
        $questions = new Worksheet($spreadsheet, 'Questions');
        $spreadsheet->addSheet($questions);
        $questions->fromArray([LiveCompetitionWorkbookParser::QUESTION_HEADERS], null, 'A1');
        $questions->fromArray([[1, 'What do we need to start a campfire?', '', '', 'text', 'Wood', 'Sun', 'Rocks', 'Wood', 'Leaves', 'Fuel']], null, 'A2');
        $path = tempnam(sys_get_temp_dir(), 'live-persist-').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);
        $this->tempFiles[] = $path;

        return $path;
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->string('name')->nullable();
            $table->timestamps();
        });
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('name_ar')->nullable();
            $table->timestamps();
        });
        Schema::create('live_games', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('time', 16)->default('05:00');
            $table->string('logo')->nullable();
            $table->string('type', 32)->nullable();
            $table->unsignedTinyInteger('level')->nullable();
            $table->string('background')->nullable();
            $table->unsignedTinyInteger('status')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
        Schema::create('live_game_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_id');
            $table->text('question')->nullable();
            $table->text('image')->nullable();
            $table->text('voice_url')->nullable();
            $table->string('correct_answer');
            $table->string('answer_type')->nullable();
            $table->string('answer1');
            $table->string('answer2');
            $table->string('answer3');
            $table->string('answer4');
            $table->text('explanation')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
        Schema::create('live_game_schools', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('live_game_id');
            $table->unsignedBigInteger('school_id');
            $table->timestamps();
            $table->unique(['live_game_id', 'school_id']);
        });
    }
}
