<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use Illuminate\Foundation\Http\FormRequest;

/**
 * F-041C — Store assign validation (same rules as legacy AssignsController@store).
 */
class StoreAssignRequest extends FormRequest
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
            'grade_id' => 'nullable|array|min:1',
            'grade_id.*' => ['exists:grades,id'],
            'class_id' => 'nullable|array|min:1',
            'class_id.*' => ['exists:classes,id'],
            'student_id' => 'nullable|array',
            'student_id.*' => ['exists:students,id'],
            'type' => 'required|in:subjects,units,lessons,lessons_contents,quizes,games',
            'type_id' => 'required',
            'due_at' => 'nullable|date',
            'due_date' => 'nullable|date',
            'teacher_id' => 'nullable|integer',
        ];
    }

    /**
     * Legacy store required a due date via due_at or due_date (same as controller check).
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $due = $this->input('due_at', $this->input('due_date'));
            if ($due === null || $due === '') {
                $validator->errors()->add(
                    'due_at',
                    validator([], ['due_at' => 'required'])->errors()->first()
                );
            }
        });
    }
}
