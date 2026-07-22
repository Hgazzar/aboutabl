<?php

namespace App\Services\QuizRuntime;

use App\Models\Questions;
use App\Models\Quizes;
use App\Models\QuizesQuestions;
use App\Models\QuizRuntime\QuizSnapshot;
use App\Models\QuizRuntime\QuizVersion;
use App\Repositories\QuizRuntime\SnapshotRepository;
use App\Repositories\QuizRuntime\VersionRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * F-009D Runtime — Publish Definition → immutable Version + Snapshot.
 * Sprint 2 Step 1: publish pipeline only.
 */
class QuizPublishService
{
    /** @var VersionRepository */
    private $versions;

    /** @var SnapshotRepository */
    private $snapshots;

    public function __construct(
        VersionRepository $versions,
        SnapshotRepository $snapshots
    ) {
        $this->versions = $versions;
        $this->snapshots = $snapshots;
    }

    /**
     * Publish a Definition quiz into a new immutable Runtime Version + Snapshot.
     *
     * Input:
     * - quiz_id (required int)
     * - published_by (optional int — User id)
     *
     * @param  array<string, mixed>  $input
     * @return array{version: QuizVersion, snapshot: QuizSnapshot}
     */
    public function publish(array $input): array
    {
        $quizId = (int) ($input['quiz_id'] ?? 0);
        if ($quizId <= 0) {
            throw new InvalidArgumentException('quiz_id is required.');
        }

        /** @var Quizes|null $quiz */
        $quiz = Quizes::query()->whereKey($quizId)->first();
        if ($quiz === null) {
            throw new InvalidArgumentException('Quiz not found.');
        }

        $pivotRows = QuizesQuestions::query()
            ->where('quize_id', $quizId)
            ->orderBy('id')
            ->get();

        if ($pivotRows->isEmpty()) {
            throw new InvalidArgumentException('Quiz has no questions to publish.');
        }

        $questionIds = $pivotRows->pluck('question_id')->map(fn ($id) => (int) $id)->all();
        $questionsById = Questions::query()
            ->whereIn('id', $questionIds)
            ->get()
            ->keyBy('id');

        $settingsFrozen = $this->buildSettingsFrozen($quiz);
        $payload = $this->buildSnapshotPayload($quiz, $pivotRows, $questionsById);
        $contentHash = $this->hashFreezeMaterial($settingsFrozen, $payload);

        // Skip creating a new Version/Snapshot when frozen material is unchanged.
        $latestPublished = $this->versions->latestPublished($quizId);
        if ($latestPublished !== null
            && (string) $latestPublished->content_hash === (string) $contentHash
        ) {
            $existingSnapshot = $this->snapshots->findByVersion((int) $latestPublished->id);
            if ($existingSnapshot !== null) {
                return [
                    'version' => $latestPublished,
                    'snapshot' => $existingSnapshot,
                ];
            }
        }

        $publishedBy = isset($input['published_by']) ? (int) $input['published_by'] : null;
        if ($publishedBy !== null && $publishedBy <= 0) {
            $publishedBy = null;
        }

        $publishedAt = Carbon::now();
        $sourceUpdatedAt = $quiz->updated_at;

        return DB::transaction(function () use (
            $quiz,
            $quizId,
            $settingsFrozen,
            $payload,
            $contentHash,
            $publishedBy,
            $publishedAt,
            $sourceUpdatedAt
        ) {
            $this->supersedePublishedVersions($quizId);

            $nextVersionNumber = $this->nextVersionNumber($quizId);

            $version = $this->versions->create([
                'quiz_id' => $quizId,
                'version_number' => $nextVersionNumber,
                'status' => QuizVersion::STATUS_PUBLISHED,
                'content_hash' => $contentHash,
                'settings_frozen' => $settingsFrozen,
                'published_by' => $publishedBy,
                'published_at' => $publishedAt,
                'source_definition_updated_at' => $sourceUpdatedAt,
            ]);

            $snapshot = $this->snapshots->create([
                'quiz_version_id' => (int) $version->id,
                'quiz_id' => $quizId,
                'content_hash' => $contentHash,
                'payload' => $payload,
                'item_count' => count($payload['questions'] ?? []),
            ]);

            return [
                'version' => $version->fresh(),
                'snapshot' => $snapshot->fresh(),
            ];
        });
    }

    /**
     * Mark all currently published versions for a quiz as superseded.
     */
    private function supersedePublishedVersions(int $quizId): void
    {
        foreach ($this->versions->findByQuiz($quizId) as $existing) {
            if ($existing->status === QuizVersion::STATUS_PUBLISHED) {
                $this->versions->update($existing, [
                    'status' => QuizVersion::STATUS_SUPERSEDED,
                ]);
            }
        }
    }

    private function nextVersionNumber(int $quizId): int
    {
        $max = 0;
        foreach ($this->versions->findByQuiz($quizId) as $existing) {
            $n = (int) $existing->version_number;
            if ($n > $max) {
                $max = $n;
            }
        }

        return $max + 1;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildSettingsFrozen(Quizes $quiz): array
    {
        // Freeze raw Definition attributes (avoid accessors rewriting dates/media).
        $a = $quiz->getAttributes();

        return [
            'title_en' => $a['title_en'] ?? null,
            'title_ar' => $a['title_ar'] ?? null,
            'instructions_en' => $a['instructions_en'] ?? null,
            'instructions_ar' => $a['instructions_ar'] ?? null,
            'code' => $a['code'] ?? null,
            'subject_id' => isset($a['subject_id']) ? (int) $a['subject_id'] : null,
            'grade_id' => isset($a['grade_id']) ? (int) $a['grade_id'] : null,
            'unit_id' => isset($a['unit_id']) ? (int) $a['unit_id'] : null,
            'lesson_id' => isset($a['lesson_id']) ? (int) $a['lesson_id'] : null,
            'navigation_method' => $a['navigation_method'] ?? null,
            'shuffle_questions' => $a['shuffle_questions'] ?? null,
            'shuffle_answers' => $a['shuffle_answers'] ?? null,
            'questions_per_page' => $a['questions_per_page'] ?? null,
            'score_method' => $a['score_method'] ?? null,
            'score_to_pass' => isset($a['score_to_pass']) && $a['score_to_pass'] !== null
                ? (float) $a['score_to_pass']
                : null,
            'unlimited_attempts' => $a['unlimited_attempts'] ?? null,
            'num_attempts' => isset($a['num_attempts']) && $a['num_attempts'] !== null
                ? (int) $a['num_attempts']
                : null,
            'time_limit' => isset($a['time_limit']) && $a['time_limit'] !== null
                ? (float) $a['time_limit']
                : null,
            'type_time' => $a['type_time'] ?? null,
            'do_when_time_end' => $a['do_when_time_end'] ?? null,
            'start_date' => $a['start_date'] ?? null,
            'due_date' => $a['due_date'] ?? null,
            'notify_student' => $a['notify_student'] ?? null,
            'notify_about_submission' => $a['notify_about_submission'] ?? null,
            'notify_about_late_submission' => $a['notify_about_late_submission'] ?? null,
            'reminder_before_due_date' => $a['reminder_before_due_date'] ?? null,
            // F-009E review policy — missing values freeze as false (backward compatible).
            'review_after_submit' => $this->freezeBool($a['review_after_submit'] ?? null),
            'show_correct_answers' => $this->freezeBool($a['show_correct_answers'] ?? null),
            'show_explanations' => $this->freezeBool($a['show_explanations'] ?? null),
            // F-009G retry policy — append only.
            'allow_retry_after_pass' => $this->freezeBool($a['allow_retry_after_pass'] ?? null),
            'allow_retry_after_fail' => array_key_exists('allow_retry_after_fail', $a)
                && $a['allow_retry_after_fail'] !== null
                ? $this->freezeBool($a['allow_retry_after_fail'])
                : true,
            'retry_delay_minutes' => isset($a['retry_delay_minutes']) && $a['retry_delay_minutes'] !== null
                ? (int) $a['retry_delay_minutes']
                : null,
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection  $pivotRows
     * @param  \Illuminate\Support\Collection  $questionsById
     * @return array{quiz_id: int, questions: array<int, array<string, mixed>>}
     */
    private function buildSnapshotPayload(Quizes $quiz, $pivotRows, $questionsById): array
    {
        $questions = [];
        $index = 0;

        foreach ($pivotRows as $pivot) {
            $index++;
            $questionId = (int) $pivot->question_id;
            /** @var Questions|null $question */
            $question = $questionsById->get($questionId);

            if ($question === null) {
                throw new InvalidArgumentException(
                    "Question {$questionId} linked to quiz {$quiz->id} was not found."
                );
            }

            $snapshotQuestionKey = 'i'.$index.'_q'.$questionId;
            $qa = $question->getAttributes();
            $pa = $pivot->getAttributes();

            $questions[] = [
                'snapshot_question_key' => $snapshotQuestionKey,
                'position' => $index,
                'question_id' => $questionId,
                'type' => $qa['type'] ?? null,
                'code' => $qa['code'] ?? null,
                'stem' => $qa['question'] ?? null,
                'question_des' => $qa['question_des'] ?? null,
                'question_body_type' => $qa['question_body_type'] ?? null,
                'answer_body_type' => $qa['answer_body_type'] ?? null,
                'reason' => $qa['reason'] ?? null,
                'reason_is_required' => $qa['reason_is_required'] ?? null,
                // F-009E — freeze explanation as-is (NULL stays NULL).
                'explanation' => array_key_exists('explanation', $qa) ? $qa['explanation'] : null,
                'options' => $this->freezeOptionsFromAttributes($qa),
                'correct_key' => $this->freezeCorrectKeyFromAttributes($qa),
                'max_score' => isset($pa['score']) && $pa['score'] !== null ? (float) $pa['score'] : 0.0,
                'pivot' => [
                    'quizes_questions_id' => (int) $pivot->id,
                    'code' => $pa['code'] ?? null,
                    'status' => $pa['status'] ?? null,
                ],
                'display_meta' => [
                    'subject_id' => isset($qa['subject_id']) ? (int) $qa['subject_id'] : null,
                    'unit_id' => isset($qa['unit_id']) ? (int) $qa['unit_id'] : null,
                    'lesson_id' => isset($qa['lesson_id']) ? (int) $qa['lesson_id'] : null,
                    'school_id' => isset($qa['school_id']) ? (int) $qa['school_id'] : null,
                ],
            ];
        }

        return [
            'quiz_id' => (int) $quiz->id,
            'questions' => $questions,
        ];
    }

    /**
     * @param  array<string, mixed>  $attrs
     * @return array<string, mixed>
     */
    private function freezeOptionsFromAttributes(array $attrs): array
    {
        $options = [];

        foreach ([
            'answer1', 'answer2', 'answer3', 'answer4',
            'answer5', 'answer6', 'answer7', 'answer8',
            'answer1_1', 'answer1_2', 'answer1_3', 'answer1_4',
            'answer1_5', 'answer1_6', 'answer1_7', 'answer1_8',
            'question_image', 'question_audio',
            'answer1_image', 'answer1_audio',
            'answer2_image', 'answer2_audio',
            'answer3_image', 'answer3_audio',
            'answer4_image', 'answer4_audio',
            'answer5_image', 'answer5_audio',
            'answer6_image', 'answer6_audio',
            'answer7_image', 'answer7_audio',
            'answer8_image', 'answer8_audio',
        ] as $key) {
            if (array_key_exists($key, $attrs)) {
                $options[$key] = $attrs[$key];
            }
        }

        return $options;
    }

    /**
     * @param  array<string, mixed>  $attrs
     * @return array<string, mixed>
     */
    private function freezeCorrectKeyFromAttributes(array $attrs): array
    {
        return [
            'corAnswer' => $attrs['corAnswer'] ?? null,
            'corAnswer_image' => $attrs['corAnswer_image'] ?? null,
            'corAnswer_audio' => $attrs['corAnswer_audio'] ?? null,
        ];
    }

    /**
     * @param  array<string, mixed>  $settingsFrozen
     * @param  array<string, mixed>  $payload
     */
    private function hashFreezeMaterial(array $settingsFrozen, array $payload): string
    {
        $canonical = [
            'settings_frozen' => $settingsFrozen,
            'payload' => $payload,
        ];

        $json = json_encode($canonical, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new InvalidArgumentException('Unable to encode snapshot for content_hash.');
        }

        return hash('sha256', $json);
    }

    /**
     * Freeze a Definition boolean; missing/null → false (backward compatible).
     *
     * @param  mixed  $value
     */
    private function freezeBool($value): bool
    {
        if ($value === null) {
            return false;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
