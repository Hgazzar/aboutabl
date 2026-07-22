<?php

namespace App\Http\Resources\QuizRuntime;

use Illuminate\Support\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * F-009D Sprint 2 Step 1 — Teacher attempt detail (Runtime only).
 * F-046E — Includes frozen snapshot questions + teacher notes read-back.
 *
 * Expected resource: array{attempt, answers, result, snapshot_questions}
 */
class TeacherAttemptDetailResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        $attempt = $this->resource['attempt'] ?? null;
        $answers = $this->resource['answers'] ?? [];
        $result = $this->resource['result'] ?? null;
        $snapshotQuestions = $this->resource['snapshot_questions'] ?? [];

        $answerItems = [];
        foreach ($answers as $answer) {
            $autoScore = $answer->auto_score !== null ? (float) $answer->auto_score : null;
            $manualScore = $answer->manual_score !== null ? (float) $answer->manual_score : null;
            $scoreAwarded = $manualScore ?? $autoScore;

            $answerItems[] = [
                'question_id' => (int) $answer->question_id,
                'snapshot_question_key' => (string) $answer->snapshot_question_key,
                'response_payload' => $answer->response_payload,
                'is_draft' => (bool) $answer->is_draft,
                'needs_manual' => (bool) $answer->needs_manual,
                'is_correct' => $answer->is_correct === null ? null : (bool) $answer->is_correct,
                'auto_score' => $autoScore,
                'manual_score' => $manualScore,
                'score_awarded' => $scoreAwarded,
                'teacher_comment' => $answer->teacher_comment !== null
                    ? (string) $answer->teacher_comment
                    : null,
                'answered_at' => $this->formatTs($answer->answered_at ?? null),
            ];
        }

        $resultPayload = null;
        if ($result !== null) {
            $resultPayload = [
                'score' => (float) $result->raw_score,
                'max_score' => (float) $result->max_score,
                'percentage' => (float) $result->percent,
                'pass' => (bool) $result->passed,
                'pending_manual' => (bool) $result->pending_manual,
                'is_authoritative' => (bool) $result->is_authoritative,
                'finalized_at' => $this->formatTs($result->finalized_at ?? null),
            ];
        }

        return [
            'attempt' => [
                'attempt_id' => (int) $attempt->id,
                'quiz_id' => (int) $attempt->quiz_id,
                'quiz_snapshot_id' => (int) $attempt->quiz_snapshot_id,
                'student_id' => (int) $attempt->student_id,
                'school_id' => $attempt->school_id !== null ? (int) $attempt->school_id : null,
                'assign_id' => $attempt->assign_id !== null ? (int) $attempt->assign_id : null,
                'assign_student_id' => $attempt->assign_student_id !== null
                    ? (int) $attempt->assign_student_id
                    : null,
                'status' => (string) $attempt->status,
                'attempt_no' => (int) $attempt->attempt_no,
                'started_at' => $this->formatTs($attempt->started_at),
                'ends_at' => $this->formatTs($attempt->ends_at),
                'submitted_at' => $this->formatTs($attempt->submitted_at),
                'last_saved_at' => $this->formatTs($attempt->last_saved_at),
                'row_version' => (int) $attempt->row_version,
            ],
            'snapshot' => [
                'quiz_snapshot_id' => (int) $attempt->quiz_snapshot_id,
                'questions' => is_array($snapshotQuestions) ? $snapshotQuestions : [],
            ],
            'answers' => $answerItems,
            'result' => $resultPayload,
        ];
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
