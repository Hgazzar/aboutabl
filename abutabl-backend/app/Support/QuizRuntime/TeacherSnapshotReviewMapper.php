<?php

namespace App\Support\QuizRuntime;

/**
 * F-046E — Map frozen snapshot question rows for teacher Runtime Review.
 */
class TeacherSnapshotReviewMapper
{
    /**
     * @param  array<string, mixed>  $question
     * @return array<string, mixed>
     */
    public static function mapQuestion(array $question): array
    {
        $correctKey = isset($question['correct_key']) && is_array($question['correct_key'])
            ? $question['correct_key']
            : [];

        $options = isset($question['options']) && is_array($question['options'])
            ? $question['options']
            : [];

        return [
            'snapshot_question_key' => (string) ($question['snapshot_question_key'] ?? ''),
            'question_id' => isset($question['question_id']) ? (int) $question['question_id'] : null,
            'position' => isset($question['position']) ? (int) $question['position'] : null,
            'type' => $question['type'] ?? null,
            'stem' => $question['stem'] ?? null,
            'question_des' => $question['question_des'] ?? null,
            'options' => $options,
            'correct_key' => [
                'corAnswer' => $correctKey['corAnswer'] ?? null,
                'corAnswer_image' => $correctKey['corAnswer_image'] ?? null,
                'corAnswer_audio' => $correctKey['corAnswer_audio'] ?? null,
            ],
            'max_score' => isset($question['max_score']) ? (float) $question['max_score'] : 0.0,
            'explanation' => array_key_exists('explanation', $question) ? $question['explanation'] : null,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $orderedQuestions
     * @return array<int, array<string, mixed>>
     */
    public static function mapQuestions(array $orderedQuestions): array
    {
        $out = [];
        foreach ($orderedQuestions as $question) {
            if (! is_array($question)) {
                continue;
            }
            $out[] = self::mapQuestion($question);
        }

        return $out;
    }
}
