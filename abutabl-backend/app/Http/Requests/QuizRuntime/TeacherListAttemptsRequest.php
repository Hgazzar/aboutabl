<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009D Sprint 2 Step 1 — Teacher list attempts (validation only).
 */
class TeacherListAttemptsRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('admin-api')->check();
    }

    public function rules()
    {
        return [
            'quiz_id' => 'sometimes|nullable|integer|min:1',
            'student_id' => 'sometimes|nullable|integer|min:1',
            'assign_id' => 'sometimes|nullable|integer|min:1',
            'status' => 'sometimes|nullable|string|max:32',
            'page' => 'sometimes|nullable|integer|min:1',
            'per_page' => 'sometimes|nullable|integer|min:1|max:100',
        ];
    }
}
