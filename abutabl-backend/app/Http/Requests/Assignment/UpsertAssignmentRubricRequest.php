<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use Illuminate\Foundation\Http\FormRequest;

class UpsertAssignmentRubricRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;

    public function authorize()
    {
        return auth('admin-api')->check() || auth()->check();
    }

    public function rules()
    {
        return [
            'title' => 'nullable|string|max:255',
            'criteria' => 'required|array|min:1',
            'criteria.*.label' => 'required|string|max:255',
            'criteria.*.weight' => 'required|numeric|gt:0',
        ];
    }
}
