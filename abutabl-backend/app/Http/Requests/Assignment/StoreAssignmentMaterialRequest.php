<?php

namespace App\Http\Requests\Assignment;

use App\Http\Requests\Assignment\Concerns\ReturnsGeneralTraitValidation;
use App\Http\Requests\Assignment\Concerns\ValidatesUploadedFileExtension;
use App\Models\AssignmentMaterial;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssignmentMaterialRequest extends FormRequest
{
    use ReturnsGeneralTraitValidation;
    use ValidatesUploadedFileExtension;

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

        $rules = [
            'kind' => ['required', 'string', Rule::in(AssignmentMaterial::KINDS)],
            'label' => ['nullable', 'string', 'max:255'],
            'duration_ms' => ['nullable', 'integer', 'min:1'],
        ];

        if ($kind === AssignmentMaterial::KIND_LINK) {
            $rules['url'] = ['required', 'string', 'url', 'max:2048'];
            $rules['external_url'] = ['nullable', 'string', 'url', 'max:2048'];
        } elseif ($kind === AssignmentMaterial::KIND_VOICE) {
            // max:20480 = 20MB infrastructure safety (not a product policy claim).
            $rules['file'] = $this->fileMustHaveExtension(
                ['webm', 'mp3', 'wav', 'm4a', 'ogg', 'aac', 'mpeg', 'mpga'],
                20480
            );
        } elseif ($kind === AssignmentMaterial::KIND_FILE) {
            // Extension-based: shared hosts often mis-detect PDF MIME via finfo.
            $rules['file'] = $this->fileMustHaveExtension(
                ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip'],
                20480
            );
        } else {
            $rules['file'] = ['required', 'file', 'max:20480'];
        }

        return $rules;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('external_url') && ! $this->filled('url')) {
            $this->merge(['url' => $this->input('external_url')]);
        }
    }
}
