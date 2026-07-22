<?php

namespace App\Support\Ownership;

use App\Models\Assigns;
use App\Models\QuizRuntime\QuizAttempt;
use App\Models\User;
use RuntimeException;

/**
 * F-045D — Centralized ownership checks (frozen F-045C.1 model).
 */
class OwnershipGate
{
    public static function isAdminUser(?object $user): bool
    {
        return $user !== null
            && isset($user->type)
            && (string) $user->type === 'admin';
    }

    public static function isTeacherUser(?object $user): bool
    {
        return $user !== null
            && isset($user->type)
            && (string) $user->type !== 'admin';
    }

    public static function ownsAssignment(?object $user, Assigns $assign): bool
    {
        if ($user === null) {
            return false;
        }

        return (int) $assign->created_by === (int) $user->id;
    }

    /**
     * Reject teacher_id spoof — server always uses authenticated teacher.
     *
     * @throws RuntimeException
     */
    public static function assertAuthTeacherId(?int $requestedTeacherId, int $authUserId): void
    {
        if ($requestedTeacherId !== null
            && $requestedTeacherId > 0
            && $requestedTeacherId !== $authUserId) {
            throw new RuntimeException('Forbidden.', 403);
        }
    }

    /**
     * Mandatory student attempt ownership (IDOR protection).
     *
     * @throws RuntimeException
     */
    public static function assertStudentOwnsAttempt(int $studentId, QuizAttempt $attempt): void
    {
        if ($studentId <= 0 || (int) $attempt->student_id !== $studentId) {
            throw new RuntimeException('Forbidden.', 403);
        }
    }

    /**
     * Teacher may review attempts only for assignments they own (created_by).
     */
    public static function teacherOwnsAttemptAssignment(User $teacher, QuizAttempt $attempt): bool
    {
        if ($attempt->assign_id === null) {
            return false;
        }

        return Assigns::query()
            ->where('id', (int) $attempt->assign_id)
            ->where('created_by', (int) $teacher->id)
            ->exists();
    }

    /**
     * @return int[]
     */
    public static function ownedQuizAssignIds(User $teacher, array $schoolIds): array
    {
        return Assigns::query()
            ->forTeacher((int) $teacher->id, $schoolIds)
            ->where('type', 'quizes')
            ->pluck('id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->all();
    }
}
