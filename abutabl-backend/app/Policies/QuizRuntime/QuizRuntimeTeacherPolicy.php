<?php

namespace App\Policies\QuizRuntime;

use App\Models\User;

/**
 * F-045D — Teacher Runtime entry (list/review); admin-api authenticated.
 */
class QuizRuntimeTeacherPolicy
{
    public function listAttempts(?User $user): bool
    {
        return $user !== null;
    }

    public function reviewAttempts(?User $user): bool
    {
        return $user !== null;
    }
}
