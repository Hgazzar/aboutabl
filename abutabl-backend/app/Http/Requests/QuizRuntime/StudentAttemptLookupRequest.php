<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009F — Student latest/history attempt lookup.
 * Query shape only — no Runtime logic or DB access.
 */
class StudentAttemptLookupRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('user-api')->check();
    }

    public function rules()
    {
        return [
            'quiz_id' => 'required|integer',
        ];
    }
}
