<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009C Resume Attempt query request (F-009D Sprint 1 Step 3).
 * Payload shape only — no Runtime logic or DB access.
 */
class ResumeAttemptRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('user-api')->check();
    }

    public function rules()
    {
        return [
            'quiz_id' => 'required|integer',
            'assign_student_id' => 'nullable|integer',
        ];
    }
}
