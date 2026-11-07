<?php

namespace App\Support\LiveCompetitions;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class LiveCompetitionWorkbookBuilder
{
    public const FILENAME = 'Live Competitions Template.xlsx';

    public static function spreadsheet(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();

        $readme = $spreadsheet->getActiveSheet();
        $readme->setTitle('Readme');
        $readmeLines = [
            ['Live Competitions catalog template'],
            ['Game-level metadata belongs on the Game sheet (exactly one data row).'],
            ['Question rows belong on the Questions sheet (one row per question).'],
            ['Media cells must match File Management as name.extension (example: monkey.png).'],
            ['Standalone /assets paths are not imported unless that file is already in File Management.'],
            ['Empty optional media cells are omitted. Filled cells that cannot be resolved are preview errors.'],
            ['Game type: classic | hacking | gold_quest'],
            ['answer_type: text | image. image requires question image plus four image answers.'],
            ['correct_answer must exactly equal one of answer1–answer4 after media resolution.'],
            ['Imported games are unpublished and have no school entitlements.'],
        ];
        $readme->fromArray($readmeLines, null, 'A1');
        $readme->getColumnDimension('A')->setWidth(110);

        $game = new Worksheet($spreadsheet, 'Game');
        $spreadsheet->addSheet($game);
        $game->fromArray([LiveCompetitionWorkbookParser::GAME_HEADERS], null, 'A1');
        $game->fromArray([[
            'Classic',
            '10:00',
            'aboutabl-bird.svg',
            'classic',
            1,
            'classic-bg.jpg',
        ]], null, 'A2');
        foreach (range('A', 'F') as $col) {
            $game->getColumnDimension($col)->setAutoSize(true);
        }

        $questions = new Worksheet($spreadsheet, 'Questions');
        $spreadsheet->addSheet($questions);
        $questions->fromArray([LiveCompetitionWorkbookParser::QUESTION_HEADERS], null, 'A1');
        $questions->fromArray([
            [
                1,
                'What do we need to start a campfire?',
                '',
                '',
                'text',
                'Wood',
                'Sun',
                'Rocks',
                'Wood',
                'Leaves',
                'Fire needs fuel such as wood.',
            ],
            [
                2,
                'Who is that animal',
                'monkey.png',
                '',
                'image',
                'monkey.png',
                'bog.png',
                'monkey.png',
                'cat.png',
                'rat.png',
                '',
            ],
        ], null, 'A2');
        foreach (range('A', 'K') as $col) {
            $questions->getColumnDimension($col)->setAutoSize(true);
        }

        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }
}
