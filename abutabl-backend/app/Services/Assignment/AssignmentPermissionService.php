<?php

namespace App\Services\Assignment;

use App\Models\Assigns;
use App\Support\Ownership\OwnershipGate;
use InvalidArgumentException;
use RuntimeException;

/**
 * F-045D — Assignment ownership enforcement (created_by SSOT).
 */
class AssignmentPermissionService
{
    /**
     * Always use authenticated teacher; reject teacher_id spoof.
     */
    public function resolveCreatedBy(?int $teacherId, int $authUserId): int
    {
        if ($teacherId !== null && $teacherId > 0 && $teacherId !== $authUserId) {
            throw new InvalidArgumentException('forbidden');
        }

        return $authUserId;
    }

    /**
     * @param  array<int, int>  $accessibleSchoolIds
     */
    public function schoolInScope(int $schoolId, array $accessibleSchoolIds): bool
    {
        if ($accessibleSchoolIds === []) {
            return false;
        }

        return in_array($schoolId, array_map('intval', $accessibleSchoolIds), true);
    }

    /**
     * Teachers create assignments; admin is view-only for assignment lifecycle.
     */
    public function canCreate(?object $user): bool
    {
        return OwnershipGate::isTeacherUser($user);
    }

    /**
     * Only the assignment owner (teacher) may delete; admin cannot mutate.
     */
    public function canDelete(?object $user, $assign = null): bool
    {
        if ($user === null || OwnershipGate::isAdminUser($user)) {
            return false;
        }

        if ($assign === null) {
            return true;
        }

        return $assign instanceof Assigns && OwnershipGate::ownsAssignment($user, $assign);
    }

    /**
     * Admin may view all in scope; teachers may view own assignments.
     */
    public function canView(?object $user, Assigns $assign, array $accessibleSchoolIds): bool
    {
        if ($user === null) {
            return false;
        }

        if (! $this->schoolInScope((int) $assign->school_id, $accessibleSchoolIds)) {
            return false;
        }

        if (OwnershipGate::isAdminUser($user)) {
            return true;
        }

        return OwnershipGate::ownsAssignment($user, $assign);
    }

    /**
     * Materials belong to assignment owner (future upload UI).
     *
     * @throws InvalidArgumentException
     */
    public function assertCanAccessMaterials(?object $user, Assigns $assign): void
    {
        if ($user === null) {
            throw new InvalidArgumentException('forbidden');
        }

        if (OwnershipGate::isAdminUser($user)) {
            return;
        }

        if (! OwnershipGate::ownsAssignment($user, $assign)) {
            throw new InvalidArgumentException('forbidden');
        }
    }

    /**
     * @throws RuntimeException
     */
    public function assertCanMutate(?object $user, Assigns $assign): void
    {
        if (! $this->canDelete($user, $assign)) {
            throw new RuntimeException('Forbidden.', 403);
        }
    }
}
