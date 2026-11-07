<?php

namespace Tests\Support;

use App\Support\LiveCompetitions\LiveCompetitionMediaResolver;

class FakeLiveCompetitionMediaResolver extends LiveCompetitionMediaResolver
{
    /** @var list<array<string,mixed>> */
    public $files = [];

    public $diskExists = true;

    /**
     * @return list<array<string,mixed>>
     */
    protected function findByNameAndType(string $name, string $type): array
    {
        $matches = [];
        foreach ($this->files as $file) {
            if (($file['name'] ?? '') === $name && ($file['type'] ?? '') === $type) {
                $matches[] = $file;
            }
        }

        return $matches;
    }

    /**
     * @param  array<string,mixed>  $file
     */
    protected function physicalFileExists(array $file): bool
    {
        if (array_key_exists('exists', $file)) {
            return (bool) $file['exists'];
        }

        return $this->diskExists;
    }
}
