<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAssignTitleRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;

    public function authorize()
    {
        return auth('admin-api')->check() || auth()->check();
    }

    public function rules()
    {
        return [
            'title' => 'required|string|max:255',
        ];
    }

    protected function prepareForValidation()
    {
        if ($this->has('title') && is_string($this->input('title'))) {
            $this->merge([
                'title' => trim($this->input('title')),
            ]);
        }
    }
}
