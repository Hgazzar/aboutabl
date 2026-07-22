<?php

namespace App\Http\Requests\QuizRuntime;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-009E Step 3 — Student attempt review request.
 * Auth only — no Runtime logic or DB access.
 */
class ReviewAttemptRequest extends FormRequest
{
    public function authorize()
    {
        return Auth::guard('user-api')->check();
    }

    public function rules()
    {
        return [];
    }
}
