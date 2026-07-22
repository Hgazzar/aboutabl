<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009C Start Attempt request (F-009D Sprint 1 Step 2A).
 * Payload shape only — no Runtime logic or response orchestration.
 */
class StartAttemptRequest extends FormRequest
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
            'client_instance_id' => 'nullable|string',
        ];
    }
}
