<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use Illuminate\Foundation\Http\FormRequest;

/**
 * F-041E.2 — Class-scoped assignment list filters / sort / pagination.
 */
class ClassAssignmentsListRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;

    public function authorize()
    {
        return auth('admin-api')->check() || auth()->check();
    }

    public function rules()
    {
        return [
            'search'   => 'nullable|string|max:100',
            'status'   => 'nullable|in:all,active,done,overdue',
            'subject'  => 'nullable|integer|min:1',
            'teacher'  => 'nullable|integer|min:1',
            'range'    => 'nullable|in:week,month,term,this_week,this_month,this_term,all',
            'sort'     => 'nullable|in:newest,oldest,due_date,completion',
            'page'     => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ];
    }
}
