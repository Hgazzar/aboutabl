<?php

namespace App\Http\Requests\Assignment\Concerns;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Preserve GeneralTrait validation JSON shape for Assignment FormRequests.
 */
trait ReturnsGeneralTraitValidation
{
    protected function failedValidation(Validator $validator)
    {
        $inputs = array_keys($validator->errors()->toArray());
        $field = $inputs[0] ?? '';
        $code = $this->legacyErrorCodeForField($field);

        throw new HttpResponseException(response()->json([
            'status' => false,
            'errNum' => $code,
            'msg' => $validator->errors()->first(),
        ], 400));
    }

    private function legacyErrorCodeForField(string $input): string
    {
        // Mirror GeneralTrait::getErrorCode for common assign fields; default E001.
        $map = [
            'school_id' => 'E001',
            'grade_id' => 'E001',
            'class_id' => 'E001',
            'student_id' => 'E001',
            'type' => 'E001',
            'type_id' => 'E001',
            'due_at' => 'E001',
            'due_date' => 'E001',
            'assign_id' => 'E001',
        ];

        return $map[$input] ?? 'E001';
    }
}
