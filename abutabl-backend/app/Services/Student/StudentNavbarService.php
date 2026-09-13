<?php

namespace App\Services\Student;

use App\Models\Student;
use App\Services\Notification\NotificationInboxService;

class StudentNavbarService
{
    /** @var StudentXpService */
    private $xp;

    /** @var NotificationInboxService */
    private $inbox;

    public function __construct(StudentXpService $xp, NotificationInboxService $inbox)
    {
        $this->xp = $xp;
        $this->inbox = $inbox;
    }

    /**
     * @return array<string, mixed>
     */
    public function build(int $studentId): array
    {
        $student = Student::query()->find($studentId);
        if (! $student) {
            throw new \InvalidArgumentException('Student not found.');
        }

        $xp = $this->xp->syncAndGet($studentId);

        $unread = $this->inbox->unreadCount($this->inbox->recipientForStudent($student));

        $photoUrl = $student->photo
            ? (str_starts_with((string) $student->photo, 'http')
                ? $student->photo
                : asset('storage/'.$student->photo))
            : null;

        $locale = app()->getLocale() === 'ar';
        $displayName = $locale
            ? ($student->name_ar ?: $student->name)
            : ($student->name ?: $student->name_ar);

        return [
            'student' => [
                'id'         => (int) $student->id,
                'name'       => (string) $displayName,
                'photo_url'  => $photoUrl,
            ],
            'xp' => $xp,
            'notifications' => [
                'unread_count' => (int) $unread,
            ],
        ];
    }
}
