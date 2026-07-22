<?php

namespace App\Policies;

use App\Models\Assigns;
use App\Models\User;
use App\Support\Ownership\OwnershipGate;

/**
 * F-045D — Assignment ownership policy (created_by).
 */
class AssignmentPolicy
{
    public function viewAny(?User $user): bool
    {
        return $user !== null;
    }

    public function view(?User $user, Assigns $assign): bool
    {
        if ($user === null) {
            return false;
        }

        if (OwnershipGate::isAdminUser($user)) {
            return true;
        }

        return OwnershipGate::ownsAssignment($user, $assign);
    }

    public function create(?User $user): bool
    {
        return OwnershipGate::isTeacherUser($user);
    }

    public function update(?User $user, Assigns $assign): bool
    {
        return OwnershipGate::isTeacherUser($user)
            && OwnershipGate::ownsAssignment($user, $assign);
    }

    public function delete(?User $user, Assigns $assign): bool
    {
        return $this->update($user, $assign);
    }
}
