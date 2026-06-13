<?php

namespace App\Imports;

use App\Models\Lessons;
use App\Models\Questions;
use App\Models\Subject;
use App\Models\Units;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class QuestionsImportUpdate implements ToCollection, WithChunkReading
{
    use Importable;

    public $updated = 0;

    public $duplicates_skipped = 0;

    public $skipped_invalid = 0;

    /** @var array<int, string> */
    public $errors = [];

    /** @var int */
    protected $currentRow = 0;

    protected function pushError(string $message): void
    {
        if (count($this->errors) < 25) {
            $this->errors[] = $message;
        }
    }

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

    public function collection(Collection $rows): void
    {
        foreach ($rows as $r => $row) {
            $this->currentRow = (int) $r + 1;
            $row = is_array($row) ? $row : $row->toArray();
            if (empty(array_filter($row))) {
                continue;
            }
            if ($r === 0) {
                $first = strtolower($this->normalizeImportCell($row[0] ?? null));
                if ($first === 'id') {
                    continue;
                }
            }

            $idRaw = $this->normalizeImportCell($row[0] ?? null);
            if ($idRaw === '' || ! ctype_digit($idRaw)) {
                $this->skipped_invalid++;
                $this->pushError("Row {$this->currentRow}: missing or invalid question id (column A).");

                continue;
            }
            $id = (int) $idRaw;

            $subjectRaw = $this->normalizeImportCell($row[1] ?? null);
            $unitRaw = $this->normalizeImportCell($row[2] ?? null);
            $lessonRaw = $this->normalizeImportCell($row[3] ?? null);
            $question = $row[6] ?? null;

            if ($subjectRaw === '' || $unitRaw === '' || $lessonRaw === '') {
                $this->skipped_invalid++;
                $this->pushError("Row {$this->currentRow}: subject, unit, and lesson are required (columns B–D).");

                continue;
            }

            $subjectId = $this->resolveSubjectIdFromImportCell($subjectRaw);
            if ($subjectId === null) {
                $this->skipped_invalid++;
                $this->pushError("Row {$this->currentRow}: subject not found (column B: \"{$subjectRaw}\").");

                continue;
            }

            $unitId = $this->resolveUnitIdFromImportCell($unitRaw, $subjectId);
            if ($unitId === null) {
                $this->skipped_invalid++;
                $this->pushError("Row {$this->currentRow}: unit not found for subject (column C: \"{$unitRaw}\").");

                continue;
            }

            $lessonId = $this->resolveLessonIdFromImportCell($lessonRaw, $subjectId, $unitId);
            if ($lessonId === null) {
                $this->skipped_invalid++;
                $this->pushError("Row {$this->currentRow}: lesson not found for unit (column D: \"{$lessonRaw}\").");

                continue;
            }

            if (empty($question)) {
                $this->skipped_invalid++;
                $this->pushError("Row {$this->currentRow}: question text is empty (column G).");

                continue;
            }

            $find = Questions::find($id);
            if (! $find) {
                $this->skipped_invalid++;
                $this->pushError("Row {$this->currentRow}: question id {$id} not found.");

                continue;
            }

            $duplicateCount = Questions::where('lesson_id', $lessonId)
                ->where('unit_id', $unitId)
                ->where('question', $question)
                ->where('id', '!=', $id)
                ->count();

            if ($duplicateCount > 0) {
                $this->duplicates_skipped++;
                $this->pushError("Row {$this->currentRow}: another question in this lesson already uses the same text.");

                continue;
            }

            Questions::where('id', $id)->update([
                'subject_id' => $subjectId,
                'unit_id' => $unitId,
                'lesson_id' => $lessonId,
                'type' => $row[4] ?? null,
                'code' => $row[5] ?? null,
                'question' => $question,
                'corAnswer' => $row[7] ?? null,
                'reason' => $row[8] ?? null,
                'reason_is_required' => (($row[9] ?? 0) == 1) ? 1 : 0,
                'answer1' => $row[10] ?? null,
                'answer2' => $row[11] ?? null,
                'answer3' => $row[12] ?? null,
                'answer4' => $row[13] ?? null,
                'answer5' => $row[14] ?? null,
                'answer6' => $row[15] ?? null,
                'answer7' => $row[16] ?? null,
                'answer8' => $row[17] ?? null,
                'answer1_1' => $row[18] ?? null,
                'answer1_2' => $row[19] ?? null,
                'answer1_3' => $row[20] ?? null,
                'answer1_4' => $row[21] ?? null,
                'answer1_5' => $row[22] ?? null,
                'answer1_6' => $row[23] ?? null,
                'answer1_7' => $row[24] ?? null,
                'answer1_8' => $row[25] ?? null,
            ]);
            $this->updated++;
        }
    }

    public function chunkSize(): int
    {
        return 10;
    }
}
