<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * F-041C — Student markOpened validation (legacy SubjectController@markTodoOpened).
 */
class MarkTodoOpenedRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;

    public function authorize()
    {
        return Auth::guard('user-api')->check() || auth()->check();
    }

    public function rules()
    {
        return [
            'assign_id' => 'required|integer|exists:assigns,id',
        ];
    }
}
