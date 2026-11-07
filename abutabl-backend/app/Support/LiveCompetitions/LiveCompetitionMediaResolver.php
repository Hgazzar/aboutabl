<?php

namespace App\Support\LiveCompetitions;

use App\Models\FileManagement;

/**
 * Resolves Excel media cells through AbuTabl File Management only.
 * Cell format matches ActivityQuestionsImport::findFileByCell(): name.extension
 */
class LiveCompetitionMediaResolver
{
    /**
     * @return array{ok:bool,stored_path:?string,file_id:?int,error:?string,optional_omitted?:bool}
     */
    public function resolve(?string $cell, string $field, bool $required): array
    {
        $raw = trim((string) $cell);
        if ($raw === '') {
            if ($required) {
                return $this->fail($field.' is required.');
            }

            return [
                'ok' => true,
                'stored_path' => null,
                'file_id' => null,
                'error' => null,
                'optional_omitted' => true,
            ];
        }

        $parsed = $this->parseNameAndType($raw);
        if ($parsed === null) {
            return $this->fail(
                $field.' must be a File Management name.extension value (example: monkey.png). Standalone /assets paths are not imported automatically.'
            );
        }

        $matches = $this->findByNameAndType($parsed['name'], $parsed['type']);
        if (count($matches) === 0) {
            return $this->fail(
                $field.' "'.$parsed['name'].'.'.$parsed['type'].'" is not registered in File Management. Upload it there before import.'
            );
        }
        if (count($matches) > 1) {
            return $this->fail(
                $field.' "'.$parsed['name'].'.'.$parsed['type'].'" matches multiple File Management rows. Resolve the duplicate before import.'
            );
        }

        $file = $matches[0];
        if (! $this->physicalFileExists($file)) {
            return $this->fail(
                $field.' "'.$parsed['name'].'.'.$parsed['type'].'" is listed in File Management but the file is missing on disk.'
            );
        }

        return [
            'ok' => true,
            'stored_path' => $this->storedPath($file),
            'file_id' => isset($file['id']) ? (int) $file['id'] : null,
            'error' => null,
        ];
    }

    /**
     * @return array{name:string,type:string}|null
     */
    public function parseNameAndType(string $cell): ?array
    {
        $value = trim($cell);
        if ($value === '') {
            return null;
        }

        $value = str_replace('\\', '/', $value);
        $value = ltrim($value, '/');
        if (str_contains($value, '/')) {
            $value = basename($value);
        }

        if (strpos($value, '.') === false) {
            return null;
        }

        $parts = explode('.', $value);
        $type = strtolower(trim((string) array_pop($parts)));
        $name = trim(implode('.', $parts));
        if ($name === '' || $type === '') {
            return null;
        }

        return ['name' => $name, 'type' => $type];
    }

    /**
     * @return list<array<string,mixed>>
     */
    protected function findByNameAndType(string $name, string $type): array
    {
        return FileManagement::query()
            ->where('name', $name)
            ->where('type', $type)
            ->get()
            ->map(function (FileManagement $file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'type' => $file->type,
                    'hashName' => $file->hashName,
                    'path' => $file->getRawOriginal('path'),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string,mixed>  $file
     */
    protected function physicalFileExists(array $file): bool
    {
        $relative = $file['path'] ?? null;
        if (is_string($relative) && preg_match('#/storage/(.+)$#', $relative, $m)) {
            $relative = $m[1];
        }

        $candidates = [];
        if (is_string($relative) && $relative !== '') {
            if (str_starts_with($relative, 'scrom/')) {
                $candidates[] = public_path($relative);
                $candidates[] = base_path($relative);
            } else {
                $candidates[] = storage_path('app/public/'.$relative);
                $candidates[] = public_path('storage/'.$relative);
                $candidates[] = storage_path('app/'.$relative);
            }
        }

        $hashName = $file['hashName'] ?? null;
        if (is_string($hashName) && $hashName !== '') {
            $candidates[] = storage_path('app/public/files_maanger/'.$hashName);
            $candidates[] = public_path('storage/files_maanger/'.$hashName);
        }

        foreach (array_unique($candidates) as $candidate) {
            if ($candidate && is_file($candidate)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Path stored on catalog rows — same convention as ActivityQuestionsImport.
     *
     * @param  array<string,mixed>  $file
     */
    protected function storedPath(array $file): string
    {
        $hashName = $file['hashName'] ?? null;
        if (is_string($hashName) && $hashName !== '') {
            return 'storage/files_maanger/'.$hashName;
        }

        $relative = ltrim((string) ($file['path'] ?? ''), '/');
        if ($relative !== '') {
            return str_starts_with($relative, 'storage/') ? $relative : 'storage/'.$relative;
        }

        return 'storage/files_maanger/'.($file['name'] ?? 'file');
    }

    /**
     * @return array{ok:bool,stored_path:null,file_id:null,error:string}
     */
    private function fail(string $message): array
    {
        return [
            'ok' => false,
            'stored_path' => null,
            'file_id' => null,
            'error' => $message,
        ];
    }
}
