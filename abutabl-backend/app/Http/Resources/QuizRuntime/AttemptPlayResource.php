<?php

namespace App\Http\Resources\QuizRuntime;

use Illuminate\Support\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * F-009C Start/Resume play payload (F-009D Sprint 1 Step 3).
 * Omits correct keys, hashes, and snapshot internals.
 *
 * @mixin \App\Models\QuizRuntime\QuizAttempt
 */
class AttemptPlayResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        $this->resource->loadMissing(['snapshot', 'version', 'answers']);

        $serverNow = Carbon::now();

        return [
            'attempt' => [
                'id' => (int) $this->id,
                'quiz_id' => (int) $this->quiz_id,
                'quiz_version_id' => (int) $this->quiz_version_id,
                'quiz_snapshot_id' => (int) $this->quiz_snapshot_id,
                'status' => (string) $this->status,
                'attempt_no' => (int) $this->attempt_no,
                'started_at' => $this->formatTs($this->started_at),
                'ends_at' => $this->formatTs($this->ends_at),
                'server_now' => $serverNow->toIso8601String(),
                'remaining_seconds' => $this->resolveRemainingSeconds($serverNow),
                'row_version' => (int) $this->row_version,
                'time_limit_seconds' => $this->time_limit_seconds !== null
                    ? (int) $this->time_limit_seconds
                    : null,
                'do_when_time_end' => $this->do_when_time_end,
                'assign_student_id' => $this->assign_student_id !== null
                    ? (int) $this->assign_student_id
                    : null,
            ],
            'play' => [
                'title' => $this->resolveTitle(),
                'questions' => $this->resolvePlayQuestions(),
            ],
            'draft_answers' => $this->resolveDraftAnswers(),
        ];
    }

    private function resolveTitle(): string
    {
        $settings = [];
        if ($this->version !== null && is_array($this->version->settings_frozen)) {
            $settings = $this->version->settings_frozen;
        }

        $locale = app()->getLocale();
        if ($locale === 'ar') {
            return (string) ($settings['title_ar'] ?? $settings['title_en'] ?? '');
        }

        return (string) ($settings['title_en'] ?? $settings['title_ar'] ?? '');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function resolvePlayQuestions(): array
    {
        $payload = [];
        if ($this->snapshot !== null && is_array($this->snapshot->payload)) {
            $payload = $this->snapshot->payload;
        }

        $questions = isset($payload['questions']) && is_array($payload['questions'])
            ? $payload['questions']
            : [];

        $byKey = [];
        foreach ($questions as $question) {
            if (! is_array($question)) {
                continue;
            }
            $key = (string) ($question['snapshot_question_key'] ?? '');
            if ($key === '') {
                continue;
            }
            $byKey[$key] = $question;
        }

        $order = is_array($this->question_order) ? $this->question_order : null;
        if ($order !== null && $order !== []) {
            $ordered = [];
            foreach ($order as $key) {
                $key = (string) $key;
                if (! isset($byKey[$key])) {
                    continue;
                }
                $ordered[] = $byKey[$key];
                unset($byKey[$key]);
            }
            // Append any snapshot questions missing from stored order (defensive).
            foreach ($byKey as $question) {
                $ordered[] = $question;
            }
            $questions = $ordered;
        }

        $out = [];
        foreach ($questions as $question) {
            if (! is_array($question)) {
                continue;
            }

            $out[] = [
                'snapshot_question_key' => (string) ($question['snapshot_question_key'] ?? ''),
                'question_id' => isset($question['question_id']) ? (int) $question['question_id'] : null,
                'position' => isset($question['position']) ? (int) $question['position'] : null,
                'type' => $question['type'] ?? null,
                'stem' => $question['stem'] ?? null,
                'options' => $this->sanitizeOptions(
                    $this->applyAnswerOrder(
                        (string) ($question['snapshot_question_key'] ?? ''),
                        isset($question['options']) && is_array($question['options'])
                            ? $question['options']
                            : []
                    )
                ),
                'max_score' => isset($question['max_score']) ? (float) $question['max_score'] : 0.0,
            ];
        }

        return $out;
    }

    /**
     * Reorder MCQ choice keys for display using stored answer_order.
     * Preserves choice identity (answer1..answer8); presentation only.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    private function applyAnswerOrder(string $snapshotQuestionKey, array $options): array
    {
        $answerOrder = is_array($this->answer_order) ? $this->answer_order : null;
        if ($answerOrder === null || $snapshotQuestionKey === '') {
            return $options;
        }

        $choiceOrder = $answerOrder[$snapshotQuestionKey] ?? null;
        if (! is_array($choiceOrder) || $choiceOrder === []) {
            return $options;
        }

        $ordered = [];
        $used = [];

        foreach ($choiceOrder as $choiceKey) {
            $choiceKey = (string) $choiceKey;
            if ($choiceKey === '' || ! array_key_exists($choiceKey, $options)) {
                continue;
            }
            $ordered[$choiceKey] = $options[$choiceKey];
            $used[$choiceKey] = true;
            foreach ([$choiceKey.'_image', $choiceKey.'_audio'] as $mediaKey) {
                if (array_key_exists($mediaKey, $options)) {
                    $ordered[$mediaKey] = $options[$mediaKey];
                    $used[$mediaKey] = true;
                }
            }
        }

        foreach ($options as $key => $value) {
            if (isset($used[$key])) {
                continue;
            }
            $ordered[$key] = $value;
        }

        return $ordered;
    }

    /**
     * Saved drafts only — no grading / correctness fields.
     *
     * @return array<int, array<string, mixed>>
     */
    private function resolveDraftAnswers(): array
    {
        $answers = $this->relationLoaded('answers') ? $this->answers : collect();
        $out = [];

        foreach ($answers as $answer) {
            $out[] = [
                'snapshot_question_key' => (string) $answer->snapshot_question_key,
                'question_id' => (int) $answer->question_id,
                'response_payload' => $answer->response_payload,
                'answered_at' => $this->formatTs($answer->answered_at),
                'answer_version' => (int) $answer->answer_version,
                'is_draft' => (bool) $answer->is_draft,
            ];
        }

        return $out;
    }

    private function resolveRemainingSeconds(Carbon $serverNow): ?int
    {
        if ($this->ends_at === null || $this->ends_at === '') {
            return null;
        }

        try {
            $endsAt = $this->ends_at instanceof Carbon
                ? $this->ends_at
                : Carbon::parse($this->ends_at);
        } catch (\Exception $e) {
            return null;
        }

        $remaining = $serverNow->diffInSeconds($endsAt, false);

        return $remaining > 0 ? (int) $remaining : 0;
    }

    /**
     * Display options only — never include correctness material.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    private function sanitizeOptions(array $options): array
    {
        unset(
            $options['corAnswer'],
            $options['corAnswer_image'],
            $options['corAnswer_audio'],
            $options['correct_key']
        );

        return $options;
    }

    /**
     * @param  mixed  $value
     */
    private function formatTs($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->toIso8601String();
        }

        try {
            return Carbon::parse($value)->toIso8601String();
        } catch (\Exception $e) {
            return null;
        }
    }
}
