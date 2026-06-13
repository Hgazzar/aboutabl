<?php

namespace App\Imports;

use App\Helpers\Helper;
use App\Models\Questions;
use App\Models\SubjectActivity;
use App\Models\ActivityLesson;
use App\Models\games;
use App\Models\Quizes;
use App\Models\FileManagement;
use App\Models\WorkSheets;
use App\Models\QuizesQuestions;
use App\Models\GamesQuestions;
use App\Models\WorkSheetsQuestions;
use Illuminate\Support\Collection;
// use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\Importable;
use Illuminate\Foundation\Bus\Dispatchable;


class ActivityQuestionsImport implements ToCollection, WithChunkReading, WithEvents
{
    use Dispatchable , Importable;
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    
    protected $subject_id;

    /** @var int|null When set, all imported quizzes are assigned to this activity lesson (current lesson in UI). */
    protected $activity_lesson_id;

    /** New {@see Questions} rows created */
    public $imported = 0;

    /** Skipped: question already linked to the same quiz/game/worksheet (duplicate pivot) */
    public $duplicates = 0;

    /** New quiz–question / game–question / worksheet–question links */
    public $links_added = 0;

    /** Empty question cells, missing activity/lesson/title, etc. */
    public $skipped_other = 0;

    public $quizzes_new = 0;

    public $quizzes_reused = 0;

    public $games_new = 0;

    public $games_reused = 0;

    public $worksheets_new = 0;

    public $worksheets_reused = 0;

    /** @var array<int, string> */
    public $errors = [];

    public function __construct($subject_id, $activity_lesson_id = null)
    {
        $this->subject_id = $subject_id;
        $this->activity_lesson_id = $activity_lesson_id ? (int) $activity_lesson_id : null;
    }

    protected function pushImportError(string $message): void
    {
        if (count($this->errors) < 25) {
            $this->errors[] = $message;
        }
    }

    protected function linkQuizQuestionIfNew(int $quizeId, int $questionId, $score): void
    {
        if (QuizesQuestions::where('quize_id', $quizeId)->where('question_id', $questionId)->exists()) {
            $this->duplicates++;
            $this->pushImportError("Quiz #{$quizeId}: question #{$questionId} already linked — skipped duplicate.");

            return;
        }
        QuizesQuestions::create([
            'quize_id'    => $quizeId,
            'question_id' => $questionId,
            'score'       => $score,
            'created_by'  => auth()->user()->id,
        ]);
        $this->links_added++;
    }

    protected function linkGameQuestionIfNew(int $gameId, int $questionId): void
    {
        if (GamesQuestions::where('game_id', $gameId)->where('question_id', $questionId)->exists()) {
            $this->duplicates++;
            $this->pushImportError("Game #{$gameId}: question #{$questionId} already linked — skipped duplicate.");

            return;
        }
        GamesQuestions::create([
            'game_id'     => $gameId,
            'question_id' => $questionId,
            'created_by'  => auth()->user()->id,
        ]);
        $this->links_added++;
    }

    protected function linkWorksheetQuestionIfNew(int $workSheetId, int $questionId): void
    {
        if (WorkSheetsQuestions::where('work_sheet_id', $workSheetId)->where('question_id', $questionId)->exists()) {
            $this->duplicates++;
            $this->pushImportError("Worksheet #{$workSheetId}: question #{$questionId} already linked — skipped duplicate.");

            return;
        }
        WorkSheetsQuestions::create([
            'work_sheet_id' => $workSheetId,
            'question_id'   => $questionId,
            'created_by'    => auth()->user()->id,
        ]);
        $this->links_added++;
    }

    /**
     * Safe file lookup: avoid errors when cell is empty or missing "name.type" format.
     */
    protected function findFileByCell($cell)
    {
        if ($cell === null || $cell === '' || strpos((string) $cell, '.') === false) {
            return null;
        }
        $parts = explode('.', (string) $cell, 2);
        $name = trim($parts[0]);
        $type = isset($parts[1]) ? trim($parts[1]) : '';
        if ($name === '' || $type === '') {
            return null;
        }
        return FileManagement::where('name', $name)->where('type', $type)->first();
    }

    /**
     * Ensure row has numeric 0-based keys (Excel sometimes gives A,B,C or mixed).
     */
    protected function normalizeRowToNumeric(array $row): array
    {
        if (isset($row[0]) || isset($row[1])) {
            return $row;
        }
        return array_values($row);
    }

    /**
     * Excel often omits trailing empty cells, so numeric keys like 34 may be missing (PHP 8+ throws).
     * Pad to 0..59 so all template column indices used below exist.
     *
     * @param  array|\Illuminate\Support\Collection|mixed  $row
     */
    protected function normalizeActivityDataRow($row): array
    {
        $row = $row instanceof \Illuminate\Support\Collection ? $row->toArray() : (array) $row;
        $row = $this->normalizeRowToNumeric($row);
        $row = array_values($row);

        return array_pad($row, 60, null);
    }

    /**
     * Normalize activity type from row (column B or A). Returns 'quizzes', 'games', 'worksheets', or null.
     */
    protected function normalizeRowType(array $row): ?string
    {
        $row = $this->normalizeRowToNumeric($row);
        $cell = trim((string) ($row[1] ?? $row[0] ?? ''));
        if ($cell === '') {
            return null;
        }
        $type = strtolower($cell);
        // Skip header-like rows
        if (in_array($type, ['type', 'activity type', 'نوع', 'نوع النشاط', 'activity'], true)) {
            return null;
        }
        if (in_array($type, ['quizzes', 'quiz'], true)) {
            return 'quizzes';
        }
        if (in_array($type, ['games', 'game'], true)) {
            return 'games';
        }
        if (in_array($type, ['worksheets', 'worksheet'], true)) {
            return 'worksheets';
        }
        return null;
    }

     public function collection(Collection $rows)
    {
        foreach ($rows->take(8) as $probeRow) {
            $probe = $probeRow instanceof \Illuminate\Support\Collection ? $probeRow->toArray() : (array) $probeRow;
            $probe = $this->normalizeRowToNumeric($probe);
            if (empty(array_filter($probe, function ($v) {
                return $v !== null && $v !== '';
            }))) {
                continue;
            }
            $c0 = strtolower(trim((string) ($probe[0] ?? '')));
            $c1 = strtolower(trim((string) ($probe[1] ?? '')));
            $isQuestionBankHeader = ($c0 === 'subject' && $c1 === 'unit')
                || ($c0 === 'id' && $c1 === 'subject');
            if ($isQuestionBankHeader) {
                throw new \Exception(
                    'This spreadsheet is a Question Bank template (columns like subject, unit, lesson — or id, subject for exports). '
                    .'Import it from Question Bank → Upload Questions, not from Quiz / Game / Worksheet activities. '
                    .'For activities, download and use the Activities Questions Template; column B must contain Quizzes, Games, or Worksheets.'
                );
            }
        }

        $quizes = [];
        $games = [];
        $worksheet = [];
        foreach ($rows as $r => $row) {
            $rowArray = $row instanceof \Illuminate\Support\Collection ? $row->toArray() : (array) $row;
            $rowArray = $this->normalizeRowToNumeric($rowArray);
            $type = $this->normalizeRowType($rowArray);
            if ($type === 'quizzes') {
                $quizes[] = $rowArray;
            } elseif ($type === 'games') {
                $games[] = $rowArray;
            } elseif ($type === 'worksheets') {
                $worksheet[] = $rowArray;
            }
        }
        $quizes_grouped = collect($quizes)->groupBy(4)->toArray();
        $games_grouped = collect($games)->groupBy(4)->toArray();
        $worksheet_grouped = collect($worksheet)->groupBy(4)->toArray();

        $totalRows = count($quizes) + count($games) + count($worksheet);
        $totalGrouped = count($quizes_grouped) + count($games_grouped) + count($worksheet_grouped);
        if ($totalRows === 0) {
            throw new \Exception(
                'No valid data rows found. Ensure column B (or A) contains: Quizzes, Games, or Worksheets (case insensitive). ' .
                'If the first row is a header, it will be skipped.'
            );
        }
        if ($totalGrouped === 0) {
            throw new \Exception(
                'No groups found. Ensure column E has a value to group quiz/game/worksheet rows together.'
            );
        }

        // When user uploaded from a specific lesson, use that lesson for all quiz rows.
        $target_activity_lesson = null;
        $target_subject_activity = null;
        if ($this->activity_lesson_id) {
            $target_activity_lesson = ActivityLesson::with('SubjectActivity')->find($this->activity_lesson_id);
            if ($target_activity_lesson && $target_activity_lesson->SubjectActivity && $target_activity_lesson->SubjectActivity->type === 'Quizzes' && (int) $target_activity_lesson->SubjectActivity->subject_id === (int) $this->subject_id) {
                $target_subject_activity = $target_activity_lesson->SubjectActivity;
            } else {
                $target_activity_lesson = null;
                $target_subject_activity = null;
            }
        }

        foreach($quizes_grouped as $index=>$item) {
            $subject_activity = null;
            $activity_lesson = null;

            if ($target_activity_lesson && $target_subject_activity) {
                $activity_lesson = $target_activity_lesson;
                $subject_activity = $target_subject_activity;
            } else {
                $activityRef = trim((string) ($item[0][2] ?? ''));
                $lessonRef = trim((string) ($item[0][3] ?? ''));
                if ($activityRef === '' || $lessonRef === '') {
                    $this->skipped_other++;
                    $this->pushImportError('Quiz row skipped: activity or lesson reference (columns C–D) is empty.');

                    continue;
                }
                $subject_activity = SubjectActivity::where('subject_id', $this->subject_id)
                    ->where('type', 'Quizzes')
                    ->where(function($query) use ($activityRef) {
                        if (is_numeric($activityRef)) {
                            $query->where('id', (int) $activityRef);
                        }
                        $query->orWhere('name_en', $activityRef)->orWhere('name_ar', $activityRef);
                    })
                    ->first();

                if ($subject_activity) {
                    $activity_lesson = ActivityLesson::where('subject_activity_id', $subject_activity->id)
                        ->where(function($query) use ($lessonRef) {
                            if (is_numeric($lessonRef)) {
                                $query->where('id', (int) $lessonRef);
                            }
                            $query->orWhere('name_en', $lessonRef)->orWhere('name_ar', $lessonRef);
                        })
                        ->first();
                }
            }

            if ($activity_lesson && $subject_activity) {
                $titleEn = $item[0][9] ?? null;
                if (empty($titleEn)) {
                    $this->skipped_other++;
                    $this->pushImportError('Quiz group skipped: quiz title (column J) is empty.');

                    continue;
                }
                $quize = Quizes::where('title_en', $titleEn)
                    ->where('subject_id', $this->subject_id)
                    ->where('activity_lesson_id', $activity_lesson->id)
                    ->first();
                $unitId = $subject_activity->unit_id ?? null;
                $lessonId = $activity_lesson->lesson_id ?? null;
                if ($quize == null) {
                    $this->quizzes_new++;
                    $quize = Quizes::create([
                      'title_en'          => $titleEn,
                      'status'            => '1',
                      'subject_id'        => $this->subject_id,
                      'unit_id'          => $unitId,
                      'lesson_id'        => $lessonId,
                      'created_by'        => auth()->user()->id,
                      'navigation_method' => 'free',
                      'questions_per_page'=> 1,
                      'score_method'      => 'points',
                      'score_to_pass'     => $item[0][11] ?? 0,
                      'unlimited_attempts'=> '0',
                      'num_attempts'      => 1,
                      'notify_student'    => '0',
                      'notify_about_submission'      => '0',
                      'notify_about_late_submission' => '0',
                      'reminder_before_due_date'     => '0',
                      'start_date'        => date("Y-m-d"),
                      'due_date'          => date("Y-m-d"),
                      'time_limit'        => $item[0][10] ?? 0,
                      'type_time'         => 'minutes',
                      'activity_lesson_id' => $activity_lesson->id,
                    ]);
                } else {
                    $this->quizzes_reused++;
                }
                
                foreach($item as $iRaw) {
                    $i = $this->normalizeActivityDataRow($iRaw);
                    $questionText = $i[14] ?? null;
                    if (empty($questionText)) {
                        $this->skipped_other++;

                        continue;
                    }
                    $check = Questions::where('question', $questionText)->where('subject_id', $this->subject_id)->first();
                    if($check == null) {
                        $main_qust_audio = $this->findFileByCell($i[13] ?? null);
                        $main_qust_image = $this->findFileByCell($i[15] ?? null);
                        $correct_answer_audio = $this->findFileByCell($i[16] ?? null);
                        $correct_answer_image = $this->findFileByCell($i[18] ?? null);
                        $answer1_audio = $this->findFileByCell($i[21] ?? null);
                        $answer1_image = $this->findFileByCell($i[23] ?? null);
                        $answer2_audio = $this->findFileByCell($i[24] ?? null);
                        $answer2_image = $this->findFileByCell($i[26] ?? null);
                        $answer3_audio = $this->findFileByCell($i[27] ?? null);
                        $answer3_image = $this->findFileByCell($i[29] ?? null);
                        $answer4_audio = $this->findFileByCell($i[30] ?? null);
                        $answer4_image = $this->findFileByCell($i[32] ?? null);
                        $answer5_audio = $this->findFileByCell($i[33] ?? null);
                        $answer5_image = $this->findFileByCell($i[35] ?? null);
                        $answer6_audio = $this->findFileByCell($i[36] ?? null);
                        $answer6_image = $this->findFileByCell($i[38] ?? null);
                        $answer7_audio = $this->findFileByCell($i[39] ?? null);
                        $answer7_image = $this->findFileByCell($i[41] ?? null);
                        $answer8_audio = $this->findFileByCell($i[42] ?? null);
                        $answer8_image = $this->findFileByCell($i[44] ?? null);
                        
                        $question = Questions::create([
                            'subject_id'         => $this->subject_id,
                            'unit_id'            => $unitId,
                            'lesson_id'          => $lessonId,
                            'type'               => $i[5] ?? null,
                            // 'code'         => $i[4],
                            'question'           => $questionText,
                            'question_audio'     => $main_qust_audio ? 'storage/files_maanger/'.$main_qust_audio->hashName : null,
                            'question_image'     => $main_qust_image ? 'storage/files_maanger/'.$main_qust_image->hashName : null,
                            'corAnswer'          => $i[17] ?? null,
                            'corAnswer_audio'    => $correct_answer_audio ? 'storage/files_maanger/'.$correct_answer_audio->hashName : null,
                            'corAnswer_image'    => $correct_answer_image ? 'storage/files_maanger/'.$correct_answer_image->hashName : null,
                            'reason'             => $i[19] ?? null,
                            'reason_is_required' => (int)(($i[20] ?? 0) == 1),
                            
                            'answer1_audio'      => $answer1_audio ? 'storage/files_maanger/'.$answer1_audio->hashName : null,
                            'answer1'            => $i[22] ?? null,
                            'answer1_image'      => $answer1_image ? 'storage/files_maanger/'.$answer1_image->hashName : null,
                            
                            'answer2_audio'      => $answer2_audio ? 'storage/files_maanger/'.$answer2_audio->hashName : null,
                            'answer2'            => $i[25] ?? null,
                            'answer2_image'      => $answer2_image ? 'storage/files_maanger/'.$answer2_image->hashName : null,
                            
                            'answer3_audio'      => $answer3_audio ? 'storage/files_maanger/'.$answer3_audio->hashName : null,
                            'answer3'            => $i[28] ?? null,
                            'answer3_image'      => $answer3_image ? 'storage/files_maanger/'.$answer3_image->hashName : null,
                            
                            'answer4_audio'      => $answer4_audio ? 'storage/files_maanger/'.$answer4_audio->hashName : null,
                            'answer4'            => $i[31] ?? null,
                            'answer4_image'      => $answer4_image ? 'storage/files_maanger/'.$answer4_image->hashName : null,
                            
                            'answer5_audio'      => $answer5_audio ? 'storage/files_maanger/'.$answer5_audio->hashName : null,
                            'answer5'            => $i[34] ?? null,
                            'answer5_image'      => $answer5_image ? 'storage/files_maanger/'.$answer5_image->hashName : null,
                            
                            'answer6_audio'      => $answer6_audio ? 'storage/files_maanger/'.$answer6_audio->hashName : null,
                            'answer6'            => $i[37] ?? null,
                            'answer6_image'      => $answer6_image ? 'storage/files_maanger/'.$answer6_image->hashName : null,
                            
                            'answer7_audio'      => $answer7_audio ? 'storage/files_maanger/'.$answer7_audio->hashName : null,
                            'answer7'            => $i[40] ?? null,
                            'answer7_image'      => $answer7_image ? 'storage/files_maanger/'.$answer7_image->hashName : null,
                            
                            'answer8_audio'      => $answer8_audio ? 'storage/files_maanger/'.$answer8_audio->hashName : null,
                            'answer8'            => $i[43] ?? null,
                            'answer8_image'      => $answer8_image ? 'storage/files_maanger/'.$answer8_image->hashName : null,
                            // 'answer1_1'    => $i[17],
                            // 'answer1_2'    => $i[18],
                            // 'answer1_3'    => $i[19],
                            // 'answer1_4'    => $i[20],
                            // 'answer1_5'    => $i[21],
                            // 'answer1_6'    => $i[22],
                            // 'answer1_7'    => $i[23],
                            // 'answer1_8'    => $i[24],
                        ]);
                        $this->imported++;
                        $this->linkQuizQuestionIfNew((int) $quize->id, (int) $question->id, $i[12] ?? null);
                    } else {
                        $this->linkQuizQuestionIfNew((int) $quize->id, (int) $check->id, $i[12] ?? null);
                    }
                }
                
            } else {
                $this->skipped_other++;
                $this->pushImportError('Quiz group skipped: no matching SubjectActivity (Quizzes) or ActivityLesson for this subject.');
            }
            // dd($index, $item);
        }
        
        foreach($games_grouped as $index=>$item) {
            $activityRef = trim((string) ($item[0][2] ?? ''));
            $lessonRef = trim((string) ($item[0][3] ?? ''));
            if ($activityRef === '' || $lessonRef === '') {
                $this->skipped_other++;
                $this->pushImportError('Game row skipped: activity or lesson reference (columns C–D) is empty.');

                continue;
            }
            $subject_activity = SubjectActivity::where('subject_id', $this->subject_id)
                ->where('type', 'Games')
                ->where(function($query) use ($activityRef) {
                    if (is_numeric($activityRef)) {
                        $query->where('id', (int) $activityRef);
                    }
                    $query->orWhere('name_en', $activityRef)->orWhere('name_ar', $activityRef);
                })
                ->first();

            $activity_lesson = null;
            if ($subject_activity) {
                $activity_lesson = ActivityLesson::where('subject_activity_id', $subject_activity->id)
                    ->where(function($query) use ($lessonRef) {
                        if (is_numeric($lessonRef)) {
                            $query->where('id', (int) $lessonRef);
                        }
                        $query->orWhere('name_en', $lessonRef)->orWhere('name_ar', $lessonRef);
                    })
                    ->first();
            }
            if ($activity_lesson) {
                $gameNameEn = $item[0][53] ?? null;
                if (empty($gameNameEn)) {
                    $this->skipped_other++;
                    $this->pushImportError('Game group skipped: game name (column BB) is empty.');

                    continue;
                }
                $unitId = $subject_activity->unit_id ?? null;
                $lessonId = $activity_lesson->lesson_id ?? null;
                $game = games::where('name_en', $gameNameEn)->where('subject_id', $this->subject_id)->where('activity_lesson_id', $activity_lesson->id)->first();
                if ($game == null){
                    $this->games_new++;
                    $game = games::create([
                          'name_en'    => $gameNameEn,
                          'time'    => $item[0][54] ?? null,
                          'type'    => $item[0][55] ?? null,
                          'level'    => $item[0][56] ?? null,
                          'code'    => $item[0][8] ?? null,
                          'status'     => '1',
                          'subject_id' => $this->subject_id,
                          'subject_activity_id' => $subject_activity->id,
                          'activity_lesson_id' => $activity_lesson->id,
                          'created_by' => auth()->user()->id,
                    ]);
                } else {
                    $this->games_reused++;
                }
                
                foreach($item as $iRaw) {
                    $i = $this->normalizeActivityDataRow($iRaw);
                    $questionText = $i[14] ?? null;
                    if (empty($questionText)) {
                        $this->skipped_other++;

                        continue;
                    }
                    $check = Questions::where('question', $questionText)->where('subject_id', $this->subject_id)->first();
                    if($check == null) {
                        $main_qust_audio = $this->findFileByCell($i[13] ?? null);
                        $main_qust_image = $this->findFileByCell($i[15] ?? null);
                        $correct_answer_audio = $this->findFileByCell($i[16] ?? null);
                        $correct_answer_image = $this->findFileByCell($i[18] ?? null);
                        $answer1_audio = $this->findFileByCell($i[21] ?? null);
                        $answer1_image = $this->findFileByCell($i[23] ?? null);
                        $answer2_audio = $this->findFileByCell($i[24] ?? null);
                        $answer2_image = $this->findFileByCell($i[26] ?? null);
                        $answer3_audio = $this->findFileByCell($i[27] ?? null);
                        $answer3_image = $this->findFileByCell($i[29] ?? null);
                        $answer4_audio = $this->findFileByCell($i[30] ?? null);
                        $answer4_image = $this->findFileByCell($i[32] ?? null);
                        $answer5_audio = $this->findFileByCell($i[33] ?? null);
                        $answer5_image = $this->findFileByCell($i[35] ?? null);
                        $answer6_audio = $this->findFileByCell($i[36] ?? null);
                        $answer6_image = $this->findFileByCell($i[38] ?? null);
                        $answer7_audio = $this->findFileByCell($i[39] ?? null);
                        $answer7_image = $this->findFileByCell($i[41] ?? null);
                        $answer8_audio = $this->findFileByCell($i[42] ?? null);
                        $answer8_image = $this->findFileByCell($i[44] ?? null);
                        
                        $question = Questions::create([
                            'subject_id'         => $this->subject_id,
                            'unit_id'            => $unitId,
                            'lesson_id'          => $lessonId,
                            'type'               => $i[5] ?? null,
                            // 'code'         => $i[4],
                            'question'           => $questionText,
                            'question_audio'     => $main_qust_audio ? 'storage/files_maanger/'.$main_qust_audio->hashName : null,
                            'question_image'     => $main_qust_image ? 'storage/files_maanger/'.$main_qust_image->hashName : null,
                            'corAnswer'          => $i[17] ?? null,
                            'corAnswer_audio'    => $correct_answer_audio ? 'storage/files_maanger/'.$correct_answer_audio->hashName : null,
                            'corAnswer_image'    => $correct_answer_image ? 'storage/files_maanger/'.$correct_answer_image->hashName : null,
                            'reason'             => $i[19] ?? null,
                            'reason_is_required' => (int)(($i[20] ?? 0) == 1),
                            'answer1_audio'      => $answer1_audio ? 'storage/files_maanger/'.$answer1_audio->hashName : null,
                            'answer1'            => $i[22] ?? null,
                            'answer1_image'      => $answer1_image ? 'storage/files_maanger/'.$answer1_image->hashName : null,
                            'answer2_audio'      => $answer2_audio ? 'storage/files_maanger/'.$answer2_audio->hashName : null,
                            'answer2'            => $i[25] ?? null,
                            'answer2_image'      => $answer2_image ? 'storage/files_maanger/'.$answer2_image->hashName : null,
                            'answer3_audio'      => $answer3_audio ? 'storage/files_maanger/'.$answer3_audio->hashName : null,
                            'answer3'            => $i[28] ?? null,
                            'answer3_image'      => $answer3_image ? 'storage/files_maanger/'.$answer3_image->hashName : null,
                            'answer4_audio'      => $answer4_audio ? 'storage/files_maanger/'.$answer4_audio->hashName : null,
                            'answer4'            => $i[31] ?? null,
                            'answer4_image'      => $answer4_image ? 'storage/files_maanger/'.$answer4_image->hashName : null,
                            'answer5_audio'      => $answer5_audio ? 'storage/files_maanger/'.$answer5_audio->hashName : null,
                            'answer5'            => $i[34] ?? null,
                            'answer5_image'      => $answer5_image ? 'storage/files_maanger/'.$answer5_image->hashName : null,
                            'answer6_audio'      => $answer6_audio ? 'storage/files_maanger/'.$answer6_audio->hashName : null,
                            'answer6'            => $i[37] ?? null,
                            'answer6_image'      => $answer6_image ? 'storage/files_maanger/'.$answer6_image->hashName : null,
                            'answer7_audio'      => $answer7_audio ? 'storage/files_maanger/'.$answer7_audio->hashName : null,
                            'answer7'            => $i[40] ?? null,
                            'answer7_image'      => $answer7_image ? 'storage/files_maanger/'.$answer7_image->hashName : null,
                            'answer8_audio'      => $answer8_audio ? 'storage/files_maanger/'.$answer8_audio->hashName : null,
                            'answer8'            => $i[43] ?? null,
                            'answer8_image'      => $answer8_image ? 'storage/files_maanger/'.$answer8_image->hashName : null,
                        ]);
                        $this->imported++;
                        $this->linkGameQuestionIfNew((int) $game->id, (int) $question->id);
                    } else {
                        $this->linkGameQuestionIfNew((int) $game->id, (int) $check->id);
                    }
                }
                
            } else {
                $this->skipped_other++;
                $this->pushImportError('Game group skipped: no matching SubjectActivity (Games) or ActivityLesson for this subject.');
            }
            // dd($index, $item);
        }
        
        foreach($worksheet_grouped as $index=>$item) {
            $activityRef = trim((string) ($item[0][2] ?? ''));
            $lessonRef = trim((string) ($item[0][3] ?? ''));
            if ($activityRef === '' || $lessonRef === '') {
                $this->skipped_other++;
                $this->pushImportError('Worksheet row skipped: activity or lesson reference (columns C–D) is empty.');

                continue;
            }
            $subject_activity = SubjectActivity::where('subject_id', $this->subject_id)
                ->where('type', 'Worksheets')
                ->where(function($query) use ($activityRef) {
                    if (is_numeric($activityRef)) {
                        $query->where('id', (int) $activityRef);
                    }
                    $query->orWhere('name_en', $activityRef)->orWhere('name_ar', $activityRef);
                })
                ->first();

            $activity_lesson = null;
            if ($subject_activity) {
                $activity_lesson = ActivityLesson::where('subject_activity_id', $subject_activity->id)
                    ->where(function($query) use ($lessonRef) {
                        if (is_numeric($lessonRef)) {
                            $query->where('id', (int) $lessonRef);
                        }
                        $query->orWhere('name_en', $lessonRef)->orWhere('name_ar', $lessonRef);
                    })
                    ->first();
            }
            if ($activity_lesson) {
                $sheetNameEn = $item[0][57] ?? $item[0][58] ?? null;
                if (empty($sheetNameEn)) {
                    $this->skipped_other++;
                    $this->pushImportError('Worksheet group skipped: worksheet name is empty (expected in column BF or BG).');

                    continue;
                }
                $unitId = $subject_activity->unit_id ?? null;
                $lessonId = $activity_lesson->lesson_id ?? null;
                $sheet = WorkSheets::where('name_en', $sheetNameEn)->where('subject_id', $this->subject_id)->where('activity_lesson_id', $activity_lesson->id)->first();
                if ($sheet == null) {
                    $this->worksheets_new++;
                    $file = $this->findFileByCell($item[0][58] ?? null);
                    $sheet = WorkSheets::create([
                        'name_en'          => $sheetNameEn,
                        'code'              => $item[0][8] ?? null,
                        'path'              => $file ? 'storage/files_maanger/'.$file->hashName : null,
                        'status'            => '1',
                        'subject_id'        => $this->subject_id,
                        'subject_activity_id' => $subject_activity->id,
                        'created_by'        => auth()->user()->id,
                        'activity_lesson_id' => $activity_lesson->id,
                    ]);
                } else {
                    $this->worksheets_reused++;
                }
                
                foreach($item as $iRaw) {
                    $i = $this->normalizeActivityDataRow($iRaw);
                    $questionText = $i[14] ?? null;
                    if (empty($questionText)) {
                        $this->skipped_other++;

                        continue;
                    }
                    $check = Questions::where('question', $questionText)->where('subject_id', $this->subject_id)->first();
                    if($check == null) {
                        $main_qust_audio = $this->findFileByCell($i[13] ?? null);
                        $main_qust_image = $this->findFileByCell($i[15] ?? null);
                        $correct_answer_audio = $this->findFileByCell($i[16] ?? null);
                        $correct_answer_image = $this->findFileByCell($i[18] ?? null);
                        $answer1_audio = $this->findFileByCell($i[21] ?? null);
                        $answer1_image = $this->findFileByCell($i[23] ?? null);
                        $answer2_audio = $this->findFileByCell($i[24] ?? null);
                        $answer2_image = $this->findFileByCell($i[26] ?? null);
                        $answer3_audio = $this->findFileByCell($i[27] ?? null);
                        $answer3_image = $this->findFileByCell($i[29] ?? null);
                        $answer4_audio = $this->findFileByCell($i[30] ?? null);
                        $answer4_image = $this->findFileByCell($i[32] ?? null);
                        $answer5_audio = $this->findFileByCell($i[33] ?? null);
                        $answer5_image = $this->findFileByCell($i[35] ?? null);
                        $answer6_audio = $this->findFileByCell($i[36] ?? null);
                        $answer6_image = $this->findFileByCell($i[38] ?? null);
                        $answer7_audio = $this->findFileByCell($i[39] ?? null);
                        $answer7_image = $this->findFileByCell($i[41] ?? null);
                        $answer8_audio = $this->findFileByCell($i[42] ?? null);
                        $answer8_image = $this->findFileByCell($i[44] ?? null);
                        
                        $question = Questions::create([
                            'subject_id'         => $this->subject_id,
                            'unit_id'            => $unitId,
                            'lesson_id'          => $lessonId,
                            'type'               => $i[5] ?? null,
                            'question'           => $questionText,
                            'question_audio'     => $main_qust_audio ? 'storage/files_maanger/'.$main_qust_audio->hashName : null,
                            'question_image'     => $main_qust_image ? 'storage/files_maanger/'.$main_qust_image->hashName : null,
                            'corAnswer'          => $i[17] ?? null,
                            'corAnswer_audio'    => $correct_answer_audio ? 'storage/files_maanger/'.$correct_answer_audio->hashName : null,
                            'corAnswer_image'    => $correct_answer_image ? 'storage/files_maanger/'.$correct_answer_image->hashName : null,
                            'reason'             => $i[19] ?? null,
                            'reason_is_required' => (int)(($i[20] ?? 0) == 1),
                            
                            'answer1_audio'      => $answer1_audio ? 'storage/files_maanger/'.$answer1_audio->hashName : null,
                            'answer1'            => $i[22] ?? null,
                            'answer1_image'      => $answer1_image ? 'storage/files_maanger/'.$answer1_image->hashName : null,
                            
                            'answer2_audio'      => $answer2_audio ? 'storage/files_maanger/'.$answer2_audio->hashName : null,
                            'answer2'            => $i[25] ?? null,
                            'answer2_image'      => $answer2_image ? 'storage/files_maanger/'.$answer2_image->hashName : null,
                            
                            'answer3_audio'      => $answer3_audio ? 'storage/files_maanger/'.$answer3_audio->hashName : null,
                            'answer3'            => $i[28] ?? null,
                            'answer3_image'      => $answer3_image ? 'storage/files_maanger/'.$answer3_image->hashName : null,
                            
                            'answer4_audio'      => $answer4_audio ? 'storage/files_maanger/'.$answer4_audio->hashName : null,
                            'answer4'            => $i[31] ?? null,
                            'answer4_image'      => $answer4_image ? 'storage/files_maanger/'.$answer4_image->hashName : null,
                            
                            'answer5_audio'      => $answer5_audio ? 'storage/files_maanger/'.$answer5_audio->hashName : null,
                            'answer5'            => $i[34] ?? null,
                            'answer5_image'      => $answer5_image ? 'storage/files_maanger/'.$answer5_image->hashName : null,
                            
                            'answer6_audio'      => $answer6_audio ? 'storage/files_maanger/'.$answer6_audio->hashName : null,
                            'answer6'            => $i[37] ?? null,
                            'answer6_image'      => $answer6_image ? 'storage/files_maanger/'.$answer6_image->hashName : null,
                            
                            'answer7_audio'      => $answer7_audio ? 'storage/files_maanger/'.$answer7_audio->hashName : null,
                            'answer7'            => $i[40] ?? null,
                            'answer7_image'      => $answer7_image ? 'storage/files_maanger/'.$answer7_image->hashName : null,
                            
                            'answer8_audio'      => $answer8_audio ? 'storage/files_maanger/'.$answer8_audio->hashName : null,
                            'answer8'            => $i[43] ?? null,
                            'answer8_image'      => $answer8_image ? 'storage/files_maanger/'.$answer8_image->hashName : null,
                            // 'answer1_1'    => $i[17],
                            // 'answer1_2'    => $i[18],
                            // 'answer1_3'    => $i[19],
                            // 'answer1_4'    => $i[20],
                            // 'answer1_5'    => $i[21],
                            // 'answer1_6'    => $i[22],
                            // 'answer1_7'    => $i[23],
                            // 'answer1_8'    => $i[24],
                        ]);
                        $this->imported++;
                        $this->linkWorksheetQuestionIfNew((int) $sheet->id, (int) $question->id);
                    } else {
                        $this->linkWorksheetQuestionIfNew((int) $sheet->id, (int) $check->id);
                    }
                }
                
            } else {
                $this->skipped_other++;
                $this->pushImportError('Worksheet group skipped: no matching SubjectActivity (Worksheets) or ActivityLesson for this subject.');
            }
            // dd($index, $item);
        }
        // dd($quizes_grouped, $games_grouped, $worksheet_grouped);
        
        return true;
    }


    public function chunkSize(): int
    {
        return 100;
    }
    
    public function registerEvents(): array
    {
        return [];
    }
}
