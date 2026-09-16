<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use App\Http\Requests\Assignment\Concerns\ValidatesUploadedFileExtension;
use App\Models\AssignmentStudentWork;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssignmentStudentWorkRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;
    use ValidatesUploadedFileExtension;

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
            $rules['file'] = $this->fileMustHaveExtension(
                ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                $maxKb
            );
        } elseif ($kind === AssignmentStudentWork::KIND_DOCUMENT) {
            // Extension-based: staging hosts often mis-detect PDF MIME via finfo.
            $rules['file'] = $this->fileMustHaveExtension(
                ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip'],
                $maxKb
            );
        } elseif ($kind === AssignmentStudentWork::KIND_VOICE) {
            $rules['file'] = $this->fileMustHaveExtension(
                ['webm', 'mp3', 'wav', 'm4a', 'ogg', 'aac', 'mpeg', 'mpga'],
                $maxKb
            );
        } else {
            $rules['file'] = ['required', 'file', 'max:'.$maxKb];
        }

        return $rules;
    }
}
