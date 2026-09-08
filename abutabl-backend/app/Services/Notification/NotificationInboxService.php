<?php

namespace App\Services\Notification;

use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use InvalidArgumentException;

/**
 * NOTIF-001 — in-app notification inbox core (Phase 1 ownership + Phase 2 list contract).
 *
 * SSOT: custom `notifications` table (not Laravel database notifications).
 *
 * Recipient contract (application-level polymorphic IDs — no unified identity table):
 * - student → students.id
 * - teacher → users.id (non-admin staff)
 * - admin   → users.id (users.type === admin)
 * - system actor: from_user_type=system, from_user_id=null
 *
 * Compatibility fields `type` + `type_id` remain the entity/event key (no event_key in Phase 2).
 * List deep-links are normalized at read time via NotificationUrlNormalizer (no DB rewrite).
 *
 * FK note: migration historically FKs *_user_id → users.id while student ids are stored
 * for student recipients/actors. Phase 1 formalizes the contract in code and DEFERs
 * risky FK migration to protect historical rows.
 */
class NotificationInboxService
{
    public const TYPE_STUDENT = 'student';

    public const TYPE_TEACHER = 'teacher';

    public const TYPE_ADMIN = 'admin';

    public const TYPE_SYSTEM = 'system';

    /**
     * Resolve inbox recipient from authenticated Student (user-api).
     *
     * @return array{type: string, id: int}
     */
    public function recipientForStudent(Student $student): array
    {
        return [
            'type' => self::TYPE_STUDENT,
            'id' => (int) $student->id,
        ];
    }

    /**
     * Resolve inbox recipient from authenticated User (admin-api).
     * Admins use to_user_type=admin; other staff use teacher (existing rows).
     *
     * @return array{type: string, id: int}
     */
    public function recipientForStaffUser(User $user): array
    {
        $type = ((string) ($user->type ?? '')) === self::TYPE_ADMIN
            ? self::TYPE_ADMIN
            : self::TYPE_TEACHER;

        return [
            'type' => $type,
            'id' => (int) $user->id,
        ];
    }

    /**
     * @param  array{type: string, id: int}  $recipient
     */
    public function ownedQuery(array $recipient)
    {
        $this->assertRecipient($recipient);

        return Notification::query()
            ->where('to_user_type', $recipient['type'])
            ->where('to_user_id', $recipient['id']);
    }

    /**
     * Mark one notification read if owned. Returns affected row count (0 = not owned / missing).
     *
     * @param  array{type: string, id: int}  $recipient
     */
    public function markRead(array $recipient, int $notificationId): int
    {
        if ($notificationId <= 0) {
            return 0;
        }

        return $this->ownedQuery($recipient)
            ->where('id', $notificationId)
            ->update(['is_read' => 1]);
    }

    /**
     * Mark all unread owned notifications as read. Idempotent.
     *
     * @param  array{type: string, id: int}  $recipient
     */
    public function markAllRead(array $recipient): int
    {
        return $this->ownedQuery($recipient)
            ->whereIn('is_read', [0, '0', false])
            ->update(['is_read' => 1]);
    }

    /**
     * Hard-delete all owned notifications (existing product behavior).
     *
     * @param  array{type: string, id: int}  $recipient
     */
    public function deleteAll(array $recipient): int
    {
        return $this->ownedQuery($recipient)->delete();
    }

    /**
     * Unread count for recipient — same definition as navbar/dashboard (is_read = 0).
     *
     * @param  array{type: string, id: int}  $recipient
     */
    public function unreadCount(array $recipient): int
    {
        return (int) $this->ownedQuery($recipient)
            ->whereIn('is_read', [0, '0', false])
            ->count();
    }

    /**
     * Create notification if missing for idempotency key
     * (type, type_id, to_user_type, to_user_id).
     *
     * When type is null/empty OR type_id is null, skips dedupe and always creates
     * (preserves producers that intentionally lack a stable key, e.g. login).
     *
     * @param  array<string, mixed>  $attrs
     */
    public function createIfMissing(array $attrs): Notification
    {
        $toType = isset($attrs['to_user_type']) ? (string) $attrs['to_user_type'] : '';
        $toId = (int) ($attrs['to_user_id'] ?? 0);
        if ($toType === '' || $toId <= 0) {
            throw new InvalidArgumentException('Notification requires to_user_type and to_user_id.');
        }

        $type = array_key_exists('type', $attrs) ? $attrs['type'] : null;
        $typeId = array_key_exists('type_id', $attrs) ? $attrs['type_id'] : null;
        $typeStr = is_string($type) ? trim($type) : (is_numeric($type) ? (string) $type : '');
        $hasStableKey = $typeStr !== '' && $typeId !== null && $typeId !== '';

        if ($hasStableKey) {
            $exists = Notification::query()
                ->where('type', $typeStr)
                ->where('type_id', $typeId)
                ->where('to_user_type', $toType)
                ->where('to_user_id', $toId)
                ->exists();

            if ($exists) {
                return Notification::query()
                    ->where('type', $typeStr)
                    ->where('type_id', $typeId)
                    ->where('to_user_type', $toType)
                    ->where('to_user_id', $toId)
                    ->orderByDesc('id')
                    ->first();
            }
        }

        $payload = [
            'title' => $attrs['title'] ?? null,
            'description' => $attrs['description'] ?? null,
            'from_user_type' => $attrs['from_user_type'] ?? null,
            'from_user_id' => array_key_exists('from_user_id', $attrs) ? $attrs['from_user_id'] : null,
            'to_user_type' => $toType,
            'to_user_id' => $toId,
            'url' => $attrs['url'] ?? null,
            'type' => $hasStableKey ? $typeStr : ($typeStr !== '' ? $typeStr : $type),
            'type_id' => $typeId,
            'is_read' => $attrs['is_read'] ?? 0,
        ];

        if (($payload['from_user_type'] ?? null) === self::TYPE_SYSTEM) {
            $payload['from_user_id'] = null;
        }

        return Notification::create($payload);
    }

    /**
     * @param  array{type: string, id: int}  $recipient
     */
    private function assertRecipient(array $recipient): void
    {
        $type = (string) ($recipient['type'] ?? '');
        $id = (int) ($recipient['id'] ?? 0);
        if (! in_array($type, [self::TYPE_STUDENT, self::TYPE_TEACHER, self::TYPE_ADMIN], true) || $id <= 0) {
            throw new InvalidArgumentException('Invalid notification recipient.');
        }
    }
}
