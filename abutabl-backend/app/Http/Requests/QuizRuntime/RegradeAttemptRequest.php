<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009D Sprint 2 Step 3 — Regrade attempt (validation only).
 */
class RegradeAttemptRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('admin-api')->check();
    }

    public function rules()
    {
        return [
            'reason' => 'sometimes|nullable|string|max:2000',
            'mode' => 'sometimes|nullable|string|in:snapshot_rules',
        ];
    }
}
