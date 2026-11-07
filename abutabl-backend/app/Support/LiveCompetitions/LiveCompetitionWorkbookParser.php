<?php

namespace App\Support\LiveCompetitions;

use App\Models\LiveGame;
use App\Models\LiveGameQuestion;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class LiveCompetitionWorkbookParser
{
    public const GAME_HEADERS = ['name', 'time', 'logo', 'type', 'level', 'background'];

    public const QUESTION_HEADERS = [
        'sort_order',
        'question',
        'image',
        'voice_url',
        'answer_type',
        'correct_answer',
        'answer1',
        'answer2',
        'answer3',
        'answer4',
        'explanation',
    ];

    /** @var LiveCompetitionMediaResolver */
    protected $media;

    public function __construct(?LiveCompetitionMediaResolver $media = null)
    {
        $this->media = $media ?: new LiveCompetitionMediaResolver();
    }

    /**
     * @return array{valid:bool,errors:list<array<string,mixed>>,game:?array,questions:list<array>}
     */
    public function parse(string $path): array
    {
        $errors = [];
        $spreadsheet = IOFactory::load($path);

        $gameSheet = $spreadsheet->getSheetByName('Game');
        $questionSheet = $spreadsheet->getSheetByName('Questions');

        if (! $gameSheet) {
            $errors[] = $this->error('Game', null, 'sheet', 'Workbook must include a Game sheet for game-level metadata.');
        }
        if (! $questionSheet) {
            $errors[] = $this->error('Questions', null, 'sheet', 'Workbook must include a Questions sheet for question rows.');
        }

        $game = null;
        if ($gameSheet) {
            $parsedGame = $this->parseGameSheet($gameSheet, $errors);
            $game = $parsedGame;
        }

        $questions = [];
        if ($questionSheet) {
            $questions = $this->parseQuestionSheet($questionSheet, $errors);
        }

        if ($game !== null && $questions === [] && ! $this->hasSheetError($errors, 'Questions')) {
            $errors[] = $this->error('Questions', null, 'sheet', 'At least one valid question row is required.');
        }

        return [
            'valid' => $errors === [] && $game !== null && $questions !== [],
            'errors' => $errors,
            'game' => $game,
            'questions' => $questions,
        ];
    }

    /**
     * @param  list<array<string,mixed>>  $errors
     * @return array<string,mixed>|null
     */
    protected function parseGameSheet(Worksheet $sheet, array &$errors): ?array
    {
        $rows = $this->sheetAssocRows($sheet, self::GAME_HEADERS, 'Game', $errors);
        if ($rows === null) {
            return null;
        }

        $dataRows = [];
        foreach ($rows as $entry) {
            if ($this->rowIsEmpty($entry['values'], self::GAME_HEADERS)) {
                continue;
            }
            $dataRows[] = $entry;
        }

        if ($dataRows === []) {
            $errors[] = $this->error('Game', 2, 'name', 'Game sheet must contain one metadata row.');

            return null;
        }
        if (count($dataRows) > 1) {
            $errors[] = $this->error('Game', $dataRows[1]['row'], 'sheet', 'Game sheet must contain exactly one metadata row.');
        }

        $row = $dataRows[0];
        $values = $row['values'];
        $excelRow = $row['row'];

        $name = $this->stringValue($values['name'] ?? '');
        $time = $this->stringValue($values['time'] ?? '');
        $type = strtolower($this->stringValue($values['type'] ?? ''));
        $levelRaw = $this->stringValue($values['level'] ?? '');

        if ($name === '') {
            $errors[] = $this->error('Game', $excelRow, 'name', 'Game name is required.');
        }
        if ($time === '') {
            $errors[] = $this->error('Game', $excelRow, 'time', 'Game time is required (example: 10:00).');
        } elseif (! preg_match('/^\d{1,2}:\d{2}$/', $time)) {
            $errors[] = $this->error('Game', $excelRow, 'time', 'Game time must be mm:ss or h:mm (example: 10:00).');
        }
        if ($type === '' || ! in_array($type, LiveGame::TYPES, true)) {
            $errors[] = $this->error('Game', $excelRow, 'type', 'Game type must be classic, hacking, or gold_quest.');
        }

        $level = null;
        if ($levelRaw !== '') {
            if (! preg_match('/^\d+$/', $levelRaw) || (int) $levelRaw > 255) {
                $errors[] = $this->error('Game', $excelRow, 'level', 'Level must be an integer 0–255.');
            } else {
                $level = (int) $levelRaw;
            }
        }

        $logo = $this->media->resolve($this->stringValue($values['logo'] ?? ''), 'logo', false);
        if (! $logo['ok']) {
            $errors[] = $this->error('Game', $excelRow, 'logo', $logo['error']);
        }
        $background = $this->media->resolve($this->stringValue($values['background'] ?? ''), 'background', false);
        if (! $background['ok']) {
            $errors[] = $this->error('Game', $excelRow, 'background', $background['error']);
        }

        return [
            'name' => $name,
            'time' => $time !== '' ? $time : '05:00',
            'logo' => $logo['stored_path'],
            'type' => $type,
            'level' => $level,
            'background' => $background['stored_path'],
            'status' => LiveGame::STATUS_UNPUBLISHED,
        ];
    }

    /**
     * @param  list<array<string,mixed>>  $errors
     * @return list<array<string,mixed>>
     */
    protected function parseQuestionSheet(Worksheet $sheet, array &$errors): array
    {
        $rows = $this->sheetAssocRows($sheet, self::QUESTION_HEADERS, 'Questions', $errors);
        if ($rows === null) {
            return [];
        }

        $questions = [];
        $orders = [];
        foreach ($rows as $entry) {
            if ($this->rowIsEmpty($entry['values'], self::QUESTION_HEADERS)) {
                continue;
            }
            $parsed = $this->parseQuestionRow($entry['values'], $entry['row'], $errors);
            if ($parsed === null) {
                continue;
            }
            $order = $parsed['sort_order'];
            if (isset($orders[$order])) {
                $errors[] = $this->error('Questions', $entry['row'], 'sort_order', 'Question sort_order '.$order.' is duplicated.');
            }
            $orders[$order] = true;
            $questions[] = $parsed;
        }

        usort($questions, function ($a, $b) {
            return $a['sort_order'] <=> $b['sort_order'];
        });

        return $questions;
    }

    /**
     * @param  array<string,mixed>  $values
     * @param  list<array<string,mixed>>  $errors
     * @return array<string,mixed>|null
     */
    protected function parseQuestionRow(array $values, int $excelRow, array &$errors): ?array
    {
        $question = $this->stringValue($values['question'] ?? '');
        $answerType = strtolower($this->stringValue($values['answer_type'] ?? ''));
        $correct = $this->stringValue($values['correct_answer'] ?? '');
        $answers = [
            $this->stringValue($values['answer1'] ?? ''),
            $this->stringValue($values['answer2'] ?? ''),
            $this->stringValue($values['answer3'] ?? ''),
            $this->stringValue($values['answer4'] ?? ''),
        ];
        $sortRaw = $this->stringValue($values['sort_order'] ?? '');
        $explanation = $this->stringValue($values['explanation'] ?? '');
        $explanation = $explanation === '' ? null : $explanation;

        $rowHasError = false;
        if ($question === '') {
            $errors[] = $this->error('Questions', $excelRow, 'question', 'Question text is required.');
            $rowHasError = true;
        }
        if (! in_array($answerType, LiveGameQuestion::ANSWER_TYPES, true)) {
            $errors[] = $this->error('Questions', $excelRow, 'answer_type', 'answer_type must be text or image.');
            $rowHasError = true;
        }
        foreach (['answer1', 'answer2', 'answer3', 'answer4'] as $i => $field) {
            if ($answers[$i] === '') {
                $errors[] = $this->error('Questions', $excelRow, $field, $field.' is required.');
                $rowHasError = true;
            }
        }
        if ($correct === '') {
            $errors[] = $this->error('Questions', $excelRow, 'correct_answer', 'correct_answer is required.');
            $rowHasError = true;
        }

        $sortOrder = $excelRow - 1;
        if ($sortRaw !== '') {
            if (! preg_match('/^\d+$/', $sortRaw)) {
                $errors[] = $this->error('Questions', $excelRow, 'sort_order', 'sort_order must be a non-negative integer.');
                $rowHasError = true;
            } else {
                $sortOrder = (int) $sortRaw;
            }
        }

        $imageRequired = $answerType === 'image';
        $image = $this->media->resolve($this->stringValue($values['image'] ?? ''), 'image', $imageRequired);
        if (! $image['ok']) {
            $errors[] = $this->error('Questions', $excelRow, 'image', $image['error']);
            $rowHasError = true;
        }
        $voice = $this->media->resolve($this->stringValue($values['voice_url'] ?? ''), 'voice_url', false);
        if (! $voice['ok']) {
            $errors[] = $this->error('Questions', $excelRow, 'voice_url', $voice['error']);
            $rowHasError = true;
        }

        $resolvedAnswers = $answers;
        if ($answerType === 'image') {
            foreach (['answer1', 'answer2', 'answer3', 'answer4'] as $i => $field) {
                if ($answers[$i] === '') {
                    continue;
                }
                $resolved = $this->media->resolve($answers[$i], $field, true);
                if (! $resolved['ok']) {
                    $errors[] = $this->error('Questions', $excelRow, $field, $resolved['error']);
                    $rowHasError = true;
                    continue;
                }
                $resolvedAnswers[$i] = $resolved['stored_path'];
            }
            if ($correct !== '') {
                $resolvedCorrect = $this->media->resolve($correct, 'correct_answer', true);
                if (! $resolvedCorrect['ok']) {
                    $errors[] = $this->error('Questions', $excelRow, 'correct_answer', $resolvedCorrect['error']);
                    $rowHasError = true;
                } else {
                    $correct = $resolvedCorrect['stored_path'];
                }
            }
        }

        if (! $rowHasError && ! in_array($correct, $resolvedAnswers, true)) {
            $errors[] = $this->error(
                'Questions',
                $excelRow,
                'correct_answer',
                'correct_answer must exactly match one of answer1–answer4 (engine uses strict equality).'
            );
            $rowHasError = true;
        }

        if ($rowHasError) {
            return null;
        }

        return [
            'sort_order' => $sortOrder,
            'question' => $question,
            'image' => $image['stored_path'],
            'voice_url' => $voice['stored_path'],
            'answer_type' => $answerType,
            'correct_answer' => $correct,
            'answer1' => $resolvedAnswers[0],
            'answer2' => $resolvedAnswers[1],
            'answer3' => $resolvedAnswers[2],
            'answer4' => $resolvedAnswers[3],
            'explanation' => $explanation,
        ];
    }

    /**
     * @param  string[]  $expected
     * @param  list<array<string,mixed>>  $errors
     * @return list<array{row:int,values:array<string,mixed>}>|null
     */
    protected function sheetAssocRows(Worksheet $sheet, array $expected, string $sheetName, array &$errors): ?array
    {
        $highestRow = (int) $sheet->getHighestDataRow();
        $highestColumn = $sheet->getHighestDataColumn();
        $headerCells = $sheet->rangeToArray('A1:'.$highestColumn.'1', null, true, true, false);
        $headerRow = $headerCells[0] ?? [];
        $map = [];
        foreach ($headerRow as $index => $label) {
            $key = $this->normalizeHeader((string) $label);
            if ($key !== '') {
                $map[$key] = $index;
            }
        }

        $missing = false;
        foreach ($expected as $header) {
            if (! array_key_exists($header, $map)) {
                $errors[] = $this->error($sheetName, 1, $header, 'Missing required column "'.$header.'".');
                $missing = true;
            }
        }
        if ($missing) {
            return null;
        }

        $out = [];
        for ($r = 2; $r <= max(2, $highestRow); $r++) {
            $cells = $sheet->rangeToArray('A'.$r.':'.$highestColumn.$r, null, true, true, false);
            $line = $cells[0] ?? [];
            $values = [];
            foreach ($expected as $header) {
                $values[$header] = $line[$map[$header]] ?? null;
            }
            $out[] = ['row' => $r, 'values' => $values];
        }

        return $out;
    }

    /**
     * @param  array<string,mixed>  $values
     * @param  string[]  $keys
     */
    protected function rowIsEmpty(array $values, array $keys): bool
    {
        foreach ($keys as $key) {
            if ($this->stringValue($values[$key] ?? '') !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  mixed  $value
     */
    protected function stringValue($value): string
    {
        if ($value === null) {
            return '';
        }
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        if (is_float($value) || is_int($value)) {
            if (is_float($value) && $value > 0 && $value < 1) {
                $seconds = (int) round($value * 24 * 60 * 60);
                $minutes = intdiv($seconds, 60);
                $remain = $seconds % 60;

                return sprintf('%02d:%02d', $minutes, $remain);
            }
            if ((float) $value == (int) $value) {
                return (string) (int) $value;
            }

            return rtrim(rtrim(sprintf('%.8F', $value), '0'), '.');
        }

        return trim((string) $value);
    }

    protected function normalizeHeader(string $label): string
    {
        $key = strtolower(trim($label));
        $key = str_replace([' ', '-'], '_', $key);
        $aliases = [
            'game_name' => 'name',
            'voice' => 'voice_url',
            'audio' => 'voice_url',
            'order' => 'sort_order',
            'question_order' => 'sort_order',
            'mode' => 'type',
            'game_type' => 'type',
            'theme' => 'background',
            'correct' => 'correct_answer',
        ];

        return $aliases[$key] ?? $key;
    }

    /**
     * @param  list<array<string,mixed>>  $errors
     */
    protected function hasSheetError(array $errors, string $sheet): bool
    {
        foreach ($errors as $error) {
            if (($error['sheet'] ?? '') === $sheet) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array{sheet:string,row:?int,field:string,message:string}
     */
    protected function error(string $sheet, ?int $row, string $field, string $message): array
    {
        return [
            'sheet' => $sheet,
            'row' => $row,
            'field' => $field,
            'message' => $message,
        ];
    }
}
