<?php

namespace App\Contracts\Assignment;

/**
 * Assignment Materials SSOT reader (assignment_materials).
 */
interface AssignmentMaterialResolverInterface
{
    /**
     * Flat serialized materials for an assign, ordered by sort_order then id.
     *
     * @return array<int, array<string, mixed>>
     */
    public function resolveForAssign(int $assignId): array;
}
