<?php

namespace Tests\Feature\LiveGames;

use App\Support\LiveCompetitions\LiveCompetitionCatalogService;
use App\Support\LiveCompetitions\LiveCompetitionWorkbookBuilder;
use App\Support\LiveCompetitions\LiveCompetitionWorkbookParser;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\Support\FakeLiveCompetitionMediaResolver;
use Tests\TestCase;

class LiveCompetitionsCatalogParserTest extends TestCase
{
    /** @var string[] */
    private $tempFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
        parent::tearDown();
    }

    public function test_template_contains_game_and_question_columns(): void
    {
        $spreadsheet = LiveCompetitionWorkbookBuilder::spreadsheet();
        $this->assertNotNull($spreadsheet->getSheetByName('Game'));
        $this->assertNotNull($spreadsheet->getSheetByName('Questions'));
        $this->assertNotNull($spreadsheet->getSheetByName('Readme'));

        $gameHeaders = $spreadsheet->getSheetByName('Game')->rangeToArray('A1:F1')[0];
        $this->assertSame(LiveCompetitionWorkbookParser::GAME_HEADERS, array_map('strval', $gameHeaders));

        $questionHeaders = $spreadsheet->getSheetByName('Questions')->rangeToArray('A1:K1')[0];
        $this->assertSame(LiveCompetitionWorkbookParser::QUESTION_HEADERS, array_map('strval', $questionHeaders));
    }

    public function test_valid_text_workbook_parses_unpublished_payload(): void
    {
        $path = $this->writeWorkbook(
            [['Classic', '10:00', '', 'classic', 1, '']],
            [[1, 'What do we need to start a campfire?', '', '', 'text', 'Wood', 'Sun', 'Rocks', 'Wood', 'Leaves', 'Fuel']]
        );

        $result = $this->parser()->parse($path);

        $this->assertTrue($result['valid'], json_encode($result['errors']));
        $this->assertSame('Classic', $result['game']['name']);
        $this->assertSame(0, $result['game']['status']);
        $this->assertSame('Wood', $result['questions'][0]['correct_answer']);
        $this->assertNull($result['questions'][0]['image']);
        $this->assertNull($result['questions'][0]['voice_url']);
    }

    public function test_invalid_game_type_is_rejected(): void
    {
        $path = $this->writeWorkbook(
            [['Classic', '10:00', '', 'scorm', 1, '']],
            [[1, 'Q', '', '', 'text', 'A', 'A', 'B', 'C', 'D', '']]
        );

        $result = $this->parser()->parse($path);
        $this->assertFalse($result['valid']);
        $this->assertTrue($this->hasError($result, 'type'));
    }

    public function test_invalid_answer_type_and_nonmatching_correct_answer_are_rejected(): void
    {
        $path = $this->writeWorkbook(
            [['Classic', '10:00', '', 'classic', '', '']],
            [
                [1, 'Q1', '', '', 'audio', 'A', 'A', 'B', 'C', 'D', ''],
                [2, 'Q2', '', '', 'text', 'Z', 'A', 'B', 'C', 'D', ''],
            ]
        );

        $result = $this->parser()->parse($path);
        $this->assertFalse($result['valid']);
        $this->assertTrue($this->hasError($result, 'answer_type'));
        $this->assertTrue($this->hasError($result, 'correct_answer'));
    }

    public function test_image_questions_require_image_and_resolvable_media(): void
    {
        $path = $this->writeWorkbook(
            [['Classic', '10:00', '', 'classic', '', '']],
            [[1, 'Who is that animal', '', '', 'image', 'monkey.png', 'bog.png', 'monkey.png', 'cat.png', 'rat.png', '']]
        );

        $result = $this->parser()->parse($path);
        $this->assertFalse($result['valid']);
        $this->assertTrue($this->hasError($result, 'image'));
    }

    public function test_missing_and_ambiguous_media_fail_closed(): void
    {
        $media = $this->media([
            ['id' => 1, 'name' => 'monkey', 'type' => 'png', 'hashName' => 'a.png', 'path' => 'files_maanger/a.png'],
            ['id' => 2, 'name' => 'monkey', 'type' => 'png', 'hashName' => 'b.png', 'path' => 'files_maanger/b.png'],
        ]);
        $path = $this->writeWorkbook(
            [['Classic', '10:00', 'missing-logo.png', 'classic', '', '']],
            [[1, 'Q', 'monkey.png', '', 'image', 'monkey.png', 'bog.png', 'monkey.png', 'cat.png', 'rat.png', '']]
        );

        $result = (new LiveCompetitionWorkbookParser($media))->parse($path);
        $this->assertFalse($result['valid']);
        $this->assertTrue($this->hasError($result, 'logo'));
        $this->assertTrue($this->hasError($result, 'image') || $this->hasError($result, 'answer1') || $this->hasError($result, 'correct_answer'));
    }

    public function test_duplicate_sort_order_is_rejected(): void
    {
        $path = $this->writeWorkbook(
            [['Classic', '10:00', '', 'classic', '', '']],
            [
                [1, 'Q1', '', '', 'text', 'A', 'A', 'B', 'C', 'D', ''],
                [1, 'Q2', '', '', 'text', 'B', 'A', 'B', 'C', 'D', ''],
            ]
        );

        $result = $this->parser()->parse($path);
        $this->assertFalse($result['valid']);
        $this->assertTrue($this->hasError($result, 'sort_order'));
    }

    public function test_preview_token_changes_when_workbook_changes(): void
    {
        $path = $this->writeWorkbook(
            [['Classic', '10:00', '', 'classic', '', '']],
            [[1, 'Q1', '', '', 'text', 'A', 'A', 'B', 'C', 'D', '']]
        );
        $service = new LiveCompetitionCatalogService($this->parser());
        $first = $service->preview($path, 1);
        $this->assertTrue($first['valid']);
        $this->assertNotEmpty($first['preview_token']);

        $other = $this->writeWorkbook(
            [['Hacking', '10:00', '', 'hacking', '', '']],
            [[1, 'Q1', '', '', 'text', 'A', 'A', 'B', 'C', 'D', '']]
        );
        $second = $service->preview($other, 1);
        $this->assertNotSame($first['preview_token'], $second['preview_token']);
    }

    public function test_standalone_asset_path_is_not_accepted_unless_registered(): void
    {
        $path = $this->writeWorkbook(
            [['Classic', '10:00', '/assets/images/aboutabl-bird.svg', 'classic', '', '']],
            [[1, 'Q', '', '', 'text', 'A', 'A', 'B', 'C', 'D', '']]
        );

        $result = $this->parser()->parse($path);
        $this->assertFalse($result['valid']);
        $this->assertTrue($this->hasError($result, 'logo'));
    }

    /**
     * @param  list<array<int,mixed>>  $gameRows
     * @param  list<array<int,mixed>>  $questionRows
     */
    private function writeWorkbook(array $gameRows, array $questionRows): string
    {
        $spreadsheet = new Spreadsheet();
        $game = $spreadsheet->getActiveSheet();
        $game->setTitle('Game');
        $game->fromArray([LiveCompetitionWorkbookParser::GAME_HEADERS], null, 'A1');
        $game->fromArray($gameRows, null, 'A2');

        $questions = new Worksheet($spreadsheet, 'Questions');
        $spreadsheet->addSheet($questions);
        $questions->fromArray([LiveCompetitionWorkbookParser::QUESTION_HEADERS], null, 'A1');
        $questions->fromArray($questionRows, null, 'A2');

        $path = tempnam(sys_get_temp_dir(), 'live-wb-').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);
        $this->tempFiles[] = $path;

        return $path;
    }

    private function parser(?FakeLiveCompetitionMediaResolver $media = null): LiveCompetitionWorkbookParser
    {
        return new LiveCompetitionWorkbookParser($media ?: $this->media());
    }

    /**
     * @param  list<array<string,mixed>>  $files
     */
    private function media(array $files = []): FakeLiveCompetitionMediaResolver
    {
        $media = new FakeLiveCompetitionMediaResolver();
        $media->files = $files;

        return $media;
    }

    /**
     * @param  array{errors:list<array<string,mixed>>}  $result
     */
    private function hasError(array $result, string $field): bool
    {
        foreach ($result['errors'] as $error) {
            if (($error['field'] ?? '') === $field) {
                return true;
            }
        }

        return false;
    }
}
