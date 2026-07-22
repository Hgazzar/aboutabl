<?php

namespace App\Policies\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\User;
use App\Support\Ownership\OwnershipGate;

/**
 * F-045D — Quiz attempt access for admin-api (teacher/admin review paths).
 */
class QuizAttemptPolicy
{
    public function view(?User $user, QuizAttempt $attempt): bool
    {
        if ($user === null) {
            return false;
        }

        if (OwnershipGate::isAdminUser($user)) {
            return true;
        }

        return OwnershipGate::teacherOwnsAttemptAssignment($user, $attempt);
    }

    public function grade(?User $user, QuizAttempt $attempt): bool
    {
        return $this->view($user, $attempt);
    }

    public function regrade(?User $user, QuizAttempt $attempt): bool
    {
        return $this->view($user, $attempt);
    }
}
