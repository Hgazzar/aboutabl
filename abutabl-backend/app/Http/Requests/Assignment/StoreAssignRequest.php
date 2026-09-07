<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Supports legacy single-module store OR Learning Activities multi-select.
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
        $hasActivities = is_array($this->input('activities')) && count($this->input('activities')) > 0;

        if ($hasActivities) {
            return [
                'school_id' => 'required|exists:schools,id',
                'grade_id' => 'nullable|array|min:1',
                'grade_id.*' => ['exists:grades,id'],
                'class_id' => 'nullable|array|min:1',
                'class_id.*' => ['exists:classes,id'],
                'student_id' => 'nullable|array',
                'student_id.*' => ['exists:students,id'],
                'title' => 'nullable|string|max:255',
                'subject_id' => 'nullable|integer|exists:subjects,id',
                'due_at' => 'nullable|date',
                'due_date' => 'nullable|date',
                'teacher_id' => 'nullable|integer',
                'possible_xp' => 'nullable|integer|min:0',
                'activities' => 'required|array|min:1|max:'.LearningActivityMap::MAX_PER_ASSIGN,
                'activities.*.activity_type' => [
                    'required',
                    Rule::in(LearningActivityMap::types()),
                ],
                'activities.*.activity_id' => 'required|integer|min:1',
            ];
        }

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
            'possible_xp' => 'nullable|integer|min:0',
        ];
    }

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
