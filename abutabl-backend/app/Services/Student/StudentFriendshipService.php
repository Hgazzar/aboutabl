<?php

namespace App\Services\Student;

use App\Models\Student;
use App\Models\StudentFriendship;
use App\Services\SmartInsight\InsightMetricsReader;
use InvalidArgumentException;
use RuntimeException;

class StudentFriendshipService
{
    /** @var InsightMetricsReader */
    private $metricsReader;

    public function __construct(InsightMetricsReader $metricsReader)
    {
        $this->metricsReader = $metricsReader;
    }

    /**
     * Accepted friends for the authenticated student, enriched with streak.
     *
     * @return array{available: bool, items: array<int, array<string, mixed>>}
     */
    public function listAcceptedFriends(Student $actor): array
    {
        $actorId = (int) $actor->id;

        $friendships = StudentFriendship::query()
            ->acceptedForStudent($actorId)
            ->with([
                'student:id,name,name_ar,photo,status,school_id,class_id',
                'friendStudent:id,name,name_ar,photo,status,school_id,class_id',
            ])
            ->limit($this->maxAccepted())
            ->get();

        $items = [];

        foreach ($friendships as $friendship) {
            $friend = $this->otherStudent($friendship, $actorId);
            if ($friend === null) {
                continue;
            }

            $streakPayload = $this->metricsReader->streakPayloadForStudent((int) $friend->id);
            $currentStreak = (int) ($streakPayload['current_streak'] ?? 0);

            $items[] = [
                'student_id' => (int) $friend->id,
                'name' => $this->displayName($friend),
                'photo_url' => $this->photoUrl($friend->photo),
                'current_streak' => $currentStreak,
                'streak_active' => $currentStreak > 0,
            ];
        }

        usort($items, function (array $a, array $b) {
            if ($a['current_streak'] !== $b['current_streak']) {
                return $b['current_streak'] <=> $a['current_streak'];
            }

            $nameCmp = strcasecmp((string) $a['name'], (string) $b['name']);
            if ($nameCmp !== 0) {
                return $nameCmp;
            }

            return $a['student_id'] <=> $b['student_id'];
        });

        return [
            'available' => true,
            'items' => array_values($items),
        ];
    }

    public function invite(Student $actor, int $targetStudentId): StudentFriendship
    {
        $actorId = (int) $actor->id;

        if ($targetStudentId <= 0) {
            throw new InvalidArgumentException('Target student is required.');
        }

        if ($targetStudentId === $actorId) {
            throw new InvalidArgumentException('You cannot invite yourself.');
        }

        $target = Student::query()->find($targetStudentId);
        if ($target === null) {
            throw new RuntimeException('Target student not found.', 404);
        }

        if (! $this->isActiveStudent($target)) {
            throw new InvalidArgumentException('Target student is not available.');
        }

        $this->assertSameSchoolAndClass($actor, $target);
        $this->assertNoExistingRelationship($actorId, $targetStudentId);
        $this->assertUnderFriendLimit($actorId);
        $this->assertUnderFriendLimit((int) $target->id);

        return StudentFriendship::query()->create([
            'student_id' => $actorId,
            'friend_student_id' => $targetStudentId,
            'status' => StudentFriendship::STATUS_PENDING,
            'school_id' => (int) $actor->school_id,
            'accepted_at' => null,
        ]);
    }

    public function accept(Student $actor, int $friendshipId): StudentFriendship
    {
        $actorId = (int) $actor->id;
        $friendship = $this->findOwnedFriendshipOrFail($friendshipId);

        if ((int) $friendship->friend_student_id !== $actorId) {
            throw new RuntimeException('Only the invitee can accept this invitation.', 403);
        }

        if ($friendship->status !== StudentFriendship::STATUS_PENDING) {
            throw new InvalidArgumentException('Only pending invitations can be accepted.');
        }

        $inviter = Student::query()->find((int) $friendship->student_id);
        if ($inviter === null || ! $this->isActiveStudent($inviter)) {
            throw new InvalidArgumentException('Inviter is not available.');
        }

        if (! $this->isActiveStudent($actor)) {
            throw new InvalidArgumentException('Your account is not available.');
        }

        $this->assertSameSchoolAndClass($actor, $inviter);
        $this->assertUnderFriendLimit($actorId);
        $this->assertUnderFriendLimit((int) $inviter->id);

        $friendship->status = StudentFriendship::STATUS_ACCEPTED;
        $friendship->accepted_at = now();
        $friendship->save();

        return $friendship->fresh();
    }

    public function remove(Student $actor, int $friendshipId): void
    {
        $actorId = (int) $actor->id;
        $friendship = $this->findOwnedFriendshipOrFail($friendshipId);

        if ($friendship->status === StudentFriendship::STATUS_PENDING) {
            if ((int) $friendship->student_id !== $actorId) {
                throw new RuntimeException('Only the inviter can cancel this invitation.', 403);
            }
            $friendship->delete();

            return;
        }

        if ($friendship->status === StudentFriendship::STATUS_ACCEPTED) {
            if ((int) $friendship->student_id !== $actorId
                && (int) $friendship->friend_student_id !== $actorId) {
                throw new RuntimeException('You cannot modify this friendship.', 403);
            }
            $friendship->delete();

            return;
        }

        throw new InvalidArgumentException('Invalid friendship status.');
    }

    public function maxAccepted(): int
    {
        $max = (int) config('student_friends.max_accepted', 50);

        return $max > 0 ? $max : 50;
    }

    public function acceptedCount(int $studentId): int
    {
        return StudentFriendship::query()
            ->acceptedForStudent($studentId)
            ->count();
    }

    private function findOwnedFriendshipOrFail(int $friendshipId): StudentFriendship
    {
        $friendship = StudentFriendship::query()->find($friendshipId);
        if ($friendship === null) {
            throw new RuntimeException('Friendship not found.', 404);
        }

        return $friendship;
    }

    private function assertSameSchoolAndClass(Student $a, Student $b): void
    {
        if ((int) $a->school_id <= 0 || (int) $b->school_id <= 0
            || (int) $a->school_id !== (int) $b->school_id) {
            throw new InvalidArgumentException('Friends must be in the same school.');
        }

        if ((int) $a->class_id <= 0 || (int) $b->class_id <= 0
            || (int) $a->class_id !== (int) $b->class_id) {
            throw new InvalidArgumentException('Friends must be in the same class.');
        }
    }

    private function assertNoExistingRelationship(int $actorId, int $targetId): void
    {
        $existing = StudentFriendship::query()
            ->where(function ($q) use ($actorId, $targetId) {
                $q->where(function ($inner) use ($actorId, $targetId) {
                    $inner->where('student_id', $actorId)
                        ->where('friend_student_id', $targetId);
                })->orWhere(function ($inner) use ($actorId, $targetId) {
                    $inner->where('student_id', $targetId)
                        ->where('friend_student_id', $actorId);
                });
            })
            ->first();

        if ($existing === null) {
            return;
        }

        if ($existing->status === StudentFriendship::STATUS_ACCEPTED) {
            throw new InvalidArgumentException('You are already friends.');
        }

        // M1: incoming pending from target → actor
        if ((int) $existing->student_id === $targetId
            && (int) $existing->friend_student_id === $actorId
            && $existing->status === StudentFriendship::STATUS_PENDING) {
            throw new InvalidArgumentException(
                'An incoming pending invitation already exists. Accept it instead of inviting again.'
            );
        }

        // Duplicate outgoing pending actor → target
        if ((int) $existing->student_id === $actorId
            && (int) $existing->friend_student_id === $targetId
            && $existing->status === StudentFriendship::STATUS_PENDING) {
            throw new InvalidArgumentException('A pending invitation already exists.');
        }

        throw new InvalidArgumentException('A friendship relationship already exists.');
    }

    private function assertUnderFriendLimit(int $studentId): void
    {
        if ($this->acceptedCount($studentId) >= $this->maxAccepted()) {
            throw new InvalidArgumentException('Friend limit reached.');
        }
    }

    private function isActiveStudent(Student $student): bool
    {
        $status = $student->status;

        return $status === 1 || $status === '1';
    }

    private function otherStudent(StudentFriendship $friendship, int $actorId): ?Student
    {
        if ((int) $friendship->student_id === $actorId) {
            return $friendship->friendStudent;
        }

        if ((int) $friendship->friend_student_id === $actorId) {
            return $friendship->student;
        }

        return null;
    }

    private function displayName(Student $student): string
    {
        if (app()->getLocale() === 'ar' && ! empty($student->name_ar)) {
            return (string) $student->name_ar;
        }

        return (string) ($student->name ?: $student->name_ar ?: '');
    }

    private function photoUrl(?string $photo): ?string
    {
        if ($photo === null || trim($photo) === '') {
            return null;
        }

        if (str_starts_with((string) $photo, 'http')) {
            return $photo;
        }

        return asset('storage/'.ltrim($photo, '/'));
    }
}
