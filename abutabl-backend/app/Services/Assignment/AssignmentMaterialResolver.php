<?php

namespace App\Services\Assignment;

use App\Contracts\Assignment\AssignmentMaterialResolverInterface;

/**
 * F-041C — Materials stub. Ownership enforced in AssignmentService::materialsFor().
 */
class AssignmentMaterialResolver implements AssignmentMaterialResolverInterface
{
    public function resolveForAssign(int $assignId): array
    {
        return [];
    }
}
