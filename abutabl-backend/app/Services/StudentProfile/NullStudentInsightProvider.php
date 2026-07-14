<?php

namespace App\Services\StudentProfile;

use App\Contracts\StudentInsightProviderInterface;

/**
 * Stub insight provider — no AI in v1. Replace binding later without changing API shape.
 */
class NullStudentInsightProvider implements StudentInsightProviderInterface
{
    /**
     * @param  array<string, mixed>  $context
     * @return array{available: bool, text: string|null, generated_at: string|null}
     */
    public function build(array $context): array
    {
        return [
            'available'    => false,
            'text'         => null,
            'generated_at' => null,
        ];
    }
}
