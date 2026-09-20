<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use Illuminate\Foundation\Http\FormRequest;

/**
 * ASSIGN-REASSIGN-001 — reopen assignment for selected roster students.
 */
class ReassignAssignRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;

    public function authorize()
    {
        return auth('admin-api')->check() || auth()->check();
    }

    public function rules()
    {
        return [
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|integer|min:1',
        ];
    }
}
