<?php

namespace App\Imports;

use App\Models\Lessons;
use App\Models\Questions;
use App\Models\Subject;
use App\Models\Units;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\Importable;

class QuestionsImport implements ToCollection, WithChunkReading
{
    use Importable;

    /** @var int|null When set, file is treated as Activities template and this subject_id is used */
    protected $subjectId;

    /** @var int Current 1-based row for error messages */
    protected $currentRow = 0;

    /** @var int */
    public $imported = 0;

    /** @var int Rows skipped because the same question already exists for that lesson (or subject for Activities rows). */
    public $duplicates = 0;

    /** @var int Rows skipped for empty cells, missing subject/unit/lesson, or Activities rows without subject_id. */
    public $skipped_other = 0;

    /** @var array<int, string> */
    public $errors = [];

    public function __construct(?int $subjectId = null)
    {
        $this->subjectId = $subjectId;
    }

    protected function pushError(string $message): void
    {
        if (count($this->errors) < 25) {
            $this->errors[] = $message;
        }
    }

    /**
     * Detect if row is in Activities template format (Quizzes/Games/Worksheets in column B).
     */
    protected function isActivitiesFormatRow(array $row): bool
    {
        $colB = $row[1] ?? null;
        return in_array($colB, ['Quizzes', 'Games', 'Worksheets'], true);
    }

    /**
     * Create a Question from Activities template row (columns match ActivityQuestionsImport).
     */
    protected function createFromActivitiesRow(array $row): void
    {
        $questionText = $row[14] ?? null;
        if (empty($questionText)) {
            $this->skipped_other++;

            return;
        }
        if (empty($this->subjectId)) {
            $this->skipped_other++;
            $this->pushError("Row {$this->currentRow}: Activities-style rows need subject_id sent with the upload.");

            return;
        }
        $check = Questions::where('question', $questionText)->where('subject_id', $this->subjectId)->count();
        if ($check > 0) {
            $this->duplicates++;
            $this->pushError("Row {$this->currentRow}: duplicate question (already exists for this subject).");

            return;
        }
        Questions::create([
            'subject_id'         => $this->subjectId,
            'unit_id'            => null,
            'lesson_id'          => null,
            'type'               => $row[5] ?? null,
            'question'           => $questionText,
            'corAnswer'          => $row[17] ?? null,
            'reason'             => $row[19] ?? null,
            'reason_is_required' => (int) (($row[20] ?? 0) == 1),
            'answer1'            => $row[22] ?? null,
            'answer2'            => $row[25] ?? null,
            'answer3'            => $row[28] ?? null,
            'answer4'            => $row[31] ?? null,
            'answer5'            => $row[34] ?? null,
            'answer6'            => $row[37] ?? null,
            'answer7'            => $row[40] ?? null,
            'answer8'            => $row[43] ?? null,
        ]);
        $this->imported++;
    }

    /**
     * Normalize a spreadsheet cell to trimmed string (Excel may pass float IDs).
     */
    protected function normalizeImportCell($value): string
    {
        if ($value === null || $value === '') {
            return '';
        }
        if (is_float($value) && floor($value) == $value) {
            return (string) (int) $value;
        }

        return trim((string) $value);
    }

    /**
     * Resolve subject: valid numeric id, else match subjects.name or name_ar.
     */
    protected function resolveSubjectIdFromImportCell(string $raw): ?int
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

    /**
     * Resolve unit under subject: id must belong to subject; else match units.name / name_ar under that subject.
     */
    protected function resolveUnitIdFromImportCell(string $raw, int $subjectId): ?int
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
            ->where(function ($q) use ($raw) {
                $q->where('name', $raw)->orWhere('name_ar', $raw);
            })
            ->first();

        return $byName ? (int) $byName->id : null;
    }

    /**
     * Resolve lesson under subject+unit: id must match; else match name_en / name_ar.
     */
    protected function resolveLessonIdFromImportCell(string $raw, int $subjectId, int $unitId): ?int
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
            ->where(function ($q) use ($raw) {
                $q->where('name_en', $raw)->orWhere('name_ar', $raw);
            })
            ->first();

        return $byName ? (int) $byName->id : null;
    }

    /**
     * Create a Question from Question Bank template row (subject, unit, lesson, type, code, question...).
     */
    protected function createFromQuestionBankRow(array $row): void
    {
        $subjectRaw = $this->normalizeImportCell($row[0] ?? null);
        $unitRaw    = $this->normalizeImportCell($row[1] ?? null);
        $lessonRaw  = $this->normalizeImportCell($row[2] ?? null);
        $question   = $row[5] ?? null;
        if (empty($question)) {
            $this->skipped_other++;

            return;
        }
        $subjectId = $this->resolveSubjectIdFromImportCell($subjectRaw);
        if ($subjectId === null) {
            $this->skipped_other++;
            $this->pushError("Row {$this->currentRow}: subject not found (column A: \"{$subjectRaw}\").");

            return;
        }
        $unitId = $this->resolveUnitIdFromImportCell($unitRaw, $subjectId);
        if ($unitId === null) {
            $this->skipped_other++;
            $this->pushError("Row {$this->currentRow}: unit not found for subject (column B: \"{$unitRaw}\").");

            return;
        }
        $lessonId = $this->resolveLessonIdFromImportCell($lessonRaw, $subjectId, $unitId);
        if ($lessonId === null) {
            $this->skipped_other++;
            $this->pushError("Row {$this->currentRow}: lesson not found for unit (column C: \"{$lessonRaw}\").");

            return;
        }
        $check = Questions::where([
            ['lesson_id', $lessonId],
            ['unit_id', $unitId],
            ['question', $question],
        ])->count();
        if ($check > 0) {
            $this->duplicates++;
            $this->pushError("Row {$this->currentRow}: duplicate question for this lesson.");

            return;
        }
        Questions::create([
            'subject_id'         => $subjectId,
            'unit_id'            => $unitId,
            'lesson_id'          => $lessonId,
            'type'               => $row[3] ?? null,
            'code'               => $row[4] ?? null,
            'question'           => $question,
            'corAnswer'          => $row[6] ?? null,
            'reason'             => $row[7] ?? null,
            'reason_is_required' => (int) (($row[8] ?? 0) == 1),
            'answer1'            => $row[9] ?? null,
            'answer2'            => $row[10] ?? null,
            'answer3'            => $row[11] ?? null,
            'answer4'            => $row[12] ?? null,
            'answer5'            => $row[13] ?? null,
            'answer6'            => $row[14] ?? null,
            'answer7'            => $row[15] ?? null,
            'answer8'            => $row[16] ?? null,
            'answer1_1'          => $row[17] ?? null,
            'answer1_2'          => $row[18] ?? null,
            'answer1_3'          => $row[19] ?? null,
            'answer1_4'          => $row[20] ?? null,
            'answer1_5'          => $row[21] ?? null,
            'answer1_6'          => $row[22] ?? null,
            'answer1_7'          => $row[23] ?? null,
            'answer1_8'          => $row[24] ?? null,
        ]);
        $this->imported++;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $r => $row) {
            $this->currentRow = (int) $r + 1;
            $row = is_array($row) ? $row : $row->toArray();
            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }
            // Row 0 might be header; still allow data rows
            if ($this->isActivitiesFormatRow($row)) {
                $this->createFromActivitiesRow($row);

                continue;
            }
            // Question Bank template: row 0 can be header (subject, unit, lesson, type...)
            if ($r === 0) {
                $colB = $row[1] ?? null;
                if (in_array((string) $colB, ['unit', 'Unit'], true)) {
                    continue; // skip header row
                }
            }
            $this->createFromQuestionBankRow($row);
        }
    }

    public function chunkSize(): int
    {
        return 10;
    }
}
