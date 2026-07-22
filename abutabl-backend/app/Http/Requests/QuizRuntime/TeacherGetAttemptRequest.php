<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009D Sprint 2 Step 1 — Teacher get attempt (validation only).
 */
class TeacherGetAttemptRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('admin-api')->check();
    }

    public function rules()
    {
        return [];
    }
}
