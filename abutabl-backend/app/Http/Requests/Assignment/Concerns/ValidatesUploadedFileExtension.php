<?php

namespace App\Http\Requests\Assignment\Concerns;

use Illuminate\Http\UploadedFile;

/**
 * Validate uploads by client extension.
 *
 * Shared hosts often mis-detect PDF/Office MIME via finfo, so Laravel `mimes:`
 * rejects valid files with 422 while images still pass.
 */
trait ValidatesUploadedFileExtension
{
    /**
     * @param  array<int, string>  $extensions
     * @return array<int, mixed>
     */
    protected function fileMustHaveExtension(array $extensions, int $maxKb): array
    {
        $allowed = array_values(array_unique(array_map('strtolower', $extensions)));

        return [
            'required',
            'file',
            'max:'.$maxKb,
            function ($attribute, $value, $fail) use ($allowed) {
                if (! $value instanceof UploadedFile || ! $value->isValid()) {
                    $fail(__('validation.uploaded', ['attribute' => 'file']));

                    return;
                }

                $ext = strtolower((string) $value->getClientOriginalExtension());
                if ($ext === '' || ! in_array($ext, $allowed, true)) {
                    $fail('The file must be a file of type: '.implode(', ', $allowed).'.');
                }
            },
        ];
    }
}
