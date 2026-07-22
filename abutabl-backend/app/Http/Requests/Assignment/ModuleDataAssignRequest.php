<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use Illuminate\Foundation\Http\FormRequest;

/**
 * F-041C — Module picker validation (legacy get_module_data).
 */
class ModuleDataAssignRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;

    public function authorize()
    {
        return auth('admin-api')->check() || auth()->check();
    }

    public function rules()
    {
        return [
            'school_id' => 'required|exists:schools,id',
            'type' => 'required|in:subjects,units,lessons,lessons_contents,quizes,games',
        ];
    }
}
