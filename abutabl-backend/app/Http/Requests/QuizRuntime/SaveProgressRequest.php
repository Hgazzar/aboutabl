<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009C Save Progress request (F-009D Sprint 1).
 * Payload shape only — no Runtime logic or DB access.
 */
class SaveProgressRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('user-api')->check();
    }

    public function rules()
    {
        return [
            'row_version' => 'required|integer',
            'answers' => 'required|array',
            'answers.*.snapshot_question_key' => 'required|string',
            'answers.*.question_id' => 'nullable|integer',
            'answers.*.response_payload' => 'nullable|array',
            'answers.*.response' => 'nullable|array',
        ];
    }
}
