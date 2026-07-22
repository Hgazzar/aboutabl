<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009D Sprint 2 Step 2 — Manual grade (validation only).
 */
class ManualGradeRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('admin-api')->check();
    }

    public function rules()
    {
        return [
            'row_version' => 'required|integer|min:0',
            'grades' => 'required|array|min:1',
            'grades.*.question_id' => 'sometimes|nullable|integer|min:1',
            'grades.*.snapshot_question_key' => 'sometimes|nullable|string|max:191',
            'grades.*.manual_score' => 'required|numeric|min:0',
            'grades.*.is_correct' => 'sometimes|nullable|boolean',
            'grades.*.comment' => 'sometimes|nullable|string|max:2000',
        ];
    }
}
