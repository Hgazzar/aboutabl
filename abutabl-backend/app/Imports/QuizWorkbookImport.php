<?php

namespace App\Imports;

use App\Models\Lessons;
use App\Models\Questions;
use App\Models\QuizWorkbookField;
use App\Models\Subject;
use App\Models\Units;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Isolated reader for the 26-column quiz workbook.
 * Preview never writes. Commit re-reads the file and inserts new rows only.
 */
class QuizWorkbookImport
{
    /** @var array<int, string> */
    public const HEADERS = [
        'subject',
        'Unit',
        'lesson',
        'Question Type',
        'Title ',
        'Audio Primary Question Head',
        'Text Primary Question Head',
        'Audio Primary Question Content',
        'Image Primary Question Content',
        'Text Primary Question Content',
        'Audio Secondary Question Head',
        'Text Secondary Question Head',
        'Correct Answer',
        'Answer1 Audio',
        'Answer1 Image',
        'Answer1 Text',
        'Answer2 Audio',
        'Answer2 Image',
        'Answer2 Text',
        'Answer3 Audio',
        'Answer3 Image',
        'Answer3 Text',
        'Answer4 Audio',
        'Answer4 Image',
        'Answer4 Text',
        'Standard Code',
    ];

    /** Same extension list as Helper::GetAnswerData. */
    private const MEDIA_EXTENSIONS = [
        'jpeg', 'png', 'svg', 'jpeg', 'jpg', 'gif', 'apng', 'webp', 'mp3', 'mp4', '3gb', 'mp4', 'ogg', 'webm', 'pdf',
    ];

    private const QUESTION_TYPES = [
        'mcq' => 'MCQ',
        'tf' => 'TF',
        'shn' => 'SHN',
        'matching' => 'Matching',
    ];

    /**
     * @param  string  $path
     * @return array<string, mixed>
     */
    public function preview(string $path): array
    {
        return $this->evaluate($path);
    }

    /**
     * @param  string  $path
     * @param  array<int, string>  $decisions  spreadsheet row => skip|create_new
     * @return array<string, mixed>
     */
    public function commit(string $path, array $decisions, ?int $userId): array
    {
        $evaluated = $this->evaluate($path);

        if (! $evaluated['valid']) {
            return $this->rejected($evaluated, 'The workbook has invalid rows. Nothing was saved.');
        }

        $missing = [];
        foreach ($evaluated['rows'] as $row) {
            if ($row['status'] !== 'duplicate') {
                continue;
            }
            $decision = $decisions[$row['row']] ?? null;
            if (! in_array($decision, ['skip', 'create_new'], true)) {
                $missing[] = $row['row'];
            }
        }

        if ($missing !== []) {
            return $this->rejected(
                $evaluated,
                'Duplicate rows require an explicit decision: skip or create_new. Nothing was saved.'
            );
        }

        if ($evaluated['rows'] === []) {
            return $this->rejected($evaluated, 'No question rows were found. Nothing was saved.');
        }

        $created = [];
        $skipped = [];

        DB::transaction(function () use ($evaluated, $decisions, $userId, &$created, &$skipped) {
            foreach ($evaluated['rows'] as $row) {
                if ($row['status'] === 'error') {
                    throw new \RuntimeException('Invalid row reached commit.');
                }
                if ($row['status'] === 'duplicate' && ($decisions[$row['row']] ?? null) === 'skip') {
                    $skipped[] = $row['row'];
                    continue;
                }

                $question = Questions::create($this->questionAttributes($row['fields'], $userId));
                QuizWorkbookField::create($this->sideAttributes((int) $question->id, $row['fields']));
                $created[] = [
                    'row' => $row['row'],
                    'question_id' => (int) $question->id,
                ];
            }
        });

        return [
            'written' => true,
            'created' => $created,
            'skipped' => $skipped,
            'rows' => $evaluated['rows'],
            'file_errors' => [],
        ];
    }

    /**
     * @param  string  $path
     * @return array<string, mixed>
     */
    private function evaluate(string $path): array
    {
        $matrix = $this->readMatrix($path);
        $headerError = $this->headerError($matrix[0] ?? []);
        if ($headerError !== null) {
            return [
                'valid' => false,
                'file_errors' => [$headerError],
                'rows' => [],
            ];
        }

        $rows = [];
        $previousComplete = [];

        foreach ($matrix as $index => $raw) {
            if ($index === 0) {
                continue;
            }
            $sheetRow = $index + 1;
            $cells = $this->padRow($raw);
            if ($this->isSkippableRow($cells)) {
                continue;
            }

            $built = $this->buildRow($sheetRow, $cells, $previousComplete);
            $rows[] = $built;

            if ($built['status'] !== 'error' && $this->sevenFilled($built['fields'])) {
                $previousComplete[] = [
                    'row' => $sheetRow,
                    'fields' => $built['fields'],
                ];
            }
        }

        if ($rows === []) {
            return [
                'valid' => false,
                'file_errors' => ['No question rows were found.'],
                'rows' => [],
            ];
        }

        $hasError = false;
        foreach ($rows as $row) {
            if ($row['status'] === 'error') {
                $hasError = true;
                break;
            }
        }

        return [
            'valid' => ! $hasError,
            'file_errors' => [],
            'rows' => $rows,
        ];
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    private function readMatrix(string $path): array
    {
        $sheet = IOFactory::load($path)->getSheet(0);
        $matrix = $sheet->toArray(null, true, false, false);

        return is_array($matrix) ? $matrix : [];
    }

    /**
     * @param  array<int, mixed>  $header
     */
    private function headerError(array $header): ?string
    {
        $values = array_values($header);
        foreach (array_slice($values, 26) as $extra) {
            if ($extra !== null && trim((string) $extra) !== '') {
                return 'Header row has more than 26 columns.';
            }
        }

        $header = $this->padRow($values);
        foreach (self::HEADERS as $index => $expected) {
            $actual = $header[$index] === null ? '' : (string) $header[$index];
            if ($actual !== $expected) {
                return 'Header row does not match the 26-column workbook. Column '.($index + 1).' must be "'.$expected.'".';
            }
        }

        return null;
    }

    /**
     * @param  array<int, mixed>  $row
     * @return array<int, mixed>
     */
    private function padRow(array $row): array
    {
        $row = array_values($row);

        return array_pad(array_slice($row, 0, 26), 26, null);
    }

    /**
     * Blank rows carry no record. The legend row is the workbook's fixed
     * number map (1–7, 1.1–4.3, 8) with subject, unit, lesson, type, title,
     * and Correct Answer empty. Any other row is validated and reported.
     *
     * @param  array<int, mixed>  $cells
     */
    private function isSkippableRow(array $cells): bool
    {
        return $this->isBlankRow($cells) || $this->isLegendRow($cells);
    }

    /**
     * @param  array<int, mixed>  $cells
     */
    private function isBlankRow(array $cells): bool
    {
        foreach ($cells as $cell) {
            if ($this->cellString($cell) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * Reference numbers from quiz.xlsx row 2. Float noise such as 1.1000000000000001 still matches.
     *
     * @param  array<int, mixed>  $cells
     */
    private function isLegendRow(array $cells): bool
    {
        $expected = [
            5 => 1, 6 => 2, 7 => 3, 8 => 4, 9 => 5, 10 => 6, 11 => 7,
            13 => 1.1, 14 => 1.2, 15 => 1.3,
            16 => 2.1, 17 => 2.2, 18 => 2.3,
            19 => 3.1, 20 => 3.2, 21 => 3.3,
            22 => 4.1, 23 => 4.2, 24 => 4.3,
            25 => 8,
        ];

        for ($index = 0; $index < 26; $index++) {
            $actual = $cells[$index] ?? null;
            if (! array_key_exists($index, $expected)) {
                if ($this->cellString($actual) !== '') {
                    return false;
                }
                continue;
            }
            if (! $this->matchesLegendNumber($actual, (float) $expected[$index])) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  mixed  $actual
     */
    private function matchesLegendNumber($actual, float $expected): bool
    {
        $text = $this->cellString($actual);
        if ($text === '' || ! is_numeric($text)) {
            return false;
        }

        return abs((float) $text - $expected) < 0.001;
    }

    /**
     * @param  array<int, mixed>  $cells
     * @param  array<int, array<string, mixed>>  $previousComplete
     * @return array<string, mixed>
     */
    private function buildRow(int $sheetRow, array $cells, array $previousComplete): array
    {
        $errors = [];
        $subjectRaw = $this->cellString($cells[0] ?? null);
        $unitRaw = $this->cellString($cells[1] ?? null);
        $lessonRaw = $this->cellString($cells[2] ?? null);
        $typeRaw = $this->cellString($cells[3] ?? null);
        $title = $this->cellString($cells[4] ?? null);
        $primaryHeadText = $this->cellString($cells[6] ?? null);
        $primaryContentText = $this->cellString($cells[9] ?? null);
        $secondaryHeadText = $this->cellString($cells[11] ?? null);
        $corAnswer = $this->cellString($cells[12] ?? null);
        $answer1 = $this->cellString($cells[15] ?? null);
        $answer2 = $this->cellString($cells[18] ?? null);
        $answer3 = $this->cellString($cells[21] ?? null);
        $answer4 = $this->cellString($cells[24] ?? null);
        $code = $this->cellString($cells[25] ?? null);

        $subjectId = $this->resolveSubjectId($subjectRaw);
        $unitId = $subjectId ? $this->resolveUnitId($unitRaw, $subjectId) : null;
        $lessonId = ($subjectId && $unitId) ? $this->resolveLessonId($lessonRaw, $subjectId, $unitId) : null;

        if ($subjectId === null) {
            $errors[] = 'Subject was not found.';
        }
        if ($subjectId !== null && $unitId === null) {
            $errors[] = 'Unit was not found for this subject.';
        }
        if ($subjectId !== null && $unitId !== null && $lessonId === null) {
            $errors[] = 'Lesson was not found for this unit.';
        }

        $type = self::QUESTION_TYPES[strtolower($typeRaw)] ?? null;
        if ($type === null) {
            $errors[] = 'Question Type must be MCQ, TF, SHN, or Matching.';
        }

        if (mb_strlen($title) > 255) {
            $errors[] = 'Title is longer than 255 characters.';
        }
        if (mb_strlen($code) > 255) {
            $errors[] = 'Standard Code is longer than 255 characters.';
        }

        $question = $primaryContentText !== '' ? $primaryContentText : ($primaryHeadText !== '' ? $primaryHeadText : $secondaryHeadText);
        if ($question === '') {
            $errors[] = 'Question text is required.';
        }
        if ($corAnswer === '') {
            $errors[] = 'Correct Answer is required.';
        }
        // QuestionsController::store and update require answer1 and answer2 for every type.
        if ($answer1 === '') {
            $errors[] = 'Answer1 Text is required.';
        }
        if ($answer2 === '') {
            $errors[] = 'Answer2 Text is required.';
        }

        $mediaMap = [
            'primary_head_audio' => 5,
            'primary_content_audio' => 7,
            'primary_content_image' => 8,
            'secondary_head_audio' => 10,
            'answer1_audio' => 13,
            'answer1_image' => 14,
            'answer2_audio' => 16,
            'answer2_image' => 17,
            'answer3_audio' => 19,
            'answer3_image' => 20,
            'answer4_audio' => 22,
            'answer4_image' => 23,
        ];
        $media = [];
        foreach ($mediaMap as $key => $index) {
            $resolved = $this->resolveMedia($cells[$index] ?? null);
            if ($resolved['error'] !== null) {
                $errors[] = $key.': '.$resolved['error'];
            }
            $media[$key] = $resolved;
        }

        $fields = [
            'subject_id' => $subjectId,
            'unit_id' => $unitId,
            'lesson_id' => $lessonId,
            'type' => $type,
            'import_title' => $title === '' ? null : $title,
            'question' => $question,
            'corAnswer' => $corAnswer,
            'answer1' => $answer1,
            'answer2' => $answer2,
            'answer3' => $answer3,
            'answer4' => $answer4,
            'code' => $code === '' ? null : $code,
            'primary_head_text' => $primaryHeadText === '' ? null : $primaryHeadText,
            'primary_content_text' => $primaryContentText === '' ? null : $primaryContentText,
            'secondary_head_text' => $secondaryHeadText === '' ? null : $secondaryHeadText,
            'media' => $media,
        ];

        $duplicateOf = null;
        $duplicateOfRow = null;
        if ($errors === [] && $this->sevenFilled($fields)) {
            foreach ($previousComplete as $previous) {
                if ($this->sameSeven($fields, $previous['fields'])) {
                    $duplicateOfRow = $previous['row'];
                    break;
                }
            }
            $existing = Questions::query()
                ->where('lesson_id', $fields['lesson_id'])
                ->where('question', $fields['question'])
                ->where('corAnswer', $fields['corAnswer'])
                ->where('answer1', $fields['answer1'])
                ->where('answer2', $fields['answer2'])
                ->where('answer3', $fields['answer3'])
                ->where('answer4', $fields['answer4'])
                ->first();
            if ($existing) {
                $duplicateOf = (int) $existing->id;
            }
        }

        $status = 'ok';
        if ($errors !== []) {
            $status = 'error';
        } elseif ($duplicateOf !== null || $duplicateOfRow !== null) {
            $status = 'duplicate';
        }

        return [
            'row' => $sheetRow,
            'status' => $status,
            'errors' => $errors,
            'duplicate_of' => $duplicateOf,
            'duplicate_of_row' => $duplicateOfRow,
            'fields' => $fields,
        ];
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function sevenFilled(array $fields): bool
    {
        foreach (['lesson_id', 'question', 'corAnswer', 'answer1', 'answer2', 'answer3', 'answer4'] as $key) {
            $value = $fields[$key] ?? null;
            if ($value === null || trim((string) $value) === '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $left
     * @param  array<string, mixed>  $right
     */
    private function sameSeven(array $left, array $right): bool
    {
        foreach (['lesson_id', 'question', 'corAnswer', 'answer1', 'answer2', 'answer3', 'answer4'] as $key) {
            if ((string) $left[$key] !== (string) $right[$key]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array{reference: ?string, file_management_id: ?int, resolved_url: ?string, error: ?string}
     */
    private function resolveMedia($cell): array
    {
        $reference = $this->cellString($cell);
        $empty = [
            'reference' => null,
            'file_management_id' => null,
            'resolved_url' => null,
            'error' => null,
        ];
        if ($reference === '') {
            return $empty;
        }
        if (mb_strlen($reference) > 255) {
            $empty['reference'] = $reference;
            $empty['error'] = 'Media reference is longer than 255 characters.';

            return $empty;
        }
        if (! str_contains($reference, '.')) {
            $empty['reference'] = $reference;
            $empty['error'] = 'Media reference was not found in file_management.';

            return $empty;
        }

        $parts = explode('.', $reference);
        $name = $parts[0];
        $type = $parts[1] ?? '';
        if ($name === '' || $type === '' || ! in_array($type, self::MEDIA_EXTENSIONS, true)) {
            $empty['reference'] = $reference;
            $empty['error'] = 'Media reference was not found in file_management.';

            return $empty;
        }

        $media = DB::table('file_management')->where('name', $name)->where('type', $type)->first();
        if (! $media) {
            $empty['reference'] = $reference;
            $empty['error'] = 'Media reference was not found in file_management.';

            return $empty;
        }

        return [
            'reference' => $reference,
            'file_management_id' => (int) $media->id,
            'resolved_url' => url('/storage').'/'.$media->path,
            'error' => null,
        ];
    }

    private function resolveSubjectId(string $raw): ?int
    {
        if ($raw === '') {
            return null;
        }
        if (is_numeric($raw)) {
            $id = (int) $raw;
            if ($id > 0 && Subject::whereKey($id)->exists()) {
                return $id;
            }
        }
        $byName = Subject::where('name', $raw)->orWhere('name_ar', $raw)->first();

        return $byName ? (int) $byName->id : null;
    }

    private function resolveUnitId(string $raw, int $subjectId): ?int
    {
        if ($raw === '') {
            return null;
        }
        if (is_numeric($raw)) {
            $id = (int) $raw;
            if ($id > 0) {
                $unit = Units::whereKey($id)->where('subject_id', $subjectId)->first();
                if ($unit) {
                    return (int) $unit->id;
                }
            }
        }
        $byName = Units::where('subject_id', $subjectId)
            ->where(function ($query) use ($raw) {
                $query->where('name', $raw)->orWhere('name_ar', $raw);
            })
            ->first();

        return $byName ? (int) $byName->id : null;
    }

    private function resolveLessonId(string $raw, int $subjectId, int $unitId): ?int
    {
        if ($raw === '') {
            return null;
        }
        if (is_numeric($raw)) {
            $id = (int) $raw;
            if ($id > 0) {
                $lesson = Lessons::whereKey($id)
                    ->where('subject_id', $subjectId)
                    ->where('unit_id', $unitId)
                    ->first();
                if ($lesson) {
                    return (int) $lesson->id;
                }
            }
        }
        $byName = Lessons::where('subject_id', $subjectId)
            ->where('unit_id', $unitId)
            ->where(function ($query) use ($raw) {
                $query->where('name_en', $raw)->orWhere('name_ar', $raw);
            })
            ->first();

        return $byName ? (int) $byName->id : null;
    }

    /**
     * Questions::$guarded is empty, which is the existing model and is left unchanged.
     * create() therefore accepts whatever array it is given. This list is the only
     * input: workbook fields already validated above, plus the authenticated user id.
     * The HTTP request is not passed through.
     *
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function questionAttributes(array $fields, ?int $userId): array
    {
        return [
            'subject_id' => $fields['subject_id'],
            'unit_id' => $fields['unit_id'],
            'lesson_id' => $fields['lesson_id'],
            'type' => $fields['type'],
            'code' => $fields['code'],
            'question' => $fields['question'],
            'corAnswer' => $fields['corAnswer'],
            'answer1' => $fields['answer1'] !== '' ? $fields['answer1'] : null,
            'answer2' => $fields['answer2'] !== '' ? $fields['answer2'] : null,
            'answer3' => $fields['answer3'] !== '' ? $fields['answer3'] : null,
            'answer4' => $fields['answer4'] !== '' ? $fields['answer4'] : null,
            'created_by' => $userId,
        ];
    }

    /**
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function sideAttributes(int $questionId, array $fields): array
    {
        $row = [
            'question_id' => $questionId,
            'import_title' => $fields['import_title'],
            'primary_head_text' => $fields['primary_head_text'],
            'primary_content_text' => $fields['primary_content_text'],
            'secondary_head_text' => $fields['secondary_head_text'],
        ];
        foreach ($fields['media'] as $key => $media) {
            $row[$key] = $media['reference'];
        }

        return $row;
    }

    /**
     * @param  array<string, mixed>  $evaluated
     * @return array<string, mixed>
     */
    private function rejected(array $evaluated, string $message): array
    {
        return [
            'written' => false,
            'created' => [],
            'skipped' => [],
            'rows' => $evaluated['rows'],
            'file_errors' => $evaluated['file_errors'],
            'message' => $message,
        ];
    }

    /**
     * @param  mixed  $value
     */
    private function cellString($value): string
    {
        if ($value === null) {
            return '';
        }
        if (is_int($value)) {
            return (string) $value;
        }
        if (is_float($value) && floor($value) == $value) {
            return (string) (int) $value;
        }

        return trim((string) $value);
    }
}
