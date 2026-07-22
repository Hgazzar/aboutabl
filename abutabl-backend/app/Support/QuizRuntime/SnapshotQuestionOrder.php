<?php

namespace App\Support\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;

/**
 * F-046E — Order frozen snapshot questions for review/play presentation.
 */
class SnapshotQuestionOrder
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function forAttempt(QuizAttempt $attempt): array
    {
        $payload = [];
        if ($attempt->snapshot !== null && is_array($attempt->snapshot->payload)) {
            $payload = $attempt->snapshot->payload;
        }

        $snapshotQuestions = isset($payload['questions']) && is_array($payload['questions'])
            ? $payload['questions']
            : [];

        $byKey = [];
        foreach ($snapshotQuestions as $question) {
            if (! is_array($question)) {
                continue;
            }
            $key = (string) ($question['snapshot_question_key'] ?? '');
            if ($key !== '') {
                $byKey[$key] = $question;
            }
        }

        $order = is_array($attempt->question_order) ? $attempt->question_order : null;
        if ($order === null || $order === []) {
            $ordered = [];
            foreach ($snapshotQuestions as $question) {
                if (is_array($question)) {
                    $ordered[] = $question;
                }
            }

            return $ordered;
        }

        $ordered = [];
        foreach ($order as $key) {
            $key = (string) $key;
            if (! isset($byKey[$key])) {
                continue;
            }
            $ordered[] = $byKey[$key];
            unset($byKey[$key]);
        }

        foreach ($byKey as $question) {
            $ordered[] = $question;
        }

        return $ordered;
    }
}
