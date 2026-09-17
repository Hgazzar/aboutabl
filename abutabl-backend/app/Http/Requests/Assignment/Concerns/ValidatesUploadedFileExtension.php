<?php

namespace App\Http\Requests\Assignment\Concerns;

use Illuminate\Http\UploadedFile;

/**
 * Validate uploads by client extension.
 *
 * Shared hosts often mis-detect PDF/Office MIME via finfo, so Laravel `mimes:`
 * rejects valid files with 422 while images still pass.
 *
 * Also maps PHP upload error codes to clearer messages (size / tmp / write).
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
            // Intentionally skip Laravel's `file` rule — it only says
            // "The file failed to upload." without distinguishing size limits.
            function ($attribute, $value, $fail) use ($allowed, $maxKb) {
                if (! $value instanceof UploadedFile) {
                    $fail('A file is required.');

                    return;
                }

                if (! $value->isValid()) {
                    $fail($this->uploadFailureMessage($value));

                    return;
                }

                $sizeBytes = (int) $value->getSize();
                if ($sizeBytes > ($maxKb * 1024)) {
                    $fail('The file may not be greater than '.round($maxKb / 1024, 1).' MB.');

                    return;
                }

                $ext = strtolower((string) $value->getClientOriginalExtension());
                if ($ext === '' || ! in_array($ext, $allowed, true)) {
                    $fail('The file must be a file of type: '.implode(', ', $allowed).'.');
                }
            },
        ];
    }

    private function uploadFailureMessage(UploadedFile $file): string
    {
        $code = (int) $file->getError();

        if ($code === UPLOAD_ERR_INI_SIZE || $code === UPLOAD_ERR_FORM_SIZE) {
            return 'The file is too large for the server upload limit. Try a smaller PDF, or ask the host to raise upload_max_filesize / post_max_size.';
        }

        if ($code === UPLOAD_ERR_NO_TMP_DIR || $code === UPLOAD_ERR_CANT_WRITE) {
            return 'The server could not save the upload (temp disk). Please try again or contact support.';
        }

        if ($code === UPLOAD_ERR_PARTIAL) {
            return 'The upload was interrupted. Please try again.';
        }

        return 'The file failed to upload. Please try again.';
    }
}
