<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009C Submit Attempt request (F-009D Sprint 1 Step 5).
 * Payload shape only — no Runtime logic or DB access.
 */
class SubmitAttemptRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('user-api')->check();
    }

    public function rules()
    {
        return [
            'row_version' => 'required|integer',
            'answers' => 'nullable|array',
            'answers.*.snapshot_question_key' => 'required|string',
            'answers.*.question_id' => 'nullable|integer',
            'answers.*.response_payload' => 'nullable|array',
            'answers.*.response' => 'nullable|array',
            'client_submitted_at' => 'nullable|date',
        ];
    }
}
