<?php

namespace App\Contracts\Assignment;

/**
 * F-041C — Stub for future Assignment Materials (Content Library).
 * Foundation: always empty; no schema or storage.
 */
interface AssignmentMaterialResolverInterface
{
    /**
     * @return array<int, mixed>
     */
    public function resolveForAssign(int $assignId): array;
}
