<?php

namespace Tests\Unit\Notification;

use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use App\Services\Notification\NotificationInboxService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

class NotificationInboxServiceTest extends TestCase
{
    /** @var int[] */
    private $createdIds = [];

    /** @var int[] */
    private $createdUserIds = [];

    protected function tearDown(): void
    {
        if ($this->createdIds !== []) {
            try {
                Notification::query()->whereIn('id', $this->createdIds)->delete();
            } catch (Throwable $e) {
                // ignore
            }
        }
        if ($this->createdUserIds !== []) {
            try {
                DB::table('users')->whereIn('id', $this->createdUserIds)->delete();
            } catch (Throwable $e) {
                // ignore
            }
        }
        parent::tearDown();
    }

    private function requireTable(): void
    {
        try {
            if (! Schema::hasTable('notifications')) {
                $this->markTestSkipped('notifications table missing.');
            }
        } catch (Throwable $e) {
            $this->markTestSkipped('Database unavailable: '.$e->getMessage());
        }
    }

    private function track(Notification $n): Notification
    {
        $this->createdIds[] = (int) $n->id;

        return $n;
    }

    /**
     * @param  callable(): Notification  $factory
     */
    private function withRelaxedFk(callable $factory): Notification
    {
        Schema::disableForeignKeyConstraints();
        try {
            return $factory();
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    public function test_create_if_missing_is_idempotent_for_stable_key(): void
    {
        $this->requireTable();

        $service = app(NotificationInboxService::class);
        $user = User::query()->orderBy('id')->first();
        if (! $user) {
            $this->markTestSkipped('No users.');
        }

        $attrs = [
            'title' => 'NOTIF-001 idempotency',
            'description' => 'first',
            'from_user_type' => NotificationInboxService::TYPE_SYSTEM,
            'from_user_id' => null,
            'to_user_type' => NotificationInboxService::TYPE_TEACHER,
            'to_user_id' => (int) $user->id,
            'url' => 'test/notif-001',
            'type' => 'notif_001_test_idempotent',
            'type_id' => 900001,
            'is_read' => 0,
        ];

        $first = $this->track($this->withRelaxedFk(fn () => $service->createIfMissing($attrs)));
        $attrs['description'] = 'second-should-not-create';
        $second = $this->withRelaxedFk(fn () => $service->createIfMissing($attrs));

        $this->assertSame((int) $first->id, (int) $second->id);
        $this->assertSame(1, Notification::query()
            ->where('type', 'notif_001_test_idempotent')
            ->where('type_id', 900001)
            ->where('to_user_type', 'teacher')
            ->where('to_user_id', (int) $user->id)
            ->count());
    }

    public function test_create_if_missing_allows_different_recipients(): void
    {
        $this->requireTable();

        $users = User::query()->orderBy('id')->limit(2)->get();
        if ($users->count() < 2) {
            $owner = $users->first();
            if (! $owner) {
                $this->markTestSkipped('No users.');
            }
            try {
                $suffix = substr((string) microtime(true), -6);
                $id = (int) DB::table('users')->insertGetId([
                    'name' => 'NOTIF Unit Other',
                    'username' => 'notif_unit_'.$suffix,
                    'email' => 'notif-unit-'.$suffix.'@test.local',
                    'phone' => '0166'.$suffix,
                    'password' => bcrypt('secret'),
                    'type' => 'teacher',
                    'status' => '1',
                    'verify' => '1',
                    'school_id' => (int) ($owner->school_id ?? 1),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->createdUserIds[] = $id;
                $users = collect([$owner, User::query()->find($id)]);
            } catch (Throwable $e) {
                $this->markTestSkipped('Need at least two users.');
            }
        }

        $service = app(NotificationInboxService::class);
        $a = $this->track($this->withRelaxedFk(fn () => $service->createIfMissing([
            'title' => 'A',
            'description' => 'A',
            'from_user_type' => 'system',
            'from_user_id' => null,
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $users[0]->id,
            'type' => 'notif_001_test_multi_recipient',
            'type_id' => 900002,
            'is_read' => 0,
        ])));
        $b = $this->track($this->withRelaxedFk(fn () => $service->createIfMissing([
            'title' => 'B',
            'description' => 'B',
            'from_user_type' => 'system',
            'from_user_id' => null,
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $users[1]->id,
            'type' => 'notif_001_test_multi_recipient',
            'type_id' => 900002,
            'is_read' => 0,
        ])));

        $this->assertNotSame((int) $a->id, (int) $b->id);
    }

    public function test_empty_type_skips_dedupe_and_creates_again(): void
    {
        $this->requireTable();

        $user = User::query()->orderBy('id')->first();
        if (! $user) {
            $this->markTestSkipped('No users.');
        }

        $service = app(NotificationInboxService::class);
        $attrs = [
            'title' => 'login-like',
            'description' => 'no stable type',
            'from_user_type' => 'system',
            'from_user_id' => null,
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $user->id,
            'type' => null,
            'type_id' => null,
            'is_read' => 0,
        ];

        $first = $this->track($this->withRelaxedFk(fn () => $service->createIfMissing($attrs)));
        $second = $this->track($this->withRelaxedFk(fn () => $service->createIfMissing($attrs)));

        $this->assertNotSame((int) $first->id, (int) $second->id);
    }

    public function test_recipient_resolution_and_unread_count(): void
    {
        $this->requireTable();

        $service = app(NotificationInboxService::class);
        $teacher = User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        $admin = User::query()->where('type', 'admin')->orderBy('id')->first();
        $student = Student::query()->orderBy('id')->first();

        if (! $teacher || ! $student) {
            $this->markTestSkipped('Need teacher + student.');
        }

        $tRec = $service->recipientForStaffUser($teacher);
        $this->assertSame('teacher', $tRec['type']);
        $this->assertSame((int) $teacher->id, $tRec['id']);

        if ($admin) {
            $aRec = $service->recipientForStaffUser($admin);
            $this->assertSame('admin', $aRec['type']);
            $this->assertSame((int) $admin->id, $aRec['id']);
        }

        $sRec = $service->recipientForStudent($student);
        $this->assertSame('student', $sRec['type']);

        $n = $this->track($this->withRelaxedFk(fn () => $service->createIfMissing([
            'title' => 'unread',
            'description' => 'u',
            'from_user_type' => 'system',
            'from_user_id' => null,
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $teacher->id,
            'type' => 'notif_001_unread',
            'type_id' => 900003,
            'is_read' => 0,
        ])));

        $before = $service->unreadCount($tRec);
        $this->assertGreaterThanOrEqual(1, $before);
        $service->markRead($tRec, (int) $n->id);
        $this->assertSame($before - 1, $service->unreadCount($tRec));
    }
}
