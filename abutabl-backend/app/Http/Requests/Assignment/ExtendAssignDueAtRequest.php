<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use Illuminate\Foundation\Http\FormRequest;

/**
 * ASSIGN-EXTEND-001 — extend assignment deadline (due_at only).
 */
class ExtendAssignDueAtRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;

    public function authorize()
    {
        return auth('admin-api')->check() || auth()->check();
    }

    public function rules()
    {
        return [
            'due_at' => 'required|date|after:now',
        ];
    }

    public function messages()
    {
        return [
            'due_at.required' => 'The due date is required.',
            'due_at.date' => 'The due date must be a valid date.',
            'due_at.after' => 'The due date must be a future date.',
        ];
    }
}
