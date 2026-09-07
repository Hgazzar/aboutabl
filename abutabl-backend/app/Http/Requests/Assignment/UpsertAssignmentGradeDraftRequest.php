<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use Illuminate\Foundation\Http\FormRequest;

class UpsertAssignmentGradeDraftRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;

    public function authorize()
    {
        return auth('admin-api')->check() || auth()->check();
    }

    public function rules()
    {
        return [
            'criteria' => 'required|array|min:1',
            'criteria.*.criterion_id' => 'required|integer|min:1',
            'criteria.*.points' => 'required|integer|in:1,2,3,4',
            'teacher_feedback' => 'nullable|string|max:5000',
        ];
    }
}
