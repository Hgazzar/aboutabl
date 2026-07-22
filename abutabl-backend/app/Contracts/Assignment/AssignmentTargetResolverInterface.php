<?php

namespace App\Contracts\Assignment;

/**
 * F-041C — Resolve assign targets (students) from request scope.
 */
interface AssignmentTargetResolverInterface
{
    /**
     * @param  array<string, mixed>  $input
     * @return array<int, int>
     */
    public function resolveStudentIds(array $input): array;
}
