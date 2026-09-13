<?php

namespace App\Http\Requests\Assignment;

use App\Models\AssignmentStudentWork;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssignmentStudentWorkRequest extends FormRequest
{
    /** Max upload size in kilobytes (100MB). */
    public const MAX_FILE_KB = 102400;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $kind = (string) $this->input('kind', '');
        $maxKb = self::MAX_FILE_KB;

        $rules = [
            'kind' => ['required', 'string', Rule::in(AssignmentStudentWork::KINDS)],
            'duration_ms' => ['nullable', 'integer', 'min:1'],
        ];

        if ($kind === AssignmentStudentWork::KIND_IMAGE) {
            $rules['file'] = ['required', 'file', 'max:'.$maxKb, 'mimes:jpg,jpeg,png,gif,webp'];
        } elseif ($kind === AssignmentStudentWork::KIND_DOCUMENT) {
            $rules['file'] = [
                'required',
                'file',
                'max:'.$maxKb,
                'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt,zip',
            ];
        } elseif ($kind === AssignmentStudentWork::KIND_VOICE) {
            $rules['file'] = ['required', 'file', 'max:'.$maxKb, 'mimes:webm,mp3,wav,m4a,ogg,aac,mpeg,mpga'];
        } else {
            $rules['file'] = ['required', 'file', 'max:'.$maxKb];
        }

        return $rules;
    }
}
