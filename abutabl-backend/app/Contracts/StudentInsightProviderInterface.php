<?php

namespace App\Contracts;

interface StudentInsightProviderInterface
{
    /**
     * @param  array<string, mixed>  $context
     * @return array{available: bool, text: string|null, generated_at: string|null}
     */
    public function build(array $context): array;
}
